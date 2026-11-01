import Link from "next/link";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import FaqAccordion from "@/components/FaqAccordion";
import { getMarketplaceData } from "@/libs/propertyGeo";
import {
  getSEOTags,
  renderBreadcrumbSchema,
  renderFaqSchema,
  renderItemListSchema,
} from "@/libs/seo";
import { stateUrl, cityUrl, propertyUrl } from "@/libs/propertyUrls.mjs";
import config from "@/config";

export const dynamic = "force-dynamic";

export const metadata = getSEOTags({
  title: "Propiedades en venta que aceptan cripto | Casas Cripto",
  description:
    "Explora casas, departamentos y terrenos en venta publicados por propietarios verificados que aceptan USDC, USDT, BTC y ETH. Busca por estado y ciudad.",
  canonicalUrlRelative: "/propiedades",
});

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
];

// Hub del marketplace: lista TODAS las publicadas (destacadas primero) y es
// el centro del interlinking — enlaza a CADA estado y ciudad con inventario,
// para que Google descubra e indexe toda la jerarquía /estado/ciudad/detalle.
export default async function PropiedadesPage() {
  const { properties, states, cities } = await getMarketplaceData();
  const baseUrl = `https://${config.domainName}`;

  return (
    <>
      {renderBreadcrumbSchema([
        { name: "Propiedades", url: `${baseUrl}/propiedades` },
      ])}
      {renderFaqSchema(HUB_FAQS)}
      {renderItemListSchema(
        properties.map((p) => ({
          name: p.title,
          url: `${baseUrl}${propertyUrl(p)}`,
        }))
      )}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="font-medium text-primary mb-3">Marketplace</p>
            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Propiedades en venta que aceptan cripto
            </h1>
            <p className="opacity-70 leading-relaxed">
              Listados reales publicados por propietarios y agentes
              verificados, con revisión manual antes de publicarse. Explora
              por estado o ciudad y paga con USDC, USDT, BTC o ETH.
            </p>
          </div>

          {states.length > 0 && (
            <section className="mb-8">
              <h2 className="text-center font-bold text-lg mb-4">
                Explorar por estado
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
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
            </section>
          )}

          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
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
