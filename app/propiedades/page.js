import Link from "next/link";
import Footer from "@/components/Footer";
import ButtonAuthCta from "@/components/ButtonAuthCta";
import PropertyCard from "@/components/PropertyCard";
import PropertySearchHero from "@/components/PropertySearchHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import FaqAccordion from "@/components/FaqAccordion";
import {
  SortPills,
  StatsStrip,
  RelatedSearches,
} from "@/components/GeoWidgets";
import { getMarketplaceData, parseGeoFilters } from "@/libs/propertyGeo";
import {
  getSEOTags,
  renderBreadcrumbSchema,
  renderFaqSchema,
  renderItemListSchema,
} from "@/libs/seo";
import { stateUrl, cityUrl, propertyUrl } from "@/libs/propertyUrls.mjs";
import { summarizeListings, keywordSubject, capFirst } from "@/libs/geoSeo.mjs";
import config from "@/config";

// ISR 1h: el HTML se cachea en el edge (TTFB bajo → PageSpeed) y se purga
// al publicar/aprobar/editar/borrar (ver app/api/properties). Cada URL con
// query (?tipo=, ?q=...) cachea su propia variante: los filtros funcionan.
export const revalidate = 3600;

// Canonical SIEMPRE /propiedades: ?q=, ?tipo=, ?operacion= y ?orden= son
// vistas de la misma página. Las búsquedas (?q=) además llevan noindex:
// indexar una URL por cada término que alguien escriba es contenido
// duplicado/thin clásico de portales.
export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  if (!q) {
    // Sujeto según filtros (?tipo=casa&operacion=renta → "Casas en renta
    // que aceptan cripto"). Sin operación ("Todas") no se asume venta: el
    // listado mezcla venta y renta.
    const filters = parseGeoFilters(sp);
    const subject = capFirst(
      keywordSubject({
        propertyType: filters.propertyType,
        listingType: filters.listingType,
      }),
    );
    const op =
      filters.listingType === "renta"
        ? "en renta "
        : filters.listingType === "venta"
          ? "en venta "
          : "";
    return getSEOTags({
      title: `${subject} que aceptan cripto | Casas Cripto`,
      description: `Explora casas, departamentos y terrenos ${op}publicados por propietarios verificados que aceptan USDC, USDT, BTC y ETH. Busca por estado y ciudad.`,
      canonicalUrlRelative: "/propiedades",
    });
  }
  const tags = getSEOTags({
    title: `Resultados para "${q}" | Casas Cripto`,
    description:
      `Propiedades que aceptan cripto relacionadas con "${q}". Explora el directorio de Casas Cripto por estado y ciudad.`.slice(
        0,
        160,
      ),
    canonicalUrlRelative: "/propiedades",
  });
  tags.robots = "noindex, follow";
  return tags;
}

const HUB_FAQS = [
  {
    q: "¿Cómo compro una propiedad con criptomonedas en Casas Cripto?",
    a: "Explora los listados por estado o ciudad, elige una propiedad que acepte tu cripto (cada listado indica cuáles: USDC, USDT, BTC, ETH) y contacta directo al propietario. El cierre de la operación se acuerda entre comprador y propietario.",
  },
  {
    q: "¿Publicar mi propiedad cuesta algo?",
    a: "No. Publicar es gratis: crea tu cuenta, sube tu propiedad indicando qué criptomonedas aceptas y aparece en el marketplace tras una revisión manual. Cada propiedad publicada genera su propia página indexable por estado y ciudad.",
  },
  {
    q: "¿Las propiedades están verificadas?",
    a: "Todo listado pasa por revisión manual antes de publicarse. Además, cada propietario tiene un perfil verificado y cada tarjeta muestra exactamente qué criptomonedas acepta.",
  },
  {
    q: "¿Qué criptomonedas puedo usar para comprar?",
    a: "Depende de cada propietario: cada ficha indica si acepta USDC, USDT, BTC, ETH u otras. Usa los listados por estado y ciudad para encontrar la propiedad que acepte tu cripto.",
  },
  {
    q: "¿Casas Cripto cobra comisión por comprar?",
    a: "No. Explorar el directorio y contactar propietarios es gratis. El cierre se acuerda directo entre comprador y propietario; Casas Cripto no procesa hoy el pago de la compra.",
  },
];

