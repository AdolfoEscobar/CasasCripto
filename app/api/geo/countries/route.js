import { NextResponse } from "next/server";
import { getAllCountries } from "@/libs/geo";

// GET /api/geo/countries
// Lista pública de países (código + nombre en español) para el <select> de
// País al publicar una propiedad. No requiere sesión: es solo data estática
// de referencia, igual que un dropdown de HTML.
export async function GET() {
  try {
    return NextResponse.json({ data: getAllCountries() });
  } catch (error) {
    console.error("❌ Error fetching countries:", error);
    return NextResponse.json(
      { error: "Error fetching countries" },
      { status: 500 }
    );
  }
}
