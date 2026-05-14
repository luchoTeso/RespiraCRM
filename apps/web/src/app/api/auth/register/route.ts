/**
 * Ruta dedicada de registro que hace proxy al API y setea cookies
 * usando la API nativa de NextResponse.cookies.set().
 */
import { type NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000';

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
  }

  return { name, value, options };
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const apiRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const response = NextResponse.json(data);

  const setCookies = apiRes.headers.getSetCookie();
  for (const cookieStr of setCookies) {
    const { name, value, options } = parseSetCookie(cookieStr);
    response.cookies.set(name, value, options as any);
  }

  return response;
}
