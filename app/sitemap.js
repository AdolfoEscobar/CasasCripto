import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import config from "@/config";
import { propertyUrl } from "@/libs/propertyUrls.mjs";
import {
  allStateSlugs,
  popularCities,
  countryEntries,
} from "@/libs/geoDirectory.mjs";
import { articles, categories, authors } from "./blog/_assets/content";

export const dynamic = "force-dynamic";

// Sitemap dinámico: páginas estáticas + blog + jerarquía geo con inventario
// (estados, ciudades, detalles) + registro curado sin inventario (estados y
// ciudades populares con guía editorial única, indexables aunque vacías).
export default async function sitemap() {
  const baseUrl = `https://${config.domainName}`;

  const staticRoutes = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${baseUrl}/propiedades/ciudad`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/demo-ai`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/tos`, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const blogRoutes = [
    ...articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    })),
    ...categories.map((category) => ({
      url: `${baseUrl}/blog/category/${category.slug}`,
      changeFrequency: "monthly",
      priority: 0.4,
    })),
    ...authors.map((author) => ({
      url: `${baseUrl}/blog/author/${author.slug}`,
      changeFrequency: "monthly",
      priority: 0.3,
    })),
  ];

  let stateRoutes = [];
  let cityRoutes = [];
  let propertyRoutes = [];

  try {
    await connectMongo();
    const properties = await Property.find({ status: "published" })
      .select("stateSlug citySlug propertySlug updatedAt")
      .lean();

    // Solo listados con la tríada completa de slugs (docs migrados). Los que
    // aún no migran quedan fuera del sitemap hasta que se migren — evita
    // anunciarle a Google URLs legacy por id.
    const migrated = properties.filter(
      (p) => p.stateSlug && p.citySlug && p.propertySlug
    );

    const stateSlugs = [...new Set(migrated.map((p) => p.stateSlug))];
    stateRoutes = stateSlugs.map((slug) => ({
      url: `${baseUrl}/propiedades/${slug}`,
      changeFrequency: "daily",
      priority: 0.85,
    }));

    const cityKeys = [
      ...new Set(migrated.map((p) => `${p.stateSlug}/${p.citySlug}`)),
    ];
    cityRoutes = cityKeys.map((key) => ({
      url: `${baseUrl}/propiedades/${key}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    propertyRoutes = migrated.map((p) => ({
      url: `${baseUrl}${propertyUrl(p)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("❌ Error building sitemap property routes:", error);
  }

  // Registro curado sin inventario: estados y ciudades populares con guía
  // editorial única, indexables aunque estén vacíos (ver geoDirectory.mjs).
  // Se deducen los que ya salieron con inventario para no duplicar URLs.
  const inventoryStates = new Set(
    stateRoutes.map((r) => r.url.replace(`${baseUrl}/propiedades/`, "")),
  );
  const curatedStateRoutes = allStateSlugs()
    .filter((slug) => !inventoryStates.has(slug))
    .map((slug) => ({
      url: `${baseUrl}/propiedades/${slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const inventoryCities = new Set(
    cityRoutes.map((r) => r.url.replace(`${baseUrl}/propiedades/`, "")),
  );
  const curatedCityRoutes = popularCities
    .map((c) => `${c.stateSlug}/${c.citySlug}`)
    .filter((key) => !inventoryCities.has(key))
    .map((key) => ({
      url: `${baseUrl}/propiedades/${key}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  // Landings de país (siempre indexables: con inventario o con guía).
  const countryRoutes = countryEntries().map(({ slug }) => ({
    url: `${baseUrl}/propiedades/pais/${slug}`,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...countryRoutes,
    ...stateRoutes,
    ...cityRoutes,
    ...curatedStateRoutes,
    ...curatedCityRoutes,
    ...propertyRoutes,
  ];
}
