import Link from "next/link";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { getSEOTags, renderBreadcrumbSchema } from "@/libs/seo";
import { unslugify } from "@/libs/slugify";
import { leanArrayToJSON } from "@/libs/leanToJSON";
import config from "@/config";

export const dynamic = "force-dynamic";

// Página SEO programática por ciudad. A propósito funciona con CUALQUIER
// slug, tenga o no propiedades hoy: captura búsquedas tipo "casas en
// Chihuahua que acepten cripto" desde el día uno (con un CTA de lista de
// espera), y automáticamente se "activa" como listado real en cuanto la
// primera propiedad de esa ciudad se publica — sin tocar código.
async function getCityData(slug) {
  await connectMongo();
  const properties = await Property.find({
    status: "published",
    citySlug: slug,
  })
    .sort("-createdAt")
    .lean();

  const now = Date.now();
  const sorted = properties.sort((a, b) => {
    const aFeatured = a.featured && new Date(a.featuredUntil).getTime() > now;
    const bFeatured = b.featured && new Date(b.featuredUntil).getTime() > now;
    return Number(bFeatured) - Number(aFeatured);
  });

  const cityName = properties[0]?.city || unslugify(slug);
  const country = properties.find((p) => p.country)?.country;

  return {
    properties: leanArrayToJSON(JSON.parse(JSON.stringify(sorted))),
    cityName,
    country,
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { cityName, properties } = await getCityData(slug);

  const title =
    properties.length > 0
      ? `${properties.length} propiedades crypto-friendly en ${cityName} | Casas Cripto`
      : `Propiedades crypto-friendly en ${cityName} | Casas Cripto`;
  const description = `Encuentra casas y departamentos en ${cityName} de propietarios y agentes que aceptan USDC, USDT, BTC y ETH como forma de pago en Casas Cripto.`;

  return getSEOTags({
    title,
    description,
    canonicalUrlRelative: `/propiedades/ciudad/${slug}`,
  });
}

export default async function CiudadPage({ params }) {
  const { slug } = await params;
  const { properties, cityName, country } = await getCityData(slug);

  const breadcrumbItems = [
    { name: "Propiedades", url: `https://${config.domainName}/propiedades` },
    { name: cityName, url: `https://${config.domainName}/propiedades/ciudad/${slug}` },
  ];

  return (
    <>
      {renderBreadcrumbSchema(breadcrumbItems)}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24">
          <div className="text-sm breadcrumbs mb-6 opacity-70 justify-center">
            <ul>
              <li>
                <Link href="/propiedades">Propiedades</Link>
              </li>
              <li className="min-w-0">
                <span className="truncate max-w-[40vw] block" title={cityName}>
                  {cityName}
                </span>
              </li>
            </ul>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-medium text-primary mb-3">
              {country ? `${cityName}, ${country}` : cityName}
            </p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Propiedades crypto-friendly en {cityName}
            </h1>
            <p className="opacity-70 leading-relaxed">
              Casas, departamentos y terrenos en {cityName} publicados por
              propietarios y agentes verificados que aceptan USDC, USDT, BTC
              y ETH.
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                Todavía no hay propiedades publicadas en {cityName}
              </p>
              <p className="opacity-70">
                Sé el primero en publicar una propiedad crypto-friendly en{" "}
                {cityName}, o explora{" "}
                <Link href="/propiedades" className="link link-primary">
                  todas las propiedades disponibles
                </Link>
                .
              </p>
              <Link
                href="/dashboard"
                className="btn btn-primary max-w-full whitespace-normal text-center"
              >
                Publicar en {cityName} gratis
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
