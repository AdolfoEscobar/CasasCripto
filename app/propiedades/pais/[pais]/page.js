import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Footer from "@/components/Footer";
import ButtonAuthCta from "@/components/ButtonAuthCta";
import PropertyCard from "@/components/PropertyCard";
import FaqAccordion from "@/components/FaqAccordion";
import Breadcrumbs from "@/components/Breadcrumbs";
import PropertySearchHero from "@/components/PropertySearchHero";
import {
  SortPills,
  StatsStrip,
  RelatedSearches,
} from "@/components/GeoWidgets";
import { getCountryData, parseGeoFilters } from "@/libs/propertyGeo";
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
import {
  geoTitle,
  geoDescription,
  geoIntro,
  geoFaqs,
  keywordSubject,
  capFirst,
  summarizeListings,
} from "@/libs/geoSeo.mjs";
import { popularCities, knownCountry } from "@/libs/geoDirectory.mjs";
import config from "@/config";

// ISR 1h: el HTML se cachea en el edge (TTFB bajo → PageSpeed) y se purga
// al publicar/aprobar/editar/borrar (ver app/api/properties). Cada URL con
// query cachea su propia variante: los filtros siguen correctos.
export const revalidate = 3600;

// Landing de país (/propiedades/pais/mexico): agrega estados, ciudades y
// listados de un país. Misma política que estado/ciudad: con inventario
// siempre; vacío solo si está en el registro curado (con guía editorial);
// lo demás 404. Acepta ?q= (búsqueda con noindex) y filtros.
export async function generateMetadata({ params, searchParams }) {
  const { pais } = await params;
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const filters = parseGeoFilters(sp);
  const data = await getCountryData(pais, { q, filters });
  if (data.totalCount === 0 && !knownCountry(pais)) {
    const tags = getSEOTags({
      title: "Página no encontrada | Casas Cripto",
      canonicalUrlRelative: paisUrl(pais),
    });
    tags.robots = "noindex, follow";
    return tags;
  }

  const known = data.totalCount === 0 ? knownCountry(pais) : null;
  const country = known?.name || data.countryName;
  const stats = summarizeListings(data.properties);
  const geo = { ...filters, country, ...stats, cryptos: stats.topCryptos };

  if (q) {
    const tags = getSEOTags({
      title: `Resultados para "${q}" en ${country} | Casas Cripto`,
      description:
        `Propiedades que aceptan cripto en ${country} relacionadas con "${q}".`.slice(
          0,
          160,
        ),
      canonicalUrlRelative: paisUrl(pais),
    });
    tags.robots = "noindex, follow";
    return tags;
  }

  return getSEOTags({
    title: geoTitle(geo),
    description: geoDescription(geo),
    canonicalUrlRelative: paisUrl(pais),
  });
}

export default async function PaisPage({ params, searchParams }) {
  const { pais } = await params;
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const filters = parseGeoFilters(sp);
  const data = await getCountryData(pais, { q, filters });
  const { properties, totalCount, states, cities } = data;
  if (totalCount === 0 && !knownCountry(pais)) notFound();
  if (pais !== pais.toLowerCase()) {
    permanentRedirect(
      geoPageUrl(paisUrl(pais.toLowerCase()), {
        q: sp.q,
        tipo: sp.tipo,
        operacion: sp.operacion,
        orden: sp.orden,
      }),
    );
  }

  const known = totalCount === 0 ? knownCountry(pais) : null;
  const country = known?.name || data.countryName;
  const stats = summarizeListings(properties);
  const geo = { ...filters, country, ...stats, cryptos: stats.topCryptos };
  const subject = keywordSubject(filters);
  const intro = geoIntro(geo);
  const faqs = geoFaqs(geo);
  const filtersActive = Boolean(
    filters.propertyType || filters.listingType || q,
  );
  const shownCount = filtersActive ? properties.length : totalCount;
  const baseUrl = `https://${config.domainName}`;

  const breadcrumbItems = [
    { name: "Inicio", url: `${baseUrl}/` },
    { name: "Propiedades", url: `${baseUrl}/propiedades` },
    { name: country, url: `${baseUrl}${paisUrl(pais)}` },
  ];

  const listedKeys = new Set(cities.map((c) => `${c.stateSlug}/${c.slug}`));
  const popularMissing = popularCities.filter(
    (c) =>
      c.country === country && !listedKeys.has(`${c.stateSlug}/${c.citySlug}`),
  );

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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 md:pt-8 pb-16 md:pb-24">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Propiedades", href: "/propiedades" },
              { label: q ? `Buscar: ${q}` : country },
            ]}
          />
          <div className="mb-8">
            <PropertySearchHero
              idPrefix="country-search"
              base={paisUrl(pais)}
            />
          </div>

          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="font-medium text-primary mb-3">País</p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {q ? (
                <>
                  Resultados para “{q}” en {country}
                </>
              ) : (
                <>
                  {capFirst(subject)} en {country}
                </>
              )}
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

          <SortPills
            base={paisUrl(pais)}
            filters={filters}
            sort={filters.sort}
            q={q}
            count={shownCount}
          />

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                {totalCount === 0 ? (
                  <>
                    Todavía no hay {subject} en {country}
                  </>
                ) : q ? (
                  <>
                    Sin resultados para “{q}” en {country}
                  </>
                ) : (
                  <>Sin resultados para este filtro en {country}</>
                )}
              </p>
              <p className="opacity-70">
                {totalCount === 0 ? (
                  <>
                    Sé el primero en publicar una propiedad crypto-friendly en{" "}
                    {country} — es gratis y toma unos minutos.
                  </>
                ) : (
                  <>
                    Prueba con otra búsqueda u otros filtros, o{" "}
                    <Link href={paisUrl(pais)} className="link link-primary">
                      ver todo {country}
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
                  Publicar en {country} gratis
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

          {(states.length > 0 || popularMissing.length > 0) && (
            <section className="mt-16 md:mt-20 text-center">
              <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
                Explorar {country} por ubicación
              </h2>
              {states.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {states.map((state) => (
                    <Link
                      key={state.slug}
                      href={stateUrl(state.slug)}
                      className="badge badge-lg badge-primary badge-outline min-h-[40px]"
                    >
                      {state.name} ({state.count})
                    </Link>
                  ))}
                </div>
              )}
              {popularMissing.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {popularMissing.map((c) => (
                    <Link
                      key={`${c.stateSlug}/${c.citySlug}`}
                      href={cityUrl(c.stateSlug, c.citySlug)}
                      className="badge badge-lg badge-ghost border border-base-content/20 min-h-[40px]"
                    >
                      {c.city}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {totalCount > 0 && (
            <RelatedSearches base={paisUrl(pais)} place={country} />
          )}

          <FaqAccordion
            faqs={faqs}
            heading={`Preguntas sobre ${subject} en ${country}`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
