import { NextResponse } from "next/server";
import { scanImagePrivacy } from "@/libs/metaModel";
import { checkAiRateLimit, AI_LIMITS, getClientIp } from "@/libs/aiRateLimit";

// POST /api/ai/public/privacy-scan — ver app/api/ai/public/listing-copy
// para el porqué de esta versión pública.
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, remaining } = await checkAiRateLimit({
      key: `ip:${ip}`,
      action: "privacy-scan",
      limit: AI_LIMITS.public["privacy-scan"],
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

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl es requerido" },
        { status: 400 }
      );
    }

    const result = await scanImagePrivacy({ imageUrl });

    return NextResponse.json({ data: { ...result, remaining } });
  } catch (error) {
    console.error("❌ Error in public privacy-scan demo:", error);
    return NextResponse.json(
      { error: "No pudimos revisar la imagen" },
      { status: 500 }
    );
  }
}
