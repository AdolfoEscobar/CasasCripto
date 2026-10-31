// Helpers para fotos de propiedades — compartidos entre servidor y cliente.
//
// Modelo de datos: `Property.images` acepta dos formas por compatibilidad:
// - string (legado): URL externa pegada a mano antes del uploader propio.
// - objeto { src, srcSet?, width?, height? }: foto subida a Vercel Blob con
//   variantes responsive pre-generadas (ver app/api/uploads/route.js).
//
// Las fotos NUNCA pasan por el optimizador de imágenes de Vercel (cuota 0):
// se sirven directo desde el CDN de Blob con <img srcSet> (ver
// components/PropertyImage.js). El responsive y el formato moderno se
// resuelven al subir, no en cada request.

// Máximo de fotos por propiedad (lo aplican el formulario y las API routes).
export const MAX_PROPERTY_IMAGES = 8;

// Límite de body de las serverless functions de Vercel: cada upload es un
// solo archivo y el navegador lo pre-comprime antes (ver libs/clientImage.js).
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

// Anchos de las variantes pre-generadas. 640 cubre móvil y 1280 cubre
// desktop a 2x en los layouts actuales (tarjeta ~450px, detalle ~590px).
export const BLOB_IMAGE_WIDTHS = [640, 1280];

// Normaliza cualquier entrada (string legado u objeto) a una forma común.
// Devuelve null si no hay una URL utilizable.
export function normalizeImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    const src = image.trim();
    return src
      ? { src, srcSet: undefined, width: undefined, height: undefined }
      : null;
  }

  if (
    typeof image === "object" &&
    typeof image.src === "string" &&
    image.src.trim()
  ) {
    return {
      src: image.src.trim(),
      srcSet:
        typeof image.srcSet === "string" && image.srcSet.trim()
          ? image.srcSet.trim()
          : undefined,
      width: Number.isFinite(image.width) ? image.width : undefined,
      height: Number.isFinite(image.height) ? image.height : undefined,
    };
  }

  return null;
}

// Solo la URL principal (para OpenGraph, JSON-LD, scans de IA).
export function imageSrc(image) {
  return normalizeImage(image)?.src;
}

// URLs principales de una lista (para el JSON-LD `image`).
export function imageSrcList(images) {
  if (!Array.isArray(images)) return [];
  return images.map(imageSrc).filter(Boolean);
}

// Limpia un array para guardar en Mongo: quita entradas inválidas, recorta
// al máximo y conserva strings como strings (legado) y objetos como objetos.
export function sanitizeImages(images) {
  if (!Array.isArray(images)) return [];
  const out = [];
  for (const image of images) {
    const normalized = normalizeImage(image);
    if (!normalized) continue;
    if (typeof image === "string") {
      out.push(normalized.src);
    } else {
      out.push(
        JSON.parse(
          JSON.stringify({
            src: normalized.src,
            srcSet: normalized.srcSet,
            width: normalized.width,
            height: normalized.height,
          })
        )
      );
    }
    if (out.length >= MAX_PROPERTY_IMAGES) break;
  }
  return out;
}

// true solo para URLs que subimos nosotros (host de Vercel Blob + prefijo
// propio). Nunca borramos URLs externas pegadas por el usuario.
export function isManagedBlobUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".public.blob.vercel-storage.com") &&
      parsed.pathname.includes("/properties/")
    );
  } catch {
    return false;
  }
}

// Todas las URLs de Blob (src + variantes del srcSet) contenidas en una lista.
export function collectBlobUrls(images) {
  const urls = new Set();
  if (!Array.isArray(images)) return [];
  for (const image of images) {
    const normalized = normalizeImage(image);
    if (!normalized) continue;
    if (normalized.src && isManagedBlobUrl(normalized.src)) {
      urls.add(normalized.src);
    }
    if (normalized.srcSet) {
      for (const part of normalized.srcSet.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url && isManagedBlobUrl(url)) urls.add(url);
      }
    }
  }
  return [...urls];
}

// URLs de Blob que estaban en `before` y ya no están en `after` (para
// borrarlas al quitar fotos editando o al eliminar una propiedad).
export function removedBlobUrls(before, after) {
  const afterSet = new Set(collectBlobUrls(after));
  return collectBlobUrls(before).filter((url) => !afterSet.has(url));
}
