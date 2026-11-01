import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import config from "@/config";
import { propertyUrl } from "@/libs/propertyUrls.mjs";
import { articles, categories, authors } from "./blog/_assets/content";

export const dynamic = "force-dynamic";

// Sitemap dinámico: páginas estáticas + blog + TODA la jerarquía geo con
// contenido real (estados, ciudades estado/ciudad, detalles con keywords).
// Solo entran URLs con al menos un listado: las páginas vacías existen (con
// CTA + noindex) pero no se le anuncian a Google hasta tener contenido.
export default async function sitemap() {
  const baseUrl = `https://${config.domainName}`;

  const staticRoutes = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
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

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...stateRoutes,
    ...cityRoutes,
    ...propertyRoutes,
  ];
}
