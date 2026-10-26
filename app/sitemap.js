import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import config from "@/config";

export const dynamic = "force-dynamic";

// Sitemap dinámico: páginas estáticas + una URL por cada propiedad
// publicada + una URL por cada ciudad con al menos una propiedad publicada
// (ver app/propiedades/ciudad/[slug]). Las páginas de ciudad SIN ningún
// listado también existen y son visitables, pero a propósito no se incluyen
// aquí hasta tener contenido real — evita mandarle a Google páginas vacías
// que podría marcar como thin content.
export default async function sitemap() {
  const baseUrl = `https://${config.domainName}`;

  const staticRoutes = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/tos`, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  let propertyRoutes = [];
  let cityRoutes = [];

  try {
    await connectMongo();
    const properties = await Property.find({ status: "published" })
      .select("_id citySlug updatedAt")
      .lean();

    propertyRoutes = properties.map((p) => ({
      url: `${baseUrl}/propiedades/${p._id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const citySlugs = [
      ...new Set(properties.map((p) => p.citySlug).filter(Boolean)),
    ];
    cityRoutes = citySlugs.map((slug) => ({
      url: `${baseUrl}/propiedades/ciudad/${slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("❌ Error building sitemap property routes:", error);
  }

  return [...staticRoutes, ...cityRoutes, ...propertyRoutes];
}
