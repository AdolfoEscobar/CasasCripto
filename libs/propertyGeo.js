// Queries compartidas por las páginas geo (/propiedades/[estado],
// /propiedades/[estado]/[ciudad], detalle y hub). Server-side only: importa
// el modelo de Mongoose — jamás importarlo desde un Client Component.
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { leanArrayToJSON, leanToJSON } from "@/libs/leanToJSON";
import { slugify, unslugify } from "@/libs/slugify";
import {
  isPropertyType,
  isListingType,
  parseSortParam,
} from "@/libs/geoSeo.mjs";
import { knownCountry } from "@/libs/geoDirectory.mjs";

// Destacadas vigentes primero, luego según `sort` (?orden=...): recientes
// conserva el -createdAt de Mongo (sort estable), precio-asc/desc ordenan
// por precio. Mismo criterio en hub, estado y ciudad.
export function sortFeaturedFirst(properties, sort = "recientes") {
  const now = Date.now();
  const isFeatured = (p) =>
    p.featured && p.featuredUntil && new Date(p.featuredUntil).getTime() > now;
  const price = (p) => Number(p.price) || 0;
  return [...properties].sort((a, b) => {
    const byFeatured = Number(isFeatured(b)) - Number(isFeatured(a));
    if (byFeatured !== 0) return byFeatured;
    if (sort === "precio-asc") return price(a) - price(b);
    if (sort === "precio-desc") return price(b) - price(a);
    return 0;
  });
}

// Filtros válidos de query params (?tipo=casa&operacion=venta&orden=...).
// Valores inválidos se ignoran (no rompen la página ni generan URLs
// canónicas raras). `sort` nunca entra al query de Mongo (ver
// filtersToQuery): se aplica en memoria vía sortFeaturedFirst.
export function parseGeoFilters(searchParams = {}) {
  const propertyType = isPropertyType(searchParams?.tipo)
    ? searchParams.tipo
    : null;
  const listingType = isListingType(searchParams?.operacion)
    ? searchParams.operacion
    : null;
  return {
    propertyType,
    listingType,
    sort: parseSortParam(searchParams?.orden),
  };
}

// Escapa texto libre para usarlo en RegExp de Mongo ($or de búsqueda).
// Sin esto, una búsqueda como "(a" tumbaría el query con SyntaxError.
export function escapeRegExp(text) {
  return (text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  const sorted = sortFeaturedFirst(properties, filters.sort);
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

  const sorted = sortFeaturedFirst(properties, filters.sort);
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

// Landing de país (/propiedades/pais/mexico): listados del país con ?q=,
// filtros y orden, más agregados por estado/ciudad para navegar hacia abajo.
// Casa por countrySlug (docs nuevos) o nombre exacto del registro (docs sin
// migrar todavía) — ver knownCountry en libs/geoDirectory.mjs.
export async function getCountryData(
  countrySlug,
  { q = "", filters = {} } = {},
) {
  await connectMongo();
  const known = knownCountry(countrySlug);
  const term = (q || "").trim();
  const searchQuery = term
    ? {
        $or: ["title", "city", "state", "country", "location"].map((field) => ({
          [field]: { $regex: escapeRegExp(term), $options: "i" },
        })),
      }
    : {};
  const geoQuery = {
    $or: [{ countrySlug }, ...(known ? [{ country: known.name }] : [])],
  };
  const [properties, totalCount, stateAgg, cityAgg] = await Promise.all([
    Property.find({
      status: "published",
      ...geoQuery,
      ...filtersToQuery(filters),
      ...searchQuery,
    })
      .sort("-createdAt")
      .lean(),
    Property.countDocuments({ status: "published", ...geoQuery }),
    Property.aggregate([
      { $match: { status: "published", ...geoQuery } },
      {
        $group: {
          _id: "$stateSlug",
          name: { $first: "$state" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Property.aggregate([
      { $match: { status: "published", ...geoQuery } },
      {
        $group: {
          _id: { stateSlug: "$stateSlug", citySlug: "$citySlug" },
          city: { $first: "$city" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const sorted = sortFeaturedFirst(properties, filters.sort);
  return {
    properties: leanArrayToJSON(JSON.parse(JSON.stringify(sorted))),
    totalCount,
    countryName:
      known?.name || properties[0]?.country || unslugify(countrySlug),
    states: stateAgg
      .filter((s) => s._id)
      .map((s) => ({
        slug: s._id,
        name: s.name || unslugify(s._id),
        count: s.count,
      })),
    cities: cityAgg
      .filter((c) => c._id?.stateSlug && c._id?.citySlug)
      .map((c) => ({
        stateSlug: c._id.stateSlug,
        slug: c._id.citySlug,
        name: c.city || unslugify(c._id.citySlug),
        count: c.count,
      })),
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
  const countrySlug = slugify(property.country);
  if (countrySlug && property.countrySlug !== countrySlug) {
    patch.countrySlug = countrySlug;
  }
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
// Hub + directorio: todas las publicadas (con búsqueda ?q= y filtros
// aplicados), más agregados GLOBALES por estado/ciudad (sin filtrar: son
// navegación, no resultados). `totalCount` es el inventario global para el
// H1 del hub sin filtros.
export async function getMarketplaceData({ q = "", filters = {}, sort } = {}) {
  await connectMongo();
  const term = (q || "").trim();
  const searchQuery = term
    ? {
        $or: ["title", "city", "state", "country", "location"].map((field) => ({
          [field]: { $regex: escapeRegExp(term), $options: "i" },
        })),
      }
    : {};
  const [properties, totalCount, stateAgg, cityAgg] = await Promise.all([
    Property.find({
      status: "published",
      ...filtersToQuery(filters),
      ...searchQuery,
    })
      .sort("-createdAt")
      .lean(),
    Property.countDocuments({ status: "published" }),
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
      JSON.parse(JSON.stringify(sortFeaturedFirst(properties, sort))),
    ),
    totalCount,
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
