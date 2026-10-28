import Link from "next/link";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { getSEOTags } from "@/libs/seo";
import { leanArrayToJSON } from "@/libs/leanToJSON";

export const dynamic = "force-dynamic";

export const metadata = getSEOTags({
  title: "Propiedades crypto-friendly | Casas Cripto",
  description:
    "Explora propiedades reales publicadas por propietarios y agentes crypto-friendly en Casas Cripto, filtrables por ciudad.",
  canonicalUrlRelative: "/propiedades",
});

// Marketplace real (no mockup): lista TODAS las propiedades "published",
// ordenadas con las destacadas primero. Es la contraparte honesta de
// <MarketplacePreview/> en el home, que muestra ejemplos. Cada ciudad con al
// menos una propiedad es un chip que enlaza a su propia página SEO
// (/propiedades/ciudad/[slug]) — más enlaces internos, más fácil de indexar.
async function getProperties() {
  await connectMongo();

  const [properties, cityAgg] = await Promise.all([
    Property.find({ status: "published" }).sort("-createdAt").lean(),
    Property.aggregate([
      { $match: { status: "published" } },
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

  const now = Date.now();
  // Las "destacadas" (pago único, ver app/api/stripe/create-featured-listing)
  // aparecen primero mientras su featuredUntil siga vigente.
  const sorted = properties.sort((a, b) => {
    const aFeatured = a.featured && new Date(a.featuredUntil).getTime() > now;
    const bFeatured = b.featured && new Date(b.featuredUntil).getTime() > now;
    return Number(bFeatured) - Number(aFeatured);
  });

  return {
    properties: leanArrayToJSON(JSON.parse(JSON.stringify(sorted))),
    cities: cityAgg
      .filter((c) => c._id)
      .map((c) => ({ slug: c._id, name: c.city, count: c.count })),
  };
}

export default async function PropiedadesPage() {
  const { properties, cities } = await getProperties();

  return (
    <>
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="font-medium text-primary mb-3">Marketplace</p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Propiedades crypto-friendly
            </h1>
            <p className="opacity-70 leading-relaxed">
              Listados reales publicados por propietarios y agentes
              verificados en Casas Cripto, con revisión manual antes de
              publicarse.
            </p>
          </div>

          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/propiedades/ciudad/${city.slug}`}
                  className="badge badge-lg badge-ghost border border-base-content/20 min-h-[40px]"
                >
                  {city.name} ({city.count})
                </Link>
              ))}
            </div>
          )}

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                Todavía no hay propiedades publicadas
              </p>
              <p className="opacity-70">
                Estamos en fase de lanzamiento del marketplace. Mira un{" "}
                <Link href="/#marketplace-preview" className="link link-primary">
                  adelanto del producto
                </Link>{" "}
                o sé el primero en publicar la tuya.
              </p>
              <Link href="/dashboard" className="btn btn-primary">
                Publicar mi propiedad gratis
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