// Hub del marketplace: lista las publicadas (destacadas primero) con
// búsqueda de texto (?q=), filtros y orden, y es el centro del interlinking:
// enlaza a CADA estado y ciudad con inventario, para que Google descubra e
// indexe toda la jerarquía /estado/ciudad/detalle.
export default async function PropiedadesPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const filters = parseGeoFilters(sp);
  const { properties, totalCount, states, cities } = await getMarketplaceData({
    q,
    filters,
    sort: filters.sort,
  });
  const stats = summarizeListings(properties);
  const filtersActive = Boolean(
    filters.propertyType || filters.listingType || q,
  );
  // Con filtros/búsqueda el conteo es el de la vista (no el total del
  // directorio): el número siempre cuadra con la cuadrícula.
  const shownCount = filtersActive ? properties.length : totalCount;
  // H1 según filtros (?operacion=renta → "Propiedades en renta que aceptan
  // cripto"). Sin operación ("Todas") queda neutro: "Propiedades que
  // aceptan cripto" (igual que el metadata).
  const hubSubject = capFirst(
    keywordSubject({
      propertyType: filters.propertyType,
      listingType: filters.listingType,
    }),
  );
  const baseUrl = `https://${config.domainName}`;

  const breadcrumbItems = q
    ? [
        { name: "Inicio", url: `${baseUrl}/` },
        { name: "Propiedades", url: `${baseUrl}/propiedades` },
        { name: `Buscar: ${q}`, url: `${baseUrl}/propiedades` },
      ]
    : [
        { name: "Inicio", url: `${baseUrl}/` },
        { name: "Propiedades", url: `${baseUrl}/propiedades` },
      ];

  return (
    <>
      {renderBreadcrumbSchema(breadcrumbItems)}
      {renderFaqSchema(HUB_FAQS)}
      {renderItemListSchema(
        properties.map((p) => ({
          name: p.title,
          url: `${baseUrl}${propertyUrl(p)}`,
        })),
      )}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 md:pt-16 pb-16 md:pb-24">
          {/* Héroe de búsqueda estilo portal: el del header sirve para
              navegar, este para refinar el inventario con filtros. */}
          <div className="mb-8">
            <PropertySearchHero idPrefix="hub-search" />
          </div>
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: q ? `Buscar: ${q}` : "Propiedades" },
            ]}
          />
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="font-medium text-primary mb-3">Marketplace</p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              {q ? (
                <>Resultados para “{q}”</>
              ) : (
                <>{hubSubject} que aceptan cripto</>
              )}
            </h1>
            <p className="opacity-70 leading-relaxed">
              {q ? (
                <>
                  Búsqueda en títulos, ciudades, estados y zonas.{" "}
                  <Link href="/propiedades" className="link link-primary">
                    Ver todo el directorio
                  </Link>
                </>
              ) : (
                <>
                  Listados reales publicados por propietarios y agentes
                  verificados, con revisión manual antes de publicarse. Explora
                  por estado o ciudad y paga con USDC, USDT, BTC o ETH.
                </>
              )}
            </p>
          </div>

          {/* Inmediatez: el héroe es el único filtro (tipo/operación ya
              están ahí, pre-rellenados desde la URL), así que arriba del
              grid solo queda el conteo discreto + orden. Ubicación se movió
              bajo el grid (conserva el interlinking SEO sin empujar las
              propiedades hacia abajo). */}
          <SortPills
            base="/propiedades"
            filters={filters}
            sort={filters.sort}
            q={q}
            count={shownCount}
          />

          <StatsStrip
            minPrice={stats.minPrice}
            currency={stats.currency}
            topCryptos={stats.topCryptos}
          />

          {properties.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <p className="font-bold text-xl">
                {q ? (
                  <>Sin resultados para “{q}”</>
                ) : filtersActive ? (
                  <>Sin resultados para este filtro</>
                ) : (
                  <>Todavía no hay propiedades publicadas</>
                )}
              </p>
              <p className="opacity-70">
                {q || filtersActive ? (
                  <>
                    Prueba con otra búsqueda u otros filtros, o{" "}
                    <Link href="/propiedades" className="link link-primary">
                      ver todo el directorio
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Aún no hay listados visibles aquí. Mira un{" "}
                    <Link
                      href="/#marketplace-preview"
                      className="link link-primary"
                    >
                      adelanto del producto
                    </Link>{" "}
                    o sé el primero en publicar la tuya.
                  </>
                )}
              </p>
              {!q && !filtersActive && (
                <ButtonAuthCta
                  href={config.auth.callbackUrl}
                  className="btn btn-primary"
                >
                  Publicar mi propiedad gratis
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

          {(states.length > 0 || cities.length > 0) && (
            <section className="mt-16 md:mt-20 text-center">
              <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
                Explorar por ubicación
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
              {cities.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {cities.slice(0, 24).map((city) => (
                    <Link
                      key={`${city.stateSlug}-${city.slug}`}
                      href={cityUrl(city.stateSlug, city.slug)}
                      className="badge badge-lg badge-ghost border border-base-content/20 min-h-[40px]"
                    >
                      {city.name} ({city.count})
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {totalCount > 0 && <RelatedSearches base="/propiedades" />}

          <FaqAccordion
            faqs={HUB_FAQS}
            heading="Preguntas sobre el marketplace"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
