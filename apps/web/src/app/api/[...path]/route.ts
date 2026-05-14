/**
 * Catch-all proxy hacia el API backend.
 *
 * Rutas específicas (login, register) tienen su propio route.ts con mayor prioridad.
 * Este handler cubre todo lo demás: companies, contacts, opportunities, google oauth, etc.
 *
 * El cliente llama /api/<path> (mismo origen, sin CORS).
 * Este handler llama ${INTERNAL_API_URL}/api/<path> server-side.
 * Los Set-Cookie del upstream se aplican con NextResponse.cookies.set()
 * para garantizar que el navegador los reciba correctamente.
 */
import { type NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000';

// Headers hop-by-hop que no deben reenviarse
const SKIP_REQ = new Set([
  'connection', 'keep-alive', 'te', 'trailers',
  'transfer-encoding', 'upgrade', 'host',
]);

const SKIP_RES = new Set([
  'connection', 'keep-alive', 'te', 'trailers',
  'transfer-encoding', 'upgrade',
  'content-encoding', // Node fetch descomprime automáticamente
  'content-length',   // Puede ser incorrecto post-descompresión
]);

function parseSetCookie(header: string) {
  const parts = header.split(';').map((p) => p.trim());
  const [nameValue, ...attributes] = parts;
  const eqIndex = nameValue.indexOf('=');
  const name = nameValue.slice(0, eqIndex);
  const value = nameValue.slice(eqIndex + 1);

  const options: Record<string, unknown> = {};
  for (const attr of attributes) {
    const [key, ...valParts] = attr.split('=');
    const k = key.trim().toLowerCase();
    const v = valParts.join('=').trim();
    if (k === 'path') options.path = v;
    if (k === 'httponly') options.httpOnly = true;
    if (k === 'secure') options.secure = true;
    if (k === 'samesite') options.sameSite = v.toLowerCase() as 'lax' | 'strict' | 'none';
    if (k === 'max-age') options.maxAge = Number.parseInt(v, 10);
    // domain intencionalmente omitido: debe quedar en el dominio del proxy
  }

  return { name, value, options };
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  // El cliente llama /api/<path>, este handler recibe path = ['...']
  // El upstream espera /api/<path> también
  const upstream = `${API_URL}/api/${path.join('/')}${request.nextUrl.search}`;

  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_REQ.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  let body: ArrayBuffer | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const upstreamRes = await fetch(upstream, {
    method: request.method,
    headers: forwardHeaders,
    body,
    redirect: 'manual',
  });

  // Extraer cookies via getSetCookie() para evitar concatenación errónea
  const setCookies = upstreamRes.headers.getSetCookie?.() ?? [];

  // Construir headers de respuesta (sin cookies — se aplican abajo)
  const responseHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!SKIP_RES.has(lower) && lower !== 'set-cookie') {
      responseHeaders.append(key, value);
    }
  });

  // Redireccionamientos (OAuth initiate → Google, OAuth callback → /dashboard)
  if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
    const location = upstreamRes.headers.get('location') ?? '/';
    const redirectRes = NextResponse.redirect(location, { status: upstreamRes.status });

    // Copiar headers no-cookie
    responseHeaders.forEach((value, key) => {
      redirectRes.headers.append(key, value);
    });

    // Aplicar cookies con la API nativa de Next.js (ej: callback de Google)
    for (const cookieStr of setCookies) {
      const { name, value, options } = parseSetCookie(cookieStr);
      redirectRes.cookies.set(name, value, options as Parameters<typeof redirectRes.cookies.set>[2]);
    }

    return redirectRes;
  }

  const response = new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });

  // Aplicar cookies con la API nativa de Next.js
  for (const cookieStr of setCookies) {
    const { name, value, options } = parseSetCookie(cookieStr);
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
