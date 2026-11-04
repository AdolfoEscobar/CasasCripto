import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import Footer from "@/components/Footer";
import ButtonAuthCta from "@/components/ButtonAuthCta";
import PropertyCard from "@/components/PropertyCard";
import FaqAccordion from "@/components/FaqAccordion";
import PropertySearchHero from "@/components/PropertySearchHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  getStateData,
  getMarketplaceData,
  getPropertyById,
  parseGeoFilters,
} from "@/libs/propertyGeo";
import {
  SortPills,
  StatsStrip,
  RelatedSearches,
} from "@/components/GeoWidgets";
import {
  popularCities,
  citiesOfState,
  knownState,
  knownCountry,
  allStateSlugs,
  countryEntries,
} from "@/libs/geoDirectory.mjs";
import { slugify } from "@/libs/slugify.js";
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
  isObjectIdParam,
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
import config from "@/config";

// ISR 1h: el HTML se cachea en el edge (TTFB bajo → PageSpeed) y se purga
// al publicar/aprobar/editar/borrar (ver app/api/properties). Cada URL con
// query (?tipo=, ?orden=...) cachea su propia variante: filtros y 404/301
// siguen correctos, solo servidos desde caché.
export const revalidate = 3600;

// Esta ruta cumple TRES funciones:
// 1. /propiedades/[estado] → página SEO por estado (ej. /propiedades/chihuahua).
// 2. /propiedades/[ObjectId] → redirect 301 permanente a la URL canónica con
//    keywords. Es el formato viejo de detalle (/propiedades/[id]): Next no
//    permite dos segmentos dinámicos al mismo nivel, así que se distinguen
//    por forma (24 hex = id legacy, ver isObjectIdParam).
// 3. /propiedades/ciudad → directorio de estados y ciudades (con inventario
//    y populares) para descubrimiento e interlinking.
async function resolveContext(param, searchParams) {
  if (isObjectIdParam(param)) {
    const property = await getPropertyById(param);
    return { kind: property ? "legacy-id" : "not-found", property };
  }
  if (param === "ciudad") {
    const { states, cities } = await getMarketplaceData();
    return { kind: "ciudad-index", states, cities };
  }
  const filters = parseGeoFilters(searchParams);
  const data = await getStateData(param, filters);
  // Política de indexación: con inventario SIEMPRE se renderiza (la
  // plataforma es global y los listados mandan); sin inventario solo los
  // estados del registro curado (con guía editorial única). Cualquier otro
  // slug vacío es 404 — así el espacio indexable es finito.
  if (data.totalCount === 0 && !knownState(param)) {
    return { kind: "not-found" };
  }
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
    return getSEOTags({
      title:
        "Propiedades que aceptan cripto por estado y ciudad | Casas Cripto",
      description:
        "Directorio de estados y ciudades con propiedades que aceptan criptomonedas. Explora listados verificados por ubicación o publica el tuyo gratis.",
      canonicalUrlRelative: "/propiedades/ciudad",
    });
  }

  const { filters, properties } = ctx;
  // Vacío pero curado: nombre y país oficiales del registro (no el
  // "Ciudad De Mexico" de unslugify) para título, H1 y FAQs.
  const known = ctx.totalCount === 0 ? knownState(param) : null;
  const stateName = known?.name || ctx.stateName;
  const country = known ? known.country : ctx.country;
  const mixedCountries = known ? false : ctx.mixedCountries;
  const stats = summarizeListings(properties);
  // El canonical SIEMPRE es la URL base del estado, sin query (?tipo,
  // ?operacion, ?orden): los filtros son vistas de la misma página.
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
  // Sin inventario y fuera del registro no se llega aquí (es 404 en
  // resolveContext); el guard queda como red de seguridad.
  if (ctx.totalCount === 0 && !knownState(param)) {
    tags.robots = "noindex, follow";
  }
  return tags;
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
  if (ctx.kind === "ciudad-index") {
    return <CiudadDirectory states={ctx.states} cities={ctx.cities} />;
  }
  // URLs canónicas en minúsculas: /propiedades/Chihuahua duplicaría a
  // /propiedades/chihuahua. 301 a la minúscula preservando filtros.
  if (param !== param.toLowerCase()) {
    permanentRedirect(
      geoPageUrl(stateUrl(param.toLowerCase()), {
        tipo: sp.tipo,
        operacion: sp.operacion,
        orden: sp.orden,
      }),
    );
  }

  const {
    properties,
    totalCount,
    stateName: rawStateName,
    country: rawCountry,
    mixedCountries: rawMixed,
    cities,
    filters,
  } = ctx;
  const known = totalCount === 0 ? knownState(param) : null;
  const stateName = known?.name || rawStateName;
  const country = known ? known.country : rawCountry;
  const mixedCountries = known ? false : rawMixed;
  const stats = summarizeListings(properties);
  const subject = keywordSubject(filters);
  // Con filtros activos el conteo del H1 es el de la vista filtrada (no el
  // total del estado): el número siempre debe cuadrar con la cuadrícula.
  const filtersActive = Boolean(filters.propertyType || filters.listingType);
  const shownCount = filtersActive ? properties.length : totalCount;
  const place = mixedCountries
    ? stateName
    : [stateName, country].filter(Boolean).join(", ");
  const intro = geoIntro({ ...filters, state: stateName, country, ...stats });
  const faqs = geoFaqs({ ...filters, state: stateName, country, ...stats });
  const baseUrl = `https://${config.domainName}`;

  // País padre en las migas (visible + schema): interlinking hacia /pais/*.
  // Solo cuando no hay mezcla de países ni ambigüedad de slug.
  const countrySlug = !mixedCountries ? slugify(country) : "";
  const countryCrumb =
    countrySlug && knownCountry(countrySlug)
      ? { label: country, slug: countrySlug }
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
    { name: stateName, url: `${baseUrl}${stateUrl(param)}` },
  ];

  // Ciudades populares del estado aún sin listados: enlazan a su página
  // (mini-guía indexable + CTA) para descubrirlas y promoverlas.
  const inventorySlugs = new Set(cities.map((c) => c.slug));
  const popularMissing = citiesOfState(param).filter(
    (c) => !inventorySlugs.has(c.citySlug),
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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 md:pt-16 pb-16 md:pb-24">
          <div className="mb-8">
            <PropertySearchHero
              idPrefix="state-search"
              base={stateUrl(param)}
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
              { label: stateName },
            ]}
          />

          <div className="text-center max-w-2xl mx-auto mb-8">
            {country && !mixedCountries && (
              <p className="font-medium text-primary mb-3">{country}</p>
            )}
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {capFirst(subject)} en {stateName}
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
            base={stateUrl(param)}
            filters={filters}
            sort={filters.sort}
            count={shownCount}
          />

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                {totalCount === 0 ? (
                  <>
                    Todavía no hay {subject} en {stateName}
                  </>
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
                <ButtonAuthCta
                  href={config.auth.callbackUrl}
                  className="btn btn-primary max-w-full whitespace-normal text-center"
                >
                  Publicar en {stateName} gratis
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

          {(cities.length > 0 || popularMissing.length > 0) && (
            <section className="mt-16 md:mt-20 text-center">
              <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
                Ciudades en {stateName}
              </h2>
              {cities.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {cities.map((city) => (
                    <Link
                      key={city.slug}
                      href={cityUrl(param, city.slug)}
                      className="badge badge-lg badge-primary badge-outline min-h-[40px]"
                    >
                      {city.name} ({city.count})
                    </Link>
                  ))}
                </div>
              )}
              {popularMissing.length > 0 && (
                <>
                  <p className="opacity-70 mb-4 max-w-xl mx-auto">
                    Aún sin listados — sé el primero en publicar una propiedad
                    crypto-friendly en estas ciudades.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularMissing.map((c) => (
                      <Link
                        key={c.citySlug}
                        href={cityUrl(param, c.citySlug)}
                        className="badge badge-lg badge-ghost border border-base-content/20 min-h-[40px]"
                      >
                        {c.city}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {totalCount > 0 && (
            <RelatedSearches base={stateUrl(param)} place={stateName} />
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

// Directorio /propiedades/ciudad: estados y ciudades CON inventario (con
// conteo) + ciudades populares aún vacías. Es la página de descubrimiento:
// Google la indexa y desde aquí reparte PageRank a toda la jerarquía geo.
const DIRECTORY_FAQS = [
  {
    q: "¿Cómo busco propiedades por ciudad en Casas Cripto?",
    a: "Elige un país, estado o ciudad de este directorio para ver sus listados, o usa el buscador de arriba con autocompletado. Cada ciudad con inventario muestra su conteo entre paréntesis.",
  },
  {
    q: "¿Qué significa el número entre paréntesis de cada ciudad?",
    a: "Es la cantidad de propiedades publicadas hoy en esa ciudad. Solo aparece cuando hay al menos un listado; las ciudades sin número aún esperan su primera publicación.",
  },
  {
    q: "¿Por qué aparecen ciudades sin propiedades?",
    a: "Son ciudades populares donde ya puedes publicar gratis y estrenar el mercado local. Al publicar, tu propiedad aparece al instante en la página de esa ciudad.",
  },
  {
    q: "¿Cómo publico mi propiedad en una de estas ciudades?",
    a: "Crea tu cuenta gratis, sube tu propiedad indicando qué criptomonedas aceptas (USDC, USDT, BTC, ETH) y aparece en su estado y ciudad tras una revisión manual.",
  },
  {
    q: "¿En qué países puedo buscar propiedades?",
    a: "La plataforma es global: empieza por México, Estados Unidos, España, Colombia y más. Usa el filtro de país del buscador o entra a la página de cada país desde este directorio.",
  },
];

function CiudadDirectory({ states, cities }) {
  const baseUrl = `https://${config.domainName}`;
  // Todos los estados del registro (con conteo si hay inventario): así las
  // páginas vacías indexables reciben links internos desde aquí.
  const counts = new Map(states.map((s) => [s.slug, s.count]));
  const registrySlugs = new Set(allStateSlugs());
  // Estados con inventario fuera del registro (la plataforma es global):
  // también enlazan, con su nombre real del listado.
  const extraStates = states
    .filter((s) => !registrySlugs.has(s.slug))
    .map((s) => ({ slug: s.slug, name: s.name, count: s.count }));
  const allStates = [
    ...allStateSlugs().map((slug) => ({
      slug,
      name: knownState(slug).name,
      count: counts.get(slug) || 0,
    })),
    ...extraStates,
  ].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const listedKeys = new Set(cities.map((c) => `${c.stateSlug}/${c.slug}`));
  const popularMissing = popularCities.filter(
    (c) => !listedKeys.has(`${c.stateSlug}/${c.citySlug}`),
  );

  return (
    <>
      {renderBreadcrumbSchema([
        { name: "Inicio", url: `${baseUrl}/` },
        { name: "Propiedades", url: `${baseUrl}/propiedades` },
        { name: "Ciudades", url: `${baseUrl}/propiedades/ciudad` },
      ])}
      {renderFaqSchema(DIRECTORY_FAQS)}
      {renderItemListSchema([
        ...allStates.map((s) => ({
          name: s.name,
          url: `${baseUrl}${stateUrl(s.slug)}`,
        })),
        ...cities.map((c) => ({
          name: c.name,
          url: `${baseUrl}${cityUrl(c.stateSlug, c.slug)}`,
        })),
      ])}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 md:pt-16 pb-16 md:pb-24">
          <div className="mb-8">
            <PropertySearchHero idPrefix="directory-search" />
          </div>
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Propiedades", href: "/propiedades" },
              { label: "Ciudades" },
            ]}
          />

          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-medium text-primary mb-3">Directorio</p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Explora por estado y ciudad
            </h1>
          </div>

          <section className="mb-12">
            <h2 className="text-center font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
              Países
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {countryEntries().map((c) => (
                <Link
                  key={c.slug}
                  href={paisUrl(c.slug)}
                  className="badge badge-lg badge-accent badge-outline min-h-[40px]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-center font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
              Estados y regiones
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {allStates.map((state) => (
                <Link
                  key={state.slug}
                  href={stateUrl(state.slug)}
                  className="badge badge-lg badge-primary badge-outline min-h-[40px]"
                >
                  {state.name}
                  {state.count > 0 ? ` (${state.count})` : ""}
                </Link>
              ))}
            </div>
          </section>

          <CityGroups cities={cities} popularMissing={popularMissing} />

          <div className="text-center">
            <ButtonAuthCta
              href={config.auth.callbackUrl}
              className="btn btn-primary"
            >
              Publicar mi propiedad gratis
            </ButtonAuthCta>
          </div>

          <FaqAccordion
            faqs={DIRECTORY_FAQS}
            heading="Preguntas sobre el directorio"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

// Ciudades agrupadas por estado (con inventario primero, con conteo; luego
// populares aún vacías, sin conteo). En dos columnas en desktop, estilo
// directorio de portales — mucho más escaneable que una nube de chips.
function CityGroups({ cities, popularMissing }) {
  const groups = new Map();
  const ensureGroup = (stateSlug, stateName) => {
    if (!groups.has(stateSlug)) {
      groups.set(stateSlug, { slug: stateSlug, name: stateName, cities: [] });
    }
    return groups.get(stateSlug);
  };

  for (const city of cities) {
    ensureGroup(
      city.stateSlug,
      city.state || knownState(city.stateSlug)?.name || city.stateSlug,
    ).cities.push({
      key: `${city.stateSlug}/${city.slug}`,
      name: city.name,
      url: cityUrl(city.stateSlug, city.slug),
      count: city.count,
    });
  }
  for (const c of popularMissing) {
    ensureGroup(c.stateSlug, c.state).cities.push({
      key: `${c.stateSlug}/${c.citySlug}`,
      name: c.city,
      url: cityUrl(c.stateSlug, c.citySlug),
      count: null,
    });
  }

  // Orden dentro de cada grupo: con inventario primero (por conteo), luego
  // alfabético. Grupos con inventario antes que los vacíos.
  const sorted = [...groups.values()]
    .map((g) => ({
      ...g,
      cities: g.cities.sort(
        (a, b) =>
          (b.count || 0) - (a.count || 0) || a.name.localeCompare(b.name),
      ),
      hasInventory: g.cities.some((c) => c.count > 0),
    }))
    .sort(
      (a, b) =>
        Number(b.hasInventory) - Number(a.hasInventory) ||
        a.name.localeCompare(b.name),
    );

  if (sorted.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-center font-extrabold text-2xl sm:text-3xl tracking-tight mb-8">
        Ciudades por estado
      </h2>
      <div className="columns-1 md:columns-2 gap-8 max-w-4xl mx-auto">
        {sorted.map((group) => (
          <div key={group.slug} className="break-inside-avoid mb-8">
            <h3 className="font-bold mb-3">
              <Link
                href={stateUrl(group.slug)}
                className="link link-hover link-primary"
              >
                {group.name}
              </Link>
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.cities.map((city) => (
                <Link
                  key={city.key}
                  href={city.url}
                  className={`badge badge-lg min-h-[40px] ${
                    city.count > 0
                      ? "badge-primary badge-outline"
                      : "badge-ghost border border-base-content/20"
                  }`}
                >
                  {city.name}
                  {city.count > 0 ? ` (${city.count})` : ""}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
