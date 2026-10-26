import { NextResponse } from "next/server";
import { getCitiesForCountry } from "@/libs/geo";

// GET /api/geo/cities?country=MX&state=JAL
// Devuelve la lista COMPLETA (ordenada alfabéticamente) de ciudades
// conocidas de un país, acotada a un estado/provincia cuando se manda
// `state`. Alimenta el <select> cerrado de Ciudad del formulario de
// propiedades — ver libs/geo.js (MAX_CITIES) para los límites de tamaño.
// `q` se mantiene como filtro opcional por compatibilidad, pero el
// formulario actual ya no lo usa (la ciudad se elige del <select>, no se
// escribe).
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const state = searchParams.get("state") || "";
    const q = searchParams.get("q") || "";

    if (!country) {
      return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
    }

    return NextResponse.json({ data: getCitiesForCountry(country, q, undefined, state) });
  } catch (error) {
    console.error("❌ Error fetching cities:", error);
    return NextResponse.json(
      { error: "Error fetching cities" },
      { status: 500 }
    );
  }
}
