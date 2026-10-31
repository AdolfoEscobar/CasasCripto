// Pre-compresión de imágenes en el navegador, antes de subirlas.
//
// Por qué existe: las fotos de teléfono (3-8MB, y más cuando iOS convierte
// HEIC→JPEG al elegirlas del carrete) rebasan el límite de body de 4.5MB de
// las serverless functions de Vercel, y subirlas crudas es lento en datos
// móviles. La escalera de abajo garantiza que el archivo viaje por debajo
// del tope. El servidor vuelve a procesar con sharp de todos modos (nunca
// se confía en el cliente); esto es solo para que el archivo viaje ligero.

// Escalera de compresión estilo WhatsApp: se intenta el primer peldaño y,
// si el resultado sigue rebasando el tope, se reintenta con menos
// resolución/calidad. Los lados bajan en cada peldaño a propósito: si el
// navegador no soporta WebP en canvas y devuelve PNG (ignora `quality`),
// achicar dimensiones es lo único que reduce el peso.
const COMPRESSION_RUNGS = [
  { maxDimension: 1920, quality: 0.82 },
  { maxDimension: 1600, quality: 0.75 },
  { maxDimension: 1280, quality: 0.65 },
  { maxDimension: 1024, quality: 0.55 },
];

// Tope blando en cliente (con margen bajo el límite real de 4.5MB del
// servidor, que además suma el overhead del multipart).
const MAX_CLIENT_BYTES = 4 * 1024 * 1024;

// Archivos que el servidor acepta tal cual.
const PASSTHROUGH_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function renderRung(bitmap, maxDimension, quality) {
  const largest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxDimension / largest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );
}

export async function prepareImageForUpload(file) {
  if (!file || typeof file.type !== "string" || !file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }

  // HEIC/HEIF (iPhone): ni canvas en todos los navegadores ni sharp en el
  // servidor lo decodifican de forma confiable. iOS normalmente auto-convierte
  // a JPG al elegir desde el carrete, así que esto es un caso raro: mensaje
  // claro en vez de un fallo misterioso después.
  if (file.type === "image/heic" || file.type === "image/heif") {
    throw new Error(
      "Ese formato (HEIC) no es compatible: exporta la foto como JPG y vuelve a intentarlo"
    );
  }

  // Si no es un tipo que el servidor acepta, dejar que el servidor lo rechace
  // con su propio mensaje (no intentamos adivinar aquí).
  if (!PASSTHROUGH_TYPES.has(file.type)) return file;

  try {
    // from-image: aplica la orientación EXIF al decodificar. Sin esto, el
    // canvas resultante pierde la rotación (el archivo generado ya no trae
    // EXIF que el servidor pueda aplicar) y las fotos verticales salen de
    // lado. Navegadores viejos ignoran la opción y siguen como antes.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    try {
      const largest = Math.max(bitmap.width, bitmap.height);

      // Si ya cabe y no excede dimensiones, viajar intacto (evita
      // recomprimir y perder calidad innecesariamente).
      if (
        largest <= COMPRESSION_RUNGS[0].maxDimension &&
        file.size <= MAX_CLIENT_BYTES
      ) {
        return file;
      }

      let best = null;
      for (const rung of COMPRESSION_RUNGS) {
        const blob = await renderRung(
          bitmap,
          rung.maxDimension,
          rung.quality
        );
        if (!blob) continue;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= MAX_CLIENT_BYTES) break;
      }
      if (!best) return file;

      // Nunca empeorar: si el original ya cabía y pesa menos que el mejor
      // intento, quedarse con el original.
      if (file.size <= MAX_CLIENT_BYTES && file.size <= best.size) return file;

      const ext = best.type === "image/png" ? "png" : "webp";
      const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
      const out = new File([best], `${baseName}.${ext}`, {
        type: best.type || "image/webp",
      });
      console.debug(
        `[upload] ${file.name} ${(file.size / 1048576).toFixed(2)}MB → ${out.name} ${(out.size / 1048576).toFixed(2)}MB`
      );
      return out;
    } finally {
      bitmap.close();
    }
  } catch {
    // Si el navegador no puede procesarla (memoria, formato raro), subir la
    // original y dejar que el servidor valide con mensaje claro.
    return file;
  }
}
