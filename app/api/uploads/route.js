import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { auth } from "@/libs/auth";
import { MAX_UPLOAD_BYTES, BLOB_IMAGE_WIDTHS } from "@/libs/propertyImages";

export const dynamic = "force-dynamic";
// sharp necesita el runtime Node (no Edge).
export const runtime = "nodejs";

// Lo que sharp decodifica de forma confiable en Vercel. HEIC/HEIF a propósito
// fuera (ver mensaje de error abajo y libs/clientImage.js).
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// POST /api/uploads
// Recibe UN archivo (campo "file"), lo normaliza con sharp (rotación EXIF,
// variantes responsive WebP) y lo guarda en Vercel Blob. Devuelve:
//   { data: { src, srcSet, width, height } }
// listo para agregarse a `Property.images`.
//
// Esto es lo que mantiene la cuota de Image Optimization en 0: las variantes
// ya salen optimizadas del upload y se sirven directo del CDN de Blob con
// <img srcSet> (ver components/PropertyImage.js), sin pasar por el
// optimizador de Vercel en ningún request.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // El SDK resuelve credenciales solo: OIDC (BLOB_STORE_ID +
    // VERCEL_OIDC_TOKEN, lo que Vercel inyecta al conectar el store) o el
    // token estático BLOB_READ_WRITE_TOKEN como fallback.
    const hasReadWriteToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    const hasOidc =
      !!process.env.BLOB_STORE_ID && !!process.env.VERCEL_OIDC_TOKEN;
    if (!hasReadWriteToken && !hasOidc) {
      return NextResponse.json(
        {
          error:
            "Falta configurar el Blob Store: conéctalo al proyecto en el dashboard de Vercel",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Manda una imagen en el campo 'file'" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            file.type === "image/heic" || file.type === "image/heif"
              ? "Ese formato (HEIC) no es compatible: exporta la foto como JPG y vuelve a intentarlo"
              : "Formato no compatible: usa JPG, PNG, WebP, GIF o AVIF",
        },
        { status: 400 }
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      // Incluir lo recibido: cuando iOS auto-convierte HEIC→JPEG al elegir
      // del carrete, el tamaño que ve el usuario no siempre es el que llega.
      const receivedMB = (file.size / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        {
          error: `La imagen es muy pesada (recibimos ${receivedMB}MB, máximo 4.5MB)`,
        },
        { status: 413 }
      );
    }

    const input = Buffer.from(await file.arrayBuffer());

    let metadata;
    try {
      metadata = await sharp(input).metadata();
    } catch {
      return NextResponse.json(
        { error: "No pudimos leer esa imagen: usa JPG, PNG o WebP" },
        { status: 400 }
      );
    }
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "No pudimos leer esa imagen: usa JPG, PNG o WebP" },
        { status: 400 }
      );
    }

    // Anchos a generar: los estándar que quepan debajo del original + el
    // original (topado a 1280) como variante mayor. Así una foto chica no se
    // agranda ni genera variantes duplicadas. GIF animado: sharp toma el
    // primer frame (el output es WebP estático).
    const maxWidth = Math.min(metadata.width, BLOB_IMAGE_WIDTHS.at(-1));
    const targets = [
      ...new Set(
        [...BLOB_IMAGE_WIDTHS.filter((w) => w < metadata.width), maxWidth].sort(
          (a, b) => a - b
        )
      ),
    ];

    // put() nunca sobreescribe (nombre único por uuid), así que un reintento
    // del cliente no corrompe nada: como máximo deja un blob huérfano.
    const id = randomUUID();
    const uploaded = [];
    try {
      for (const width of targets) {
        const buffer = await sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true, fit: "inside" })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
        const blob = await put(
          `properties/${session.user.id}/${id}-${width}.webp`,
          buffer,
          { access: "public", contentType: "image/webp", addRandomSuffix: false }
        );
        uploaded.push({ width, url: blob.url });
      }
    } catch (uploadError) {
      // Si falla una variante a la mitad, borrar las que sí subieron para no
      // dejar el set incompleto/huérfano en el store.
      await Promise.allSettled(uploaded.map((u) => del(u.url)));
      throw uploadError;
    }

    const main = uploaded[uploaded.length - 1];
    const mainHeight = Math.round((metadata.height * main.width) / metadata.width);

    return NextResponse.json({
      data: {
        src: main.url,
        // Con una sola variante el srcSet no aporta nada (mismo archivo).
        srcSet:
          uploaded.length > 1
            ? uploaded.map((u) => `${u.url} ${u.width}w`).join(", ")
            : undefined,
        width: main.width,
        height: mainHeight,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    return NextResponse.json(
      { error: "No pudimos subir la imagen, inténtalo de nuevo" },
      { status: 500 }
    );
  }
}
