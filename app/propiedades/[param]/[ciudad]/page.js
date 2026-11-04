import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Footer from "@/components/Footer";
import ButtonAuthCta from "@/components/ButtonAuthCta";
import PropertyCard from "@/components/PropertyCard";
import FaqAccordion from "@/components/FaqAccordion";
import PropertySearchHero from "@/components/PropertySearchHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getCityData, parseGeoFilters } from "@/libs/propertyGeo";
import {
  SortPills,
  StatsStrip,
  RelatedSearches,
} from "@/components/GeoWidgets";
import {
  getSEOTags,
  renderBreadcrumbSchema,
  renderFaqSchema,
  renderItemListSchema,
} from "@/libs/seo";
import {
  stateUrl,
  cityUrl,
  paisUrl,
  propertyUrl,
  geoPageUrl,
} from "@/libs/propertyUrls.mjs";
import { knownCity, knownCountry } from "@/libs/geoDirectory.mjs";
import { slugify } from "@/libs/slugify.js";
import {
  geoTitle,
  geoDescription,
  geoIntro,
  geoFaqs,
  keywordSubject,
  capFirst,
  summarizeListings,
} from "@/libs/geoSeo.mjs";
import config from "@/config";

// ISR 1h: el HTML se cachea en el edge (TTFB bajo → PageSpeed) y se purga
// al publicar/aprobar/editar/borrar (ver app/api/properties). Cada URL con
// query cachea su propia variante: los filtros siguen correctos.
export const revalidate = 3600;

// Página SEO por ciudad: /propiedades/chihuahua/delicias. La ciudad SIEMPRE
// va anidada bajo su estado — eso desambigua ("Guadalajara" en Jalisco vs
// España) y mete la keyword del estado en la URL de la ciudad.
export async function generateMetadata({ params, searchParams }) {
  const { param, ciudad } = await params;
  const sp = (await searchParams) || {};
  const filters = parseGeoFilters(sp);
  const data = await getCityData(param, ciudad, filters);
  // Misma política que el estado: con inventario siempre; vacía solo si la
  // pareja estado/ciudad está en el registro curado. Lo demás es 404 (el
  // render llama notFound(); aquí se devuelve respaldo con noindex).
  if (data.totalCount === 0 && !knownCity(param, ciudad)) {
    const tags = getSEOTags({
      title: "Página no encontrada | Casas Cripto",
      canonicalUrlRelative: cityUrl(param, ciudad),
    });
    tags.robots = "noindex, follow";
    return tags;
  }
  const known = data.totalCount === 0 ? knownCity(param, ciudad) : null;
  const cityName = known?.city || data.cityName;
  const stateName = known?.state || data.stateName;
  const country = known ? known.country : data.country;
  const stats = summarizeListings(data.properties);

  return getSEOTags({
    title: geoTitle({ ...filters, city: cityName, state: stateName, country }),
    description: geoDescription({
      ...filters,
      city: cityName,
      state: stateName,
      country,
      ...stats,
      cryptos: stats.topCryptos,
    }),
    canonicalUrlRelative: cityUrl(param, ciudad),
  });
}

