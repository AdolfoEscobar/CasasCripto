// Queries compartidas por las páginas geo (/propiedades/[estado],
// /propiedades/[estado]/[ciudad], detalle y hub). Server-side only: importa
// el modelo de Mongoose — jamás importarlo desde un Client Component.
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { leanArrayToJSON, leanToJSON } from "@/libs/leanToJSON";
import { slugify, unslugify } from "@/libs/slugify";
import { isPropertyType, isListingType } from "@/libs/geoSeo.mjs";

// Destacadas vigentes primero, luego por fecha. Mismo criterio en hub,
// estado, ciudad y sitemap para que el orden sea consistente en todo el sitio.
export function sortFeaturedFirst(properties) {
  const now = Date.now();
  return [...properties].sort((a, b) => {
    const aFeatured =
      a.featured && a.featuredUntil && new Date(a.featuredUntil).getTime() > now;
    const bFeatured =
      b.featured && b.featuredUntil && new Date(b.featuredUntil).getTime() > now;
    return Number(bFeatured) - Number(aFeatured);
  });
}

// Filtros válidos de query params (?tipo=casa&operacion=venta). Valores
// inválidos se ignoran (no rompen la página ni generan URLs canónicas raras).
export function parseGeoFilters(searchParams = {}) {
  const propertyType = isPropertyType(searchParams?.tipo)
    ? searchParams.tipo
    : null;
  const listingType = isListingType(searchParams?.operacion)
    ? searchParams.operacion
    : null;
  return { propertyType, listingType };
}

function filtersToQuery({ propertyType, listingType }) {
  return {
    ...(propertyType && { propertyType }),
    ...(listingType && { listingType }),
  };
}

