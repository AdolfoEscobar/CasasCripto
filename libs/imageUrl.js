// Validación de URLs de imagen para el privacy-scan (SAM 3.1). Meta
// descarga la imagen desde SUS servidores — si la URL no es pública y
// directa, responde 400 `media_url_not_fetchable`. Aquí fallamos rápido con
// un mensaje claro, ANTES de gastar cuota de IA o crédito del hackathon.

// Hosts que nunca se aceptan: el preflight lo hace nuestro servidor, así
// que sin esta lista la ruta serviría como proxy SSRF hacia la red interna
// (ej. metadata de la nube en 169.254.169.254). No es anti-DNS-rebinding de
// grado bancario, pero cierra el abuso trivial en un MVP/hackathon.
const BLOCKED_HOST_RE =
  /^(localhost|.*\.(local|localhost|internal|lan|home))$/i;

const BLOCKED_IP_RE =
  /^(0\.0\.0\.0|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|::$|fc00:|fe80:)/i;

export function validateImageUrlFormat(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Pega la URL de la imagen que quieres revisar" };
  }
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return {
      error: "Esa no es una URL válida. Pégala completa, empezando con https://",
    };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      error: "Esa no es una URL válida. Pégala completa, empezando con https://",
    };
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOST_RE.test(host) || BLOCKED_IP_RE.test(host)) {
    return {
      error: "Usa una URL de imagen pública de internet, no una dirección local",
    };
  }
  return { url: url.toString() };
}

// Preflight: ¿la imagen es descargable y es realmente una imagen? GET con
// timeout que solo inspecciona headers y cancela el body — no descargamos
// la foto completa, solo verificamos que exista y sea content-type imagen.
export async function preflightImageUrl(url, { timeoutMs = 8000 } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "CasasCripto/1.0 (privacy preflight)" },
    });
  } catch {
    return {
      ok: false,
      error:
        "No pudimos descargar esa imagen. Revisa que la URL sea pública y directa (que termine en .jpg, .png o similar).",
    };
  }
  try {
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.toLowerCase().startsWith("image/")) {
      return {
        ok: false,
        error:
          "Esa URL no devolvió una imagen directa. Usa el enlace directo a la foto (que termine en .jpg, .png o similar), no la página que la contiene.",
      };
    }
    return { ok: true };
  } finally {
    // No necesitamos el cuerpo — cancelarlo corta la descarga de inmediato.
    await res.body?.cancel().catch(() => {});
  }
}
