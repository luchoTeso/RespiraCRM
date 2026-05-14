/**
 * Proxy reverso hacia el API.
 * El navegador siempre llama /backend/... (mismo origen — sin CORS).
 * Este handler reenvía la request al API real y devuelve la respuesta
 * íntegra, incluyendo Set-Cookie (crítico para la autenticación JWT).
 */
import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000';

// Headers hop-by-hop que no se deben reenviar
const SKIP_REQUEST_HEADERS = new Set([
  'connection',
  'keep-alive',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host', // el upstream tiene su propio host
]);

const SKIP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  // Node.js fetch descomprime automáticamente; estos headers quedarían inconsistentes
  'content-encoding',
  'content-length',
]);

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const upstream = `${API_URL}/${path.join('/')}${request.nextUrl.search}`;

  // Reenviar headers del cliente al API
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  // Reenviar body en métodos que lo admiten
  let body: ArrayBuffer | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const upstreamRes = await fetch(upstream, {
    method: request.method,
    headers: forwardHeaders,
    body,
    redirect: 'manual', // Pasar redirects al browser en vez de seguirlos server-side
  });

  // Construir headers de respuesta (incluye Set-Cookie)
  const responseHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    // Set-Cookie se maneja por separado más abajo
    if (
      !SKIP_RESPONSE_HEADERS.has(key.toLowerCase()) &&
      key.toLowerCase() !== 'set-cookie'
    ) {
      responseHeaders.append(key, value);
    }
  });

  // Set-Cookie necesita tratamiento especial: Headers.forEach() concatena
  // múltiples Set-Cookie en una sola línea separada por comas, lo cual el
  // navegador rechaza. getSetCookie() los devuelve como array individual.
  const setCookies = upstreamRes.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    responseHeaders.append('set-cookie', cookie);
  }

  // Redireccionamientos (OAuth initiate → Google, OAuth callback → /dashboard)
  if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
    const location = upstreamRes.headers.get('location') ?? '/';
    const redirectRes = NextResponse.redirect(location, {
      status: upstreamRes.status,
    });
    // Copiar headers al redirect (OAuth callback setea cookies Y redirige)
    responseHeaders.forEach((value, key) => {
      redirectRes.headers.append(key, value);
    });
    return redirectRes;
  }

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
