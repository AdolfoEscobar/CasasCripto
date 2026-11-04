import Link from "next/link";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  SORT_LABELS,
  capFirst,
} from "@/libs/geoSeo.mjs";
import { geoPageUrl } from "@/libs/propertyUrls.mjs";
import CryptoIcon from "./CryptoIcon";

// Widgets compartidos de las páginas de listado (hub, estado, ciudad):
// mismo UX estilo portal (filtros, orden, stats, búsquedas relacionadas) en
// las tres. Server Components: todo son links normales, cero JS.

// Fila sobre el grid: conteo discreto de resultados + pills de orden.
// El conteo vive aquí (no en el H1) y NUNCA se muestra en cero: con 0
// resultados la página muestra el estado vacío en vez de esta fila.
export function SortPills({ base, filters, sort, q, count }) {
  if (!count || count === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      <span className="text-sm opacity-60 mr-1">
        {count} {count === 1 ? "resultado" : "resultados"}
      </span>
      {count > 1 && (
        <>
          <span className="text-sm opacity-30" aria-hidden="true">
            ·
          </span>
          <span className="text-sm opacity-60 mr-1">Ordenar:</span>
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={geoPageUrl(base, {
                q,
                tipo: filters.propertyType,
                operacion: filters.listingType,
                orden: key,
              })}
              aria-current={sort === key ? "true" : undefined}
              className={`badge badge-md min-h-[32px] ${
                sort === key
                  ? "badge-primary"
                  : "badge-ghost border border-base-content/20"
              }`}
            >
              {label}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

// Franja de datos reales bajo el H1, estilo portales grandes ("desde $X ·
// aceptan [iconos] USDC, BTC"). El conteo vive en <SortPills/>, aquí no se
// repite.
export function StatsStrip({ minPrice, currency, topCryptos }) {
  const cryptos = (topCryptos || []).slice(0, 4);
  const priceBit = minPrice
    ? `desde $${Number(minPrice).toLocaleString("en-US")} ${currency || "USD"}`
    : null;
  if (!priceBit && cryptos.length === 0) return null;
  return (
    <p className="text-center text-sm font-medium opacity-80 mb-8">
      {priceBit}
      {priceBit && cryptos.length > 0 ? "  ·  " : ""}
      {cryptos.length > 0 && (
        <>
          Aceptan:{" "}
          {cryptos.map((c, i) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 whitespace-nowrap"
            >
              {i > 0 ? ", " : ""}
              <CryptoIcon symbol={c} size={14} />
              {c}
            </span>
          ))}
        </>
      )}
    </p>
  );
}

// Interlinking long-tail ("Casas en venta en X", "Propiedades en renta..."):
// cada link es una vista filtrada de la misma página (canonical base), igual
// que los portales grandes. Sin `place` (hub global), sin localizador.
export function RelatedSearches({ base, place }) {
  const combos = [
    { tipo: "casa", operacion: "venta" },
    { tipo: "departamento", operacion: "venta" },
    { tipo: "terreno", operacion: "venta" },
    { tipo: null, operacion: "renta" },
  ];
  const labelFor = ({ tipo, operacion }) => {
    const subject = capFirst(
      `${tipo ? PROPERTY_TYPES[tipo].plural : "propiedades"}${operacion ? ` ${LISTING_TYPES[operacion]}` : ""}`,
    );
    return place ? `${subject} en ${place}` : subject;
  };
  return (
    <section className="mt-16 md:mt-20 text-center">
      <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
        Búsquedas relacionadas
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {combos.map((combo) => (
          <Link
            key={`${combo.tipo || "todas"}-${combo.operacion || "todas"}`}
            href={geoPageUrl(base, {
              tipo: combo.tipo,
              operacion: combo.operacion,
            })}
            className="badge badge-lg badge-ghost border border-base-content/20 min-h-[40px]"
          >
            {labelFor(combo)}
          </Link>
        ))}
      </div>
    </section>
  );
}
