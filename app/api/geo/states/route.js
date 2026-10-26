import { NextResponse } from "next/server";
import { getStatesForCountry } from "@/libs/geo";

// GET /api/geo/states?country=MX
// Estados/provincias de un país — ver libs/geo.js para por qué es un paso
// opcional en el formulario de publicar propiedad.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    if (!country) {
      return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
    }

    return NextResponse.json({ data: getStatesForCountry(country) });
  } catch (error) {
    console.error("❌ Error fetching states:", error);
    return NextResponse.json(
      { error: "Error fetching states" },
      { status: 500 }
    );
  }
}
