import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { generateListingCopy } from "@/libs/metaModel";
import { checkAiRateLimit, refundAiRateLimit, AI_LIMITS } from "@/libs/aiRateLimit";

// POST /api/ai/listing-copy
// Redacta título + descripción con Meta Muse Spark a partir de notas crudas
// del propietario (ver botón "Redactar con Meta AI" en PropertyManager).
// Requiere sesión — cualquier usuario autenticado puede usarlo mientras arma
// su propio listado, no solo admins.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validación primero (gratis): un request malformado no debe consumir
    // cuota — ver app/api/ai/public/privacy-scan/route.js.
    const body = await req.json();
    const { rawNotes, city, state, country, price, currency, cryptoAccepted } =
      body;

    if (!city || !country || price === undefined || price === null || price === "") {
      return NextResponse.json(
        { error: "Ciudad, país y precio son necesarios para generar el copy" },
        { status: 400 }
      );
    }

    // Protege el saldo compartido del hackathon ($150) de un dueño dándole
    // clic sin parar — ver libs/aiRateLimit.js.
    const key = `user:${session.user.id}`;
    const action = "listing-copy";
    const { allowed, remaining } = await checkAiRateLimit({
      key,
      action,
      limit: AI_LIMITS.authenticated[action],
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Alcanzaste el límite diario de generaciones con IA. Intenta mañana." },
        { status: 429 }
      );
    }

    try {
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
      // Ningún modelo candidato aceptó la key: la IA no hizo trabajo real,
      // así que se devuelve la cuota en vez de un 500 opaco.
      if (error?.code === "model_not_found") {
        await refundAiRateLimit({ key, action });
        return NextResponse.json(
          {
            error:
              "El modelo de redacción de Meta no está habilitado para esta cuenta en este momento. Intenta de nuevo más tarde.",
          },
          { status: 503 }
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
    console.error("❌ Error generating listing copy:", error);
    return NextResponse.json(
      { error: "No pudimos generar el copy con IA" },
      { status: 500 }
    );
  }
}
