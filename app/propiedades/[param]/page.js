import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import FaqAccordion from "@/components/FaqAccordion";
import {
  getStateData,
  getPropertyById,
  parseGeoFilters,
} from "@/libs/propertyGeo";
import {
  getSEOTags,
  renderBreadcrumbSchema,
  renderFaqSchema,
  renderItemListSchema,
} from "@/libs/seo";
import {
  stateUrl,
  cityUrl,
  propertyUrl,
  isObjectIdParam,
} from "@/libs/propertyUrls.mjs";
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

// Esta ruta cumple DOS funciones:
// 1. /propiedades/[estado] → página SEO por estado (ej. /propiedades/chihuahua).
// 2. /propiedades/[ObjectId] → redirect 301 permanente a la URL canónica con
//    keywords. Es el formato viejo de detalle (/propiedades/[id]): Next no
//    permite dos segmentos dinámicos al mismo nivel, así que se distinguen
//    por forma (24 hex = id legacy, ver isObjectIdParam).
async function resolveContext(param, searchParams) {
  if (isObjectIdParam(param)) {
    const property = await getPropertyById(param);
    return { kind: property ? "legacy-id" : "not-found", property };
  }
  if (param === "ciudad") return { kind: "ciudad-index" };
  const filters = parseGeoFilters(searchParams);
  const data = await getStateData(param, filters);
  return { kind: "state", ...data, filters };
}

export async function generateMetadata({ params, searchParams }) {
  const { param } = await params;
  const sp = (await searchParams) || {};
  const ctx = await resolveContext(param, sp);

  if (ctx.kind === "legacy-id") {
    // Respaldo: el render redirige 301, pero si algo lo muestra, el canonical
    // apunta a la URL buena para no indexar la legacy.
    return getSEOTags({ canonicalUrlRelative: propertyUrl(ctx.property) });
  }
  if (ctx.kind === "not-found") {
    return getSEOTags({
      title: "Propiedad no encontrada | Casas Cripto",
      canonicalUrlRelative: `/propiedades/${param}`,
    });
  }
  if (ctx.kind === "ciudad-index") {
    return getSEOTags({ canonicalUrlRelative: "/propiedades" });
  }

  const { filters, stateName, country, mixedCountries, properties } = ctx;
  const stats = summarizeListings(properties);
  // El canonical SIEMPRE es la URL base del estado, sin ?tipo/?operacion:
  // los filtros son vistas de la misma página, no páginas distintas.
  const tags = getSEOTags({
    title: geoTitle({
      ...filters,
      state: stateName,
      country,
      mixedCountries,
    }),
    description: geoDescription({
      ...filters,
      state: stateName,
      country,
      ...stats,
      cryptos: stats.topCryptos,
    }),
    canonicalUrlRelative: stateUrl(param),
  });
  // Estado sin listados: existe (CTA de "publica aquí") pero no se indexa —
  // evita que Google marque la página como thin content. En cuanto se publica
  // la primera propiedad, el noindex desaparece solo.
  if (ctx.totalCount === 0) tags.robots = "noindex, follow";
  return tags;
}

// Chips de filtro (?tipo=casa&operacion=venta): links normales, server-side.
// Cada chip preserva el otro filtro activo.
function FilterChips({ param, filters }) {
  const tipoActive = filters.propertyType;
  const opActive = filters.listingType;
  const hrefFor = (tipo, operacion) => {
    const q = new URLSearchParams();
    if (tipo) q.set("tipo", tipo);
    if (operacion) q.set("operacion", operacion);
    const qs = q.toString();
    return `${stateUrl(param)}${qs ? `?${qs}` : ""}`;
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

export default async function EstadoPage({ params, searchParams }) {
  const { param } = await params;
  const sp = (await searchParams) || {};
  const ctx = await resolveContext(param, sp);

  if (ctx.kind === "legacy-id") {
    const canonical = propertyUrl(ctx.property);
    // Si el doc no tiene slugs ni se pudieron generar, redirigir a su propia
    // URL sería un loop infinito — mejor mandar al hub (temporal, no 301).
    if (canonical === `/propiedades/${param}`) redirect("/propiedades");
    permanentRedirect(canonical);
  }
  if (ctx.kind === "not-found") notFound();
  if (ctx.kind === "ciudad-index") redirect("/propiedades");

  const {
    properties,
    totalCount,
    stateName,
    country,
    mixedCountries,
    cities,
    filters,
  } = ctx;
  const stats = summarizeListings(properties);
  const subject = keywordSubject(filters);
  // Con filtros activos el conteo del H1 es el de la vista filtrada (no el
  // total del estado): el número siempre debe cuadrar con la cuadrícula.
  const filtersActive = Boolean(filters.propertyType || filters.listingType);
  const shownCount = filtersActive ? properties.length : totalCount;
  const place = mixedCountries ? stateName : [stateName, country].filter(Boolean).join(", ");
  const intro = geoIntro({ ...filters, state: stateName, country, ...stats });
  const faqs = geoFaqs({ ...filters, state: stateName, country, ...stats });
  const baseUrl = `https://${config.domainName}`;

  const breadcrumbItems = [
    { name: "Propiedades", url: `${baseUrl}/propiedades` },
    { name: stateName, url: `${baseUrl}${stateUrl(param)}` },
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
                <span className="truncate max-w-[40vw] block" title={stateName}>
                  {stateName}
                </span>
              </li>
            </ul>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-8">
            {country && !mixedCountries && (
              <p className="font-medium text-primary mb-3">{country}</p>
            )}
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {capFirst(subject)} en {stateName}
              {shownCount > 0 && (
                <span className="opacity-50 text-2xl sm:text-3xl lg:text-4xl"> ({shownCount})</span>
              )}
            </h1>
            <p className="opacity-70 leading-relaxed">{intro}</p>
          </div>

          {totalCount > 0 && <FilterChips param={param} filters={filters} />}

          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={cityUrl(param, city.slug)}
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
                {totalCount === 0 ? (
                  <>Todavía no hay {subject} en {stateName}</>
                ) : (
                  <>Sin resultados para este filtro en {stateName}</>
                )}
              </p>
              <p className="opacity-70">
                {totalCount === 0 ? (
                  <>
                    Sé el primero en publicar una propiedad crypto-friendly en{" "}
                    {place}, o explora{" "}
                    <Link href="/propiedades" className="link link-primary">
                      todas las propiedades disponibles
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Prueba con otro tipo u operación, o{" "}
                    <Link href={stateUrl(param)} className="link link-primary">
                      ver todo {stateName}
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
                  Publicar en {stateName} gratis
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

          <FaqAccordion
            faqs={faqs}
            heading={`Preguntas sobre ${subject} en ${stateName}`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
