import { NextResponse } from "next/server";
import { generateListingCopy } from "@/libs/metaModel";
import { checkAiRateLimit, AI_LIMITS, getClientIp } from "@/libs/aiRateLimit";

// POST /api/ai/public/listing-copy
// Versión SIN login de /api/ai/listing-copy, para la demo pública en
// /demo-ai (pensada para jueces del hackathon y redes sociales, donde pedir
// cuenta + verificación sería fricción innecesaria). Limitada por IP y con
// un tope mucho más bajo que la versión autenticada — ver libs/aiRateLimit.js.
export async function POST(req) {
  try {
    // Validación primero (gratis): un request malformado no debe consumir
    // cuota de IA — ver app/api/ai/public/privacy-scan/route.js.
    const body = await req.json();
    const { rawNotes, city, state, country, price, currency, cryptoAccepted } =
      body;

    if (!city || !country || price === undefined || price === null || price === "") {
      return NextResponse.json(
        { error: "Ciudad, país y precio son necesarios para generar el copy" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const { allowed, remaining } = await checkAiRateLimit({
      key: `ip:${ip}`,
      action: "listing-copy",
      limit: AI_LIMITS.public["listing-copy"],
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

    const result = await generateListingCopy({
      rawNotes,
      city,
      state,
      country,
      price,
      currency,
      cryptoAccepted,
    });

    return NextResponse.json({ data: { ...result, remaining } });
  } catch (error) {
    console.error("❌ Error in public listing-copy demo:", error);
    return NextResponse.json(
      { error: "No pudimos generar el copy con IA" },
      { status: 500 }
    );
  }
}
