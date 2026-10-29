import { NextResponse } from "next/server";
import { scanImagePrivacy } from "@/libs/metaModel";
import {
  checkAiRateLimit,
  refundAiRateLimit,
  AI_LIMITS,
  getClientIp,
} from "@/libs/aiRateLimit";
import { validateImageUrlFormat, preflightImageUrl } from "@/libs/imageUrl";

// POST /api/ai/public/privacy-scan — ver app/api/ai/public/listing-copy
// para el porqué de esta versión pública.
//
// Orden deliberado: (1) validar formato (gratis, no consume cuota) →
// (2) rate limit → (3) preflight de que la URL descarga una imagen real →
// (4) llamada a Meta. Los fallos de (3) y el rechazo `media_url_not_fetchable`
// de Meta devuelven la cuota, porque la IA no hizo trabajo real.
export async function POST(req) {
  try {
    const { imageUrl: rawUrl } = await req.json();
    const { url: imageUrl, error: formatError } =
      validateImageUrlFormat(rawUrl);
    if (formatError) {
      return NextResponse.json({ error: formatError }, { status: 400 });
    }

    const key = `ip:${getClientIp(req)}`;
    const action = "privacy-scan";
    const { allowed, remaining } = await checkAiRateLimit({
      key,
      action,
      limit: AI_LIMITS.public[action],
    });
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Límite de la demo pública alcanzado por hoy. Crea una cuenta gratis para seguir probando desde tu dashboard.",
        },
        { status: 429 }
      );
    }

    const preflight = await preflightImageUrl(imageUrl);
    if (!preflight.ok) {
      await refundAiRateLimit({ key, action });
      return NextResponse.json({ error: preflight.error }, { status: 422 });
    }

    try {
      const result = await scanImagePrivacy({ imageUrl });
      return NextResponse.json({ data: { ...result, remaining } });
    } catch (error) {
      if (
        error?.code === "media_url_not_fetchable" ||
        error?.message?.includes("media_url_not_fetchable")
      ) {
        await refundAiRateLimit({ key, action });
        // Nuestros errores de descarga ya traen mensaje amable; los de Meta
        // traen el crudo "Meta Model API /responses → 400: ..." y se traducen.
        const friendly = error.message.startsWith("Meta Model API")
          ? "Los servidores de Meta no pudieron procesar esa imagen. Prueba con otra URL pública directa (que termine en .jpg, .png o similar)."
          : error.message;
        return NextResponse.json({ error: friendly }, { status: 422 });
      }
      if (error?.code === "meta_timeout") {
        return NextResponse.json(
          { error: "El servicio de IA tardó demasiado. Intenta de nuevo." },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("❌ Error in public privacy-scan demo:", error);
    return NextResponse.json(
      { error: "No pudimos revisar la imagen" },
      { status: 500 }
    );
  }
}