// Datos de la página de estado: propiedades (con filtros aplicados),
// conteo total sin filtros, nombre bonito, países mezclados y ciudades.
export async function getStateData(stateSlug, filters = {}) {
  await connectMongo();
  const filterQuery = filtersToQuery(filters);
  const [properties, totalCount, cityAgg, countryAgg] = await Promise.all([
    Property.find({ status: "published", stateSlug, ...filterQuery })
      .sort("-createdAt")
      .lean(),
    Property.countDocuments({ status: "published", stateSlug }),
    Property.aggregate([
      { $match: { status: "published", stateSlug } },
      {
        $group: {
          _id: "$citySlug",
          city: { $first: "$city" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Property.aggregate([
      { $match: { status: "published", stateSlug } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const sorted = sortFeaturedFirst(properties);
  const stateName =
    properties.find((p) => p.state)?.state ||
    properties[0]?.country ||
    unslugify(stateSlug);
  const countries = countryAgg.map((c) => c._id).filter(Boolean);

  return {
    properties: leanArrayToJSON(JSON.parse(JSON.stringify(sorted))),
    totalCount,
    stateName,
    // Si dos países comparten nombre de estado (ej. Córdoba en AR/CO/ES),
    // la página lo indica en vez de asumir uno.
    country: countries.length === 1 ? countries[0] : null,
    mixedCountries: countries.length > 1,
    cities: cityAgg
      .filter((c) => c._id)
      .map((c) => ({ slug: c._id, name: c.city, count: c.count })),
  };
}

// Datos de la página de ciudad + ciudades hermanas del mismo estado
// (interlinking: cada ciudad enlaza a sus hermanas y al estado).
export async function getCityData(stateSlug, citySlug, filters = {}) {
  await connectMongo();
  const filterQuery = filtersToQuery(filters);
  const [properties, totalCount, cityAgg] = await Promise.all([
    Property.find({ status: "published", stateSlug, citySlug, ...filterQuery })
      .sort("-createdAt")
      .lean(),
    Property.countDocuments({ status: "published", stateSlug, citySlug }),
    Property.aggregate([
      { $match: { status: "published", stateSlug } },
      {
        $group: {
          _id: "$citySlug",
          city: { $first: "$city" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const sorted = sortFeaturedFirst(properties);
  return {
    properties: leanArrayToJSON(JSON.parse(JSON.stringify(sorted))),
    totalCount,
    cityName: properties[0]?.city || unslugify(citySlug),
    stateName:
      properties.find((p) => p.state)?.state || unslugify(stateSlug),
    country: properties.find((p) => p.country)?.country || null,
    siblingCities: cityAgg
      .filter((c) => c._id && c._id !== citySlug)
      .map((c) => ({ slug: c._id, name: c.city, count: c.count })),
  };
}

export async function getPropertyBySlug(propertySlug) {
  await connectMongo();
  const property = await Property.findOne({
    propertySlug,
    status: "published",
  }).lean();
  return property ? leanToJSON(JSON.parse(JSON.stringify(property))) : null;
}

export async function getPropertyById(id) {
  await connectMongo();
  try {
    const property = await Property.findOne({
      _id: id,
      status: "published",
    }).lean();
    if (!property) return null;
    // Auto-repara documentos viejos al visitarlos (misma lógica que
    // scripts/backfill-geo-slugs.mjs, idempotente): si el deploy sube antes
    // de correr la migración masiva, cada listado se cura solo en su primera
    // visita en vez de caer en un loop de redirect.
    const healed = await healGeoSlugs(property);
    return leanToJSON(JSON.parse(JSON.stringify(healed)));
  } catch {
    // CastError si el id no es un ObjectId válido — tratarlo como "no existe".
    return null;
  }
}

async function healGeoSlugs(property) {
  const patch = {};
  const citySlug = slugify(property.city);
  if (property.citySlug !== citySlug) {
    patch.citySlug = citySlug;
    if (property.citySlug && !property.legacyCitySlug) {
      patch.legacyCitySlug = property.citySlug;
    }
  }
  const stateSlug = slugify(property.state || property.country);
  if (property.stateSlug !== stateSlug) patch.stateSlug = stateSlug;
  if (!property.propertySlug) {
    const base = slugify(property.title).slice(0, 60) || "propiedad";
    patch.propertySlug = `${base}-${property._id.toString().slice(-6)}`;
  }
  if (!property.listingType) patch.listingType = "venta";
  if (Object.keys(patch).length === 0) return property;
  try {
    await Property.updateOne({ _id: property._id }, { $set: patch });
    return { ...property, ...patch };
  } catch {
    // Best-effort (ej. colisión de unique): devuelve el doc como está y la
    // página decide (ver guard anti-loop en app/propiedades/[param]/page.js).
    return property;
  }
}

// Resuelve una URL legacy /propiedades/ciudad/[slug] (formato "ciudad-pais")
// a su propiedad/ciudad actual para redirigir 301. Busca tanto en el campo
// legacy como en el nuevo por si el slug ya es formato nuevo.
export async function getPropertyByCitySlugAny(slug) {
  await connectMongo();
  const property = await Property.findOne({
    status: "published",
    $or: [{ legacyCitySlug: slug }, { citySlug: slug }],
  })
    .select("city citySlug state stateSlug country")
    .lean();
  return property ? leanToJSON(JSON.parse(JSON.stringify(property))) : null;
}

// Hub: todas las publicadas + agregados por estado y por ciudad.
export async function getMarketplaceData() {
  await connectMongo();
  const [properties, stateAgg, cityAgg] = await Promise.all([
    Property.find({ status: "published" }).sort("-createdAt").lean(),
    Property.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$stateSlug",
          name: { $first: "$state" },
          country: { $first: "$country" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Property.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: { stateSlug: "$stateSlug", citySlug: "$citySlug" },
          city: { $first: "$city" },
          state: { $first: "$state" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    properties: leanArrayToJSON(
      JSON.parse(JSON.stringify(sortFeaturedFirst(properties)))
    ),
    states: stateAgg
      .filter((s) => s._id)
      .map((s) => ({
        slug: s._id,
        name: s.name || s.country || unslugify(s._id),
        count: s.count,
      })),
    cities: cityAgg
      .filter((c) => c._id?.stateSlug && c._id?.citySlug)
      .map((c) => ({
        stateSlug: c._id.stateSlug,
        slug: c._id.citySlug,
        name: c.city,
        state: c.state,
        count: c.count,
      })),
  };
}
