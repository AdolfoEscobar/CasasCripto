import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { generateListingImage } from "@/libs/metaModel";
import { checkAiRateLimit, AI_LIMITS } from "@/libs/aiRateLimit";

// POST /api/ai/listing-image
// Genera una imagen del listado con Meta Muse Image a partir de un prompt
// (ej. "villa frente al mar en Tulum, estilo moderno, atardecer"). La URL
// resultante se agrega directo al campo de fotos del formulario — el dueño
// decide si la usa o la borra antes de enviar a revisión.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validación primero (gratis): un request malformado no debe consumir
    // cuota — ver app/api/ai/public/privacy-scan/route.js.
    const { prompt } = await req.json();
    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Describe la imagen que quieres generar" },
        { status: 400 }
      );
    }

    const { allowed } = await checkAiRateLimit({
      key: `user:${session.user.id}`,
      action: "listing-image",
      limit: AI_LIMITS.authenticated["listing-image"],
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Alcanzaste el límite diario de imágenes con IA. Intenta mañana." },
        { status: 429 }
      );
    }

    const result = await generateListingImage({ prompt: prompt.trim() });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("❌ Error generating listing image:", error);
    return NextResponse.json(
      { error: "No pudimos generar la imagen con IA" },
      { status: 500 }
    );
  }
}
