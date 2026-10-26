import { NextResponse } from "next/server";
import { generateListingImage } from "@/libs/metaModel";
import { checkAiRateLimit, AI_LIMITS, getClientIp } from "@/libs/aiRateLimit";

// POST /api/ai/public/listing-image — ver app/api/ai/public/listing-copy
// para el porqué de esta versión pública. Más estricta que la autenticada
// porque generar imágenes es el uso más costoso de los tres.
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, remaining } = await checkAiRateLimit({
      key: `ip:${ip}`,
      action: "listing-image",
      limit: AI_LIMITS.public["listing-image"],
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

    const { prompt } = await req.json();
    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Describe la imagen que quieres generar" },
        { status: 400 }
      );
    }

    const result = await generateListingImage({ prompt: prompt.trim() });

    return NextResponse.json({ data: { ...result, remaining } });
  } catch (error) {
    console.error("❌ Error in public listing-image demo:", error);
    return NextResponse.json(
      { error: "No pudimos generar la imagen con IA" },
      { status: 500 }
    );
  }
}
