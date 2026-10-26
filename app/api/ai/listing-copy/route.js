import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { generateListingCopy } from "@/libs/metaModel";
import { checkAiRateLimit, AI_LIMITS } from "@/libs/aiRateLimit";

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

    // Protege el saldo compartido del hackathon ($150) de un dueño dándole
    // clic sin parar — ver libs/aiRateLimit.js.
    const { allowed, remaining } = await checkAiRateLimit({
      key: `user:${session.user.id}`,
      action: "listing-copy",
      limit: AI_LIMITS.authenticated["listing-copy"],
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Alcanzaste el límite diario de generaciones con IA. Intenta mañana." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { rawNotes, city, state, country, price, currency, cryptoAccepted } =
      body;

    if (!city || !country || price === undefined || price === null || price === "") {
      return NextResponse.json(
        { error: "Ciudad, país y precio son necesarios para generar el copy" },
        { status: 400 }
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
    console.error("❌ Error generating listing copy:", error);
    return NextResponse.json(
      { error: "No pudimos generar el copy con IA" },
      { status: 500 }
    );
  }
}
