import Link from "next/link";
import Script from "next/script";
import { notFound, permanentRedirect } from "next/navigation";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyImage from "@/components/PropertyImage";
import CryptoIcon from "@/components/CryptoIcon";
import FaqAccordion from "@/components/FaqAccordion";
import Breadcrumbs from "@/components/Breadcrumbs";
import PropertySearchHero from "@/components/PropertySearchHero";
import MakeOfferButton from "@/components/MakeOfferButton";
import { getPropertyBySlug, getCityData } from "@/libs/propertyGeo";
import {
  getSEOTags,
  renderBreadcrumbSchema,
  renderFaqSchema,
  safeJsonLd,
} from "@/libs/seo";
import {
  stateUrl,
  cityUrl,
  paisUrl,
  propertyUrl,
} from "@/libs/propertyUrls.mjs";
import { knownCountry } from "@/libs/geoDirectory.mjs";
import { slugify } from "@/libs/slugify.js";
import {
  listingTitle,
  listingDescription,
  detailFaqs,
  capFirst,
  PROPERTY_TYPES,
  LISTING_TYPES,
} from "@/libs/geoSeo.mjs";
import { imageSrc, imageSrcList } from "@/libs/propertyImages";
import config from "@/config";

// ISR 1h: el HTML se cachea en el edge (TTFB bajo → PageSpeed) y se purga
// al publicar/aprobar/editar/borrar (ver app/api/properties). La ficha
// cambia poco: casi siempre se sirve instantánea desde caché.
export const revalidate = 3600;

