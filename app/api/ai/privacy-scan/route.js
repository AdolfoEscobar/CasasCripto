import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { scanImagePrivacy } from "@/libs/metaModel";
import { checkAiRateLimit, refundAiRateLimit, AI_LIMITS } from "@/libs/aiRateLimit";
import { validateImageUrlFormat, preflightImageUrl } from "@/libs/imageUrl";

// POST /api/ai/privacy-scan
// Usa Meta SAM 3.1 para avisar si una foto del listado muestra personas,
// rostros o placas visibles — antes de publicar, no después. Es informativo
// (no bloquea el envío a revisión): el dueño decide si cambia la foto.
//
// Mismo orden que la versión pública: validar formato → rate limit →
// preflight → Meta, devolviendo cuota cuando la IA no hizo trabajo real.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl: rawUrl } = await req.json();
    const { url: imageUrl, error: formatError } =
      validateImageUrlFormat(rawUrl);
    if (formatError) {
      return NextResponse.json({ error: formatError }, { status: 400 });
    }

    const key = `user:${session.user.id}`;
    const action = "privacy-scan";
    const { allowed } = await checkAiRateLimit({
      key,
      action,
      limit: AI_LIMITS.authenticated[action],
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Alcanzaste el límite diario de revisiones con IA. Intenta mañana." },
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
      return NextResponse.json({ data: result });
    } catch (error) {
      if (error?.message?.includes("media_url_not_fetchable")) {
        await refundAiRateLimit({ key, action });
        return NextResponse.json(
          {
            error:
              "Los servidores de Meta no pudieron descargar esa imagen. Prueba con otra URL pública directa (que termine en .jpg, .png o similar).",
          },
          { status: 422 }
        );
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
    console.error("❌ Error scanning image privacy:", error);
    return NextResponse.json(
      { error: "No pudimos revisar la imagen" },
      { status: 500 }
    );
  }
}
