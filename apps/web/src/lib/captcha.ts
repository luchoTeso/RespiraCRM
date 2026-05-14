export function getCaptchaProvider() {
  return (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER ?? 'hcaptcha').toLowerCase();
}

export function getApiBaseUrl() {
  // En el servidor (SSR/RSC) conectamos directo al API por la red interna.
  // En el navegador usamos el proxy Next.js (/backend → API) para evitar
  // cualquier problema de CORS, mixed-content o variables bakeadas en build.
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:4000'
    );
  }
  // Cadena vacía = mismo origen; apiRequest agrega /api internamente
  return '';
}
