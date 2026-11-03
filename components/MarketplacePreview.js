import Link from "next/link";
import MarketplacePreviewClient from "./MarketplacePreviewClient";
import { isCurrentlyFeatured } from "./PropertyCard";
import { getMarketplaceData } from "@/libs/propertyGeo";
import { propertyUrl } from "@/libs/propertyUrls.mjs";
import { imageSrc } from "@/libs/propertyImages";
import { PROPERTY_TYPES, LISTING_TYPES, capFirst } from "@/libs/geoSeo.mjs";
import config from "@/config";

// Sección "el directorio" del landing, con LISTADOS REALES publicados
// (ya no mockups): banner destacado + grid + ticker de cryptos aceptadas,
// todo derivado de las propiedades con status "published". Server Component:
// consulta Mongo una vez y le pasa datos planos ya serializables al cliente
// interactivo (carrusel + filtros). El home usa ISR (ver app/page.js), así
// que los listados nuevos aparecen solos sin rebuild manual.
const SUPPORTED_CRYPTOS = ["USDC", "USDT", "BTC", "ETH"];
const MAX_ITEMS = 6;

const MarketplacePreview = async () => {
  let properties = [];
  try {
    ({ properties } = await getMarketplaceData());
  } catch (e) {
    // Si Mongo no responde (ej. build sin red), la sección cae al estado
    // vacío con CTA en vez de romper el home completo.
    console.error("❌ MarketplacePreview: no se pudo leer el directorio:", e);
  }

  const items = properties.slice(0, MAX_ITEMS).map((p) => ({
    id: p.id,
    title: p.title,
    locationLabel: [p.city, p.state || p.country].filter(Boolean).join(", "),
    priceLabel: `$${Number(p.price || 0).toLocaleString("es-MX")} ${p.currency || "USD"}`,
    cryptos: p.cryptoAccepted || [],
    image: imageSrc(p.images?.[0]) || null,
    url: propertyUrl(p),
    typeKey: p.propertyType || null,
    operationLabel: capFirst(
      [PROPERTY_TYPES[p.propertyType]?.singular, LISTING_TYPES[p.listingType]]
        .filter(Boolean)
        .join(" "),
    ),
    featured: isCurrentlyFeatured(p),
  }));

  // Pills de filtro: "Todo" + cada tipo de inmueble con presencia real.
  const seen = new Set();
  const categories = [{ key: null, label: "Todo" }];
  for (const item of items) {
    if (
      item.typeKey &&
      PROPERTY_TYPES[item.typeKey] &&
      !seen.has(item.typeKey)
    ) {
      seen.add(item.typeKey);
      categories.push({
        key: item.typeKey,
        label: capFirst(PROPERTY_TYPES[item.typeKey].plural),
      });
    }
  }

  // Ticker: conteo real de fichas que aceptan cada crypto (todas las
  // publicadas, no solo las 6 mostradas).
  const ticker = SUPPORTED_CRYPTOS.map((symbol) => ({
    symbol,
    count: properties.filter((p) => (p.cryptoAccepted || []).includes(symbol))
      .length,
  }));

  if (items.length === 0) {
    return (
      <section
        id="marketplace-preview"
        className="scroll-mt-20 border-t border-base-content/10"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28 text-center">
          <p className="text-sm font-semibold text-primary mb-3">
            El directorio
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            En vivo en el directorio
          </h2>
          <p className="opacity-70 leading-relaxed max-w-xl mx-auto mb-6">
            Aún no hay listados visibles aquí. Sé el primero en publicar tu
            propiedad crypto-friendly.
          </p>
          <Link href={config.auth.callbackUrl} className="btn btn-primary">
            Publicar gratis
          </Link>
        </div>
      </section>
    );
  }

  return (
    <MarketplacePreviewClient
      items={items}
      categories={categories}
      ticker={ticker}
    />
  );
};

export default MarketplacePreview;