// Detalle de propiedad: /propiedades/chihuahua/delicias/casa-en-venta-centro-a1b2c3
// El lookup es por `propertySlug` (único). Si los segmentos de estado/ciudad
// de la URL no coinciden con el documento (ej. alguien cambió la ciudad de la
// propiedad después de publicada), se redirige 301 a la canónica — una sola
// URL por listado, sin duplicados.
export async function generateMetadata({ params }) {
  const { param, ciudad, slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return getSEOTags({
      title: "Propiedad no encontrada | Casas Cripto",
      canonicalUrlRelative: `/propiedades/${param}/${ciudad}/${slug}`,
    });
  }

  const title = listingTitle(property);
  const description = listingDescription(property);
  const ogImage = imageSrc(property.images?.[0]);
  const canonical = propertyUrl(property);

  return getSEOTags({
    title,
    description,
    canonicalUrlRelative: canonical,
    extraTags: {
      openGraph: {
        title,
        description,
        url: canonical,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    },
  });
}

export default async function PropertyDetailPage({ params }) {
  const { param, ciudad, slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const canonical = propertyUrl(property);
  if (
    property.stateSlug !== param ||
    property.citySlug !== ciudad ||
    canonical !== `/propiedades/${param}/${ciudad}/${slug}`
  ) {
    permanentRedirect(canonical);
  }

  const baseUrl = `https://${config.domainName}`;
  const place = [property.city, property.state].filter(Boolean).join(", ");
  const typeLabel = PROPERTY_TYPES[property.propertyType]?.singular;
  const opLabel = LISTING_TYPES[property.listingType];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || property.title,
    url: `${baseUrl}${canonical}`,
    datePosted: property.createdAt,
    ...(property.images?.length && { image: imageSrcList(property.images) }),
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      ...(property.state && { addressRegion: property.state }),
      ...(property.country && { addressCountry: property.country }),
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency || "USD",
      availability: "https://schema.org/InStock",
    },
  };

  // País en las migas (visible + schema). Prefiere countrySlug guardado;
  // cae a slugify(country) para docs viejos sin migrar.
  const detailCountrySlug = property.countrySlug || slugify(property.country);
  const countryCrumb =
    detailCountrySlug && knownCountry(detailCountrySlug)
      ? { label: property.country, slug: detailCountrySlug }
      : null;

  const breadcrumbItems = [
    { name: "Inicio", url: `${baseUrl}/` },
    { name: "Propiedades", url: `${baseUrl}/propiedades` },
    ...(countryCrumb
      ? [
          {
            name: countryCrumb.label,
            url: `${baseUrl}${paisUrl(countryCrumb.slug)}`,
          },
        ]
      : []),
    ...(property.stateSlug
      ? [
          {
            name: property.state || property.country,
            url: `${baseUrl}${stateUrl(property.stateSlug)}`,
          },
        ]
      : []),
    ...(property.citySlug
      ? [
          {
            name: property.city,
            url: `${baseUrl}${cityUrl(property.stateSlug, property.citySlug)}`,
          },
        ]
      : []),
    { name: property.title, url: `${baseUrl}${canonical}` },
  ];

  // "Más en esta ciudad" — interlinking entre detalles + frescura de enlaces
  // internos. Excluye la propiedad actual.
  const { properties: neighbors } = await getCityData(
    property.stateSlug,
    property.citySlug,
  );
  const related = neighbors.filter((p) => p.id !== property.id).slice(0, 3);

  return (
    <>
      <Script
        type="application/ld+json"
        id={`json-ld-property-${property.id}`}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      {renderBreadcrumbSchema(breadcrumbItems)}
      {renderFaqSchema(detailFaqs(property))}
      <main className="min-h-screen">
        {/* Contenedor 7xl como en listados: héroe y breadcrumb arrancan en
            la misma X; el cuerpo de la ficha se estrecha a 5xl dentro. */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 md:pt-8 pb-16 md:pb-24">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Propiedades", href: "/propiedades" },
              ...(countryCrumb
                ? [
                    {
                      label: countryCrumb.label,
                      href: paisUrl(countryCrumb.slug),
                    },
                  ]
                : []),
              ...(property.stateSlug
                ? [
                    {
                      label: property.state || property.country,
                      href: stateUrl(property.stateSlug),
                    },
                  ]
                : []),
              ...(property.citySlug
                ? [
                    {
                      label: property.city,
                      href: cityUrl(property.stateSlug, property.citySlug),
                    },
                  ]
                : []),
              { label: property.title },
            ]}
          />
          <div className="mb-8">
            <PropertySearchHero
              idPrefix="detail-search"
              base={
                property.stateSlug && property.citySlug
                  ? cityUrl(property.stateSlug, property.citySlug)
                  : "/propiedades"
              }
            />
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                {property.images?.[0] ? (
                  <PropertyImage
                    image={property.images[0]}
                    alt={`${property.title} en ${place}`}
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
                        alt={`${property.title} en ${place} - foto ${i + 2}`}
                        sizes="(max-width: 1024px) 33vw, 20vw"
                        className="w-full aspect-[4/3] object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {property.featured &&
                    property.featuredUntil &&
                    new Date(property.featuredUntil) > new Date() && (
                      <span className="badge badge-warning font-semibold gap-1">
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
                  {typeLabel && (
                    <span className="badge badge-primary badge-outline">
                      {capFirst(`${typeLabel} ${opLabel || ""}`.trim())}
                    </span>
                  )}
                </div>

                <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight mt-4">
                  {property.title}
                </h1>
                <p className="opacity-60 mt-1 break-words">
                  {property.city}
                  {property.state ? `, ${property.state}` : ""}
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
                          <span
                            key={c}
                            className="badge badge-primary badge-outline gap-1.5"
                          >
                            <CryptoIcon symbol={c} size={16} />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <MakeOfferButton
                    property={{
                      id: property.id,
                      title: property.title,
                      price: property.price,
                      currency: property.currency,
                      cryptoAccepted: property.cryptoAccepted || [],
                    }}
                  />

                  {property.contactEmail && (
                    <a
                      href={`mailto:${property.contactEmail}?subject=${encodeURIComponent(
                        `Interesado en: ${property.title}`,
                      )}`}
                      className="btn btn-outline btn-block"
                    >
                      Contactar al propietario
                    </a>
                  )}

                  <p className="text-xs opacity-50 text-center">
                    Oferta con escrow en Ethereum (beta, red Sepolia) o trato
                    directo con el propietario por correo.
                  </p>
                </div>
              </div>
            </div>

            <FaqAccordion
              faqs={detailFaqs(property)}
              heading={`Preguntas sobre esta propiedad en ${property.city}`}
            />

            {related.length > 0 && (
              <section className="mt-16 md:mt-20">
                <div className="flex items-baseline justify-between gap-4 mb-6">
                  <h2 className="font-extrabold text-2xl tracking-tight">
                    Más propiedades en {property.city}
                  </h2>
                  <Link
                    href={cityUrl(property.stateSlug, property.citySlug)}
                    className="link link-primary text-sm whitespace-nowrap"
                  >
                    Ver todas
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {related.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