export default async function CiudadPage({ params, searchParams }) {
  const { param, ciudad } = await params;
  const sp = (await searchParams) || {};
  const filters = parseGeoFilters(sp);
  const data = await getCityData(param, ciudad, filters);
  const { properties, totalCount, siblingCities } = data;
  if (totalCount === 0 && !knownCity(param, ciudad)) notFound();
  // Canónicas en minúsculas (ver página de estado): 301 preservando filtros.
  if (param !== param.toLowerCase() || ciudad !== ciudad.toLowerCase()) {
    permanentRedirect(
      geoPageUrl(cityUrl(param.toLowerCase(), ciudad.toLowerCase()), {
        tipo: sp.tipo,
        operacion: sp.operacion,
        orden: sp.orden,
      }),
    );
  }
  const known = totalCount === 0 ? knownCity(param, ciudad) : null;
  const cityName = known?.city || data.cityName;
  const stateName = known?.state || data.stateName;
  const country = known ? known.country : data.country;
  const countrySlug = slugify(country);
  const countryCrumb =
    countrySlug && knownCountry(countrySlug)
      ? { label: country, slug: countrySlug }
      : null;
  const stats = summarizeListings(properties);
  const subject = keywordSubject(filters);
  const filtersActive = Boolean(filters.propertyType || filters.listingType);
  const shownCount = filtersActive ? properties.length : totalCount;
  const geo = {
    ...filters,
    city: cityName,
    state: stateName,
    country,
    ...stats,
  };
  const intro = geoIntro(geo);
  const faqs = geoFaqs(geo);
  const baseUrl = `https://${config.domainName}`;

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
    { name: stateName, url: `${baseUrl}${stateUrl(param)}` },
    { name: cityName, url: `${baseUrl}${cityUrl(param, ciudad)}` },
  ];

  return (
    <>
      {renderBreadcrumbSchema(breadcrumbItems)}
      {renderFaqSchema(faqs)}
      {renderItemListSchema(
        properties.map((p) => ({
          name: p.title,
          url: `${baseUrl}${propertyUrl(p)}`,
        })),
      )}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 md:pt-16 pb-16 md:pb-24">
          <div className="mb-8">
            <PropertySearchHero
              idPrefix="city-search"
              base={cityUrl(param, ciudad)}
            />
          </div>
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
              { label: stateName, href: stateUrl(param) },
              { label: cityName },
            ]}
          />
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="font-medium text-primary mb-3">
              <Link href={stateUrl(param)} className="link link-hover">
                {stateName}
              </Link>
              {country ? `, ${country}` : ""}
            </p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {capFirst(subject)} en {cityName}, {stateName}
            </h1>
            <p className="opacity-70 leading-relaxed">{intro}</p>
            {known?.guide && (
              <p className="opacity-70 leading-relaxed mt-4">{known.guide}</p>
            )}
          </div>

          <StatsStrip
            minPrice={stats.minPrice}
            currency={stats.currency}
            topCryptos={stats.topCryptos}
          />

          {/* Inmediatez (igual que el hub): el héroe es el único filtro;
              aquí solo queda el conteo discreto + orden. */}
          <SortPills
            base={cityUrl(param, ciudad)}
            filters={filters}
            sort={filters.sort}
            count={shownCount}
          />

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                {totalCount === 0 ? (
                  <>
                    Todavía no hay {subject} en {cityName}
                  </>
                ) : (
                  <>Sin resultados para este filtro en {cityName}</>
                )}
              </p>
              <p className="opacity-70">
                {totalCount === 0 ? (
                  <>
                    Sé el primero en publicar una propiedad crypto-friendly en{" "}
                    {cityName}, o explora{" "}
                    <Link href={stateUrl(param)} className="link link-primary">
                      más propiedades en {stateName}
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Prueba con otro tipo u operación, o{" "}
                    <Link
                      href={cityUrl(param, ciudad)}
                      className="link link-primary"
                    >
                      ver todo {cityName}
                    </Link>
                    .
                  </>
                )}
              </p>
              {totalCount === 0 && (
                <ButtonAuthCta
                  href={config.auth.callbackUrl}
                  className="btn btn-primary max-w-full whitespace-normal text-center"
                >
                  Publicar en {cityName} gratis
                </ButtonAuthCta>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {properties.map((property, i) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  eager={i === 0}
                />
              ))}
            </div>
          )}

          {siblingCities.length > 0 && (
            <section className="mt-16 md:mt-20 text-center">
              <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
                Más ciudades en {stateName}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {siblingCities.slice(0, 12).map((sib) => (
                  <Link
                    key={sib.slug}
                    href={cityUrl(param, sib.slug)}
                    className="badge badge-lg badge-ghost border border-base-content/20 min-h-[40px]"
                  >
                    {sib.name} ({sib.count})
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalCount > 0 && (
            <RelatedSearches
              base={cityUrl(param, ciudad)}
              place={`${cityName}, ${stateName}`}
            />
          )}

          <FaqAccordion
            faqs={faqs}
            heading={`Preguntas sobre ${subject} en ${cityName}, ${stateName}`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
