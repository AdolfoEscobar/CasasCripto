import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// GET /api/geo/listing-cities — ciudades CON listados publicados (para el
// <select> de ciudad del héroe de búsqueda). Distinto de /api/geo/cities
// (catálogo mundial estático para el formulario): esto es inventario real.
// El cliente lo mezcla con las populares (libs/geoDirectory.mjs).
export async function GET() {
  try {
    await connectMongo();
    const agg = await Property.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: { stateSlug: "$stateSlug", citySlug: "$citySlug" },
          city: { $first: "$city" },
          state: { $first: "$state" },
          country: { $first: "$country" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const cities = agg
      .filter((c) => c._id?.stateSlug && c._id?.citySlug)
      .map((c) => ({
        city: c.city,
        citySlug: c._id.citySlug,
        state: c.state,
        stateSlug: c._id.stateSlug,
        country: c.country,
        count: c.count,
      }));

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("❌ Error en /api/geo/listing-cities:", error);
    return NextResponse.json({ cities: [] });
  }
}
