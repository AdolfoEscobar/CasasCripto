import Link from "next/link";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import FaqAccordion from "@/components/FaqAccordion";
import { getCityData, parseGeoFilters } from "@/libs/propertyGeo";
import {
  getSEOTags,
  renderBreadcrumbSchema,
  renderFaqSchema,
  renderItemListSchema,
} from "@/libs/seo";
import { stateUrl, cityUrl, propertyUrl } from "@/libs/propertyUrls.mjs";
import {
  geoTitle,
  geoDescription,
  geoIntro,
  geoFaqs,
  keywordSubject,
  capFirst,
  summarizeListings,
  PROPERTY_TYPES,
  LISTING_TYPES,
} from "@/libs/geoSeo.mjs";
import config from "@/config";

export const dynamic = "force-dynamic";

// Página SEO por ciudad: /propiedades/chihuahua/delicias. La ciudad SIEMPRE
// va anidada bajo su estado — eso desambigua ("Guadalajara" en Jalisco vs
// España) y mete la keyword del estado en la URL de la ciudad.
export async function generateMetadata({ params, searchParams }) {
  const { param, ciudad } = await params;
  const sp = (await searchParams) || {};
  const filters = parseGeoFilters(sp);
  const data = await getCityData(param, ciudad, filters);
  const stats = summarizeListings(data.properties);

  const tags = getSEOTags({
    title: geoTitle({
      ...filters,
      city: data.cityName,
      state: data.stateName,
      country: data.country,
    }),
    description: geoDescription({
      ...filters,
      city: data.cityName,
      state: data.stateName,
      country: data.country,
      ...stats,
      cryptos: stats.topCryptos,
    }),
    canonicalUrlRelative: cityUrl(param, ciudad),
  });
  // Ciudad sin listados: existe (CTA) pero no se indexa hasta tener contenido.
  if (data.totalCount === 0) tags.robots = "noindex, follow";
  return tags;
}

function FilterChips({ param, ciudad, filters }) {
  const tipoActive = filters.propertyType;
  const opActive = filters.listingType;
  const hrefFor = (tipo, operacion) => {
    const q = new URLSearchParams();
    if (tipo) q.set("tipo", tipo);
    if (operacion) q.set("operacion", operacion);
    const qs = q.toString();
    return `${cityUrl(param, ciudad)}${qs ? `?${qs}` : ""}`;
  };
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href={hrefFor(null, opActive)}
          className={`badge badge-lg min-h-[40px] ${!tipoActive ? "badge-primary" : "badge-ghost border border-base-content/20"}`}
        >
          Todo
        </Link>
        {Object.entries(PROPERTY_TYPES).map(([key, labels]) => (
          <Link
            key={key}
            href={hrefFor(key, opActive)}
            className={`badge badge-lg min-h-[40px] ${tipoActive === key ? "badge-primary" : "badge-ghost border border-base-content/20"}`}
          >
            {capFirst(labels.plural)}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(LISTING_TYPES).map(([key, label]) => (
          <Link
            key={key}
            href={hrefFor(tipoActive, opActive === key ? null : key)}
            className={`badge badge-lg min-h-[40px] ${opActive === key ? "badge-secondary" : "badge-ghost border border-base-content/20"}`}
          >
            {capFirst(label)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function CiudadPage({ params, searchParams }) {
  const { param, ciudad } = await params;
  const sp = (await searchParams) || {};
  const filters = parseGeoFilters(sp);
  const { properties, totalCount, cityName, stateName, country, siblingCities } =
    await getCityData(param, ciudad, filters);
  const stats = summarizeListings(properties);
  const subject = keywordSubject(filters);
  const filtersActive = Boolean(filters.propertyType || filters.listingType);
  const shownCount = filtersActive ? properties.length : totalCount;
  const geo = { ...filters, city: cityName, state: stateName, country, ...stats };
  const intro = geoIntro(geo);
  const faqs = geoFaqs(geo);
  const baseUrl = `https://${config.domainName}`;

  const breadcrumbItems = [
    { name: "Propiedades", url: `${baseUrl}/propiedades` },
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
        }))
      )}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24">
          <div className="text-sm breadcrumbs mb-6 opacity-70 justify-center">
            <ul>
              <li>
                <Link href="/propiedades">Propiedades</Link>
              </li>
              <li>
                <Link href={stateUrl(param)} title={stateName}>
                  {stateName}
                </Link>
              </li>
              <li className="min-w-0">
                <span className="truncate max-w-[40vw] block" title={cityName}>
                  {cityName}
                </span>
              </li>
            </ul>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="font-medium text-primary mb-3">
              <Link href={stateUrl(param)} className="link link-hover">
                {stateName}
              </Link>
              {country ? `, ${country}` : ""}
            </p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {capFirst(subject)} en {cityName}, {stateName}
              {shownCount > 0 && (
                <span className="opacity-50 text-2xl sm:text-3xl lg:text-4xl"> ({shownCount})</span>
              )}
            </h1>
            <p className="opacity-70 leading-relaxed">{intro}</p>
          </div>

          {totalCount > 0 && (
            <FilterChips param={param} ciudad={ciudad} filters={filters} />
          )}

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                {totalCount === 0 ? (
                  <>Todavía no hay {subject} en {cityName}</>
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
                    <Link href={cityUrl(param, ciudad)} className="link link-primary">
                      ver todo {cityName}
                    </Link>
                    .
                  </>
                )}
              </p>
              {totalCount === 0 && (
                <Link
                  href="/dashboard"
                  className="btn btn-primary max-w-full whitespace-normal text-center"
                >
                  Publicar en {cityName} gratis
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
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
