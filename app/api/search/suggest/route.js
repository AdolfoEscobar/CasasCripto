import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { escapeRegExp, sortFeaturedFirst } from "@/libs/propertyGeo";
import { propertyUrl } from "@/libs/propertyUrls.mjs";
import { imageSrc } from "@/libs/propertyImages";
import { matchGeos } from "@/libs/geoDirectory.mjs";

export const dynamic = "force-dynamic";

// GET /api/search/suggest?q=... — autocompletado del buscador del header.
// Público (igual que /api/properties): devuelve hasta 6 propiedades + 4
// geos (ciudades/estados del registro) que matcheen el término. Respuesta
// mínima y rápida: solo lo que pinta el dropdown.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 80);

  if (q.length < 2) {
    return NextResponse.json({ properties: [], geos: [] });
  }

  let properties = [];
  try {
    await connectMongo();
    const rx = { $regex: escapeRegExp(q), $options: "i" };
    const docs = await Property.find({
      status: "published",
      $or: ["title", "city", "state", "country", "location"].map((field) => ({
        [field]: rx,
      })),
    })
      .sort("-createdAt")
      .limit(6)
      .lean();

    properties = sortFeaturedFirst(docs).map((p) => ({
      title: p.title,
      url: propertyUrl(p),
      location: [p.city, p.state].filter(Boolean).join(", "),
      price: `$${Number(p.price || 0).toLocaleString("es-MX")} ${p.currency || "USD"}`,
      image: imageSrc(p.images?.[0]) || null,
    }));
  } catch (error) {
    console.error("❌ Error en /api/search/suggest:", error);
  }

  return NextResponse.json({ properties, geos: matchGeos(q, 4) });
}
