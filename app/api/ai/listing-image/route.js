import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { generateListingImage } from "@/libs/metaModel";

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

    const { prompt } = await req.json();
    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Describe la imagen que quieres generar" },
        { status: 400 }
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
