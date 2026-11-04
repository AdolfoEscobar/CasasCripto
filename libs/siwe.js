// Helpers SIWE compartidos por el login (libs/auth.js) y la vinculación
// de wallet (app/api/auth/wallet). Sin dependencias de Next: testeables.
export function getRequestCookie(req, name) {
  const header = req?.headers?.get?.("cookie") || "";
  const found = header
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

// Dominio esperado del mensaje SIWE: el host que el navegador usó, leído de
// los headers del MISMO request (no de req.url: Auth.js puede normalizarlo,
// ej. a localhost, y rompería la verificación). Tras proxy (Vercel) manda
// x-forwarded-host; en directo, host. Incluye puerto cuando lo hay.
export function expectedSiweDomain(req) {
  const forwarded = req?.headers?.get?.("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const host = req?.headers?.get?.("host")?.trim();
  if (host) return host;
  try {
    return new URL(req.url).host;
  } catch {
    return null;
  }
}
