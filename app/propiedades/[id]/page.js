import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import PropertyImage from "@/components/PropertyImage";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { getSEOTags, renderBreadcrumbSchema } from "@/libs/seo";
import { leanToJSON } from "@/libs/leanToJSON";
import { imageSrc, imageSrcList } from "@/libs/propertyImages";
import config from "@/config";

export const dynamic = "force-dynamic";

async function getProperty(id) {
  await connectMongo();
  try {
    const property = await Property.findOne({ _id: id, status: "published" }).lean();
    return property ? leanToJSON(JSON.parse(JSON.stringify(property))) : null;
  } catch {
    // CastError si el id no es un ObjectId válido — tratarlo como "no existe".
    return null;
  }
}

// Cada propiedad publicada es su propia URL indexable, con título, meta
// description y datos estructurados únicos — esto es lo que realmente mueve
// el SEO de un marketplace de día cero (ver también /sitemap.js).
export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return getSEOTags({
      title: "Propiedad no encontrada | Casas Cripto",
      canonicalUrlRelative: `/propiedades/${id}`,
    });
  }

  const title = `${property.title} en ${property.city} | Acepta cripto | Casas Cripto`;
  const description =
    property.description?.slice(0, 155) ||
    `Propiedad en venta en ${property.city}${
      property.country ? `, ${property.country}` : ""
    } que acepta ${(property.cryptoAccepted || []).join(", ") || "criptomonedas"}. Precio: $${property.price?.toLocaleString()} ${property.currency}.`;

  const ogImage = imageSrc(property.images?.[0]);

  return getSEOTags({
    title,
    description,
    canonicalUrlRelative: `/propiedades/${id}`,
    extraTags: {
      openGraph: {
        title,
        description,
        url: `/propiedades/${id}`,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    },
  });
}

export default async function PropertyDetailPage({ params }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || property.title,
    url: `https://${config.domainName}/propiedades/${property.id}`,
    datePosted: property.createdAt,
    ...(property.images?.length && { image: imageSrcList(property.images) }),
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      ...(property.country && { addressCountry: property.country }),
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency || "USD",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbItems = [
    { name: "Propiedades", url: `https://${config.domainName}/propiedades` },
    ...(property.citySlug
      ? [
          {
            name: property.city,
            url: `https://${config.domainName}/propiedades/ciudad/${property.citySlug}`,
          },
        ]
      : []),
    {
      name: property.title,
      url: `https://${config.domainName}/propiedades/${property.id}`,
    },
  ];

  return (
    <>
      <Script
        type="application/ld+json"
        id={`json-ld-property-${property.id}`}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {renderBreadcrumbSchema(breadcrumbItems)}
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 md:py-16">
          <div className="text-sm breadcrumbs mb-6 opacity-70">
            <ul>
              <li>
                <Link href="/propiedades">Propiedades</Link>
              </li>
              {property.citySlug && (
                <li className="min-w-0">
                  <Link
                    href={`/propiedades?ciudad=${property.citySlug}`}
                    title={property.city}
                    className="truncate max-w-[35vw] block"
                  >
                    {property.city}
                  </Link>
                </li>
              )}
              <li className="truncate max-w-[200px]">{property.title}</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              {property.images?.[0] ? (
                <PropertyImage
                  image={property.images[0]}
                  alt={property.title}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="w-full aspect-[4/3] object-cover rounded-2xl"
                  eager
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-base-300 rounded-2xl flex items-center justify-center text-base-content/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-16 h-16"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
                    />
                  </svg>
                </div>
              )}

              {property.images?.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {property.images.slice(1, 4).map((img, i) => (
                    <PropertyImage
                      key={i}
                      image={img}
                      alt={`${property.title} - foto ${i + 2}`}
                      sizes="(max-width: 1024px) 33vw, 20vw"
                      className="w-full aspect-[4/3] object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {property.featured &&
                property.featuredUntil &&
                new Date(property.featuredUntil) > new Date() && (
                  <span className="badge badge-warning font-semibold mt-4 gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                    Listado destacado
                  </span>
                )}

              <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight mt-4">
                {property.title}
              </h1>
              <p className="opacity-60 mt-1 break-words">
                {property.city}
                {property.country ? `, ${property.country}` : ""}
                {property.location ? ` · ${property.location}` : ""}
              </p>

              {property.description && (
                <p className="mt-6 leading-relaxed opacity-80 whitespace-pre-line break-words">
                  {property.description}
                </p>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 lg:sticky lg:top-24">
                <p className="font-extrabold text-3xl text-gradient-gold">
                  ${property.price?.toLocaleString()} {property.currency}
                </p>

                {property.cryptoAccepted?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 opacity-70">
                      Criptomonedas aceptadas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {property.cryptoAccepted.map((c) => (
                        <span key={c} className="badge badge-primary badge-outline">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {property.contactEmail && (
                  <a
                    href={`mailto:${property.contactEmail}?subject=${encodeURIComponent(
                      `Interesado en: ${property.title}`
                    )}`}
                    className="btn btn-primary btn-block"
                  >
                    Contactar al propietario
                  </a>
                )}

                <p className="text-xs opacity-50 text-center">
                  El cierre de la operación es directo entre comprador y
                  propietario. Casas Cripto no procesa el pago de la compra
                  hoy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
