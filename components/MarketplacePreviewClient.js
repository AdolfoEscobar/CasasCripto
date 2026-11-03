"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import config from "@/config";
import VerifiedBadge from "./VerifiedBadge";
import PropertyImage from "./PropertyImage";

// UI interactiva de la sección "el directorio": carrusel destacado + filtros
// + grid + ticker. Recibe listados REALES ya mapeados desde el Server
// Component (ver ./MarketplacePreview.js) — aquí no hay mockups ni precios
// inventados: todo lo que se muestra sale de propiedades publicadas.
const tickerStyles = {
  BTC: { bg: "bg-primary/15", text: "text-primary" },
  ETH: { bg: "bg-accent/15", text: "text-accent" },
  USDC: { bg: "bg-secondary/15", text: "text-secondary" },
  USDT: { bg: "bg-success/15", text: "text-success" },
};

const cryptoNames = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDC: "USD Coin",
  USDT: "Tether",
};

const CryptoDot = ({ symbol, bg, text, className = "w-9 h-9 text-xs" }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${bg} ${text} ${className}`}
  >
    {symbol.slice(0, 1)}
  </span>
);

// Placeholder neutro cuando el listado no tiene fotos (nunca una foto falsa:
// eso implicaría que la propiedad se ve así).
const PhotoPlaceholder = ({ className = "" }) => (
  <div
    className={`w-full h-full bg-base-300 flex items-center justify-center text-base-content/30 ${className}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-12 h-12"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
      />
    </svg>
  </div>
);

// Banner destacado grande (estilo "colección destacada" de OpenSea): foto a
// toda altura, overlay con gradiente, info superpuesta + mini-stats + flechas
// para recorrer los listados. Con swipe táctil: en móvil el gesto natural es
// deslizar el dedo, no buscar las flechas laterales. `touch-pan-y` deja que
// el navegador maneje el scroll vertical de la página mientras nosotros
// capturamos el desplazamiento horizontal.
const FeaturedBanner = ({
  property,
  index,
  total,
  onPrev,
  onNext,
  onSelect,
}) => {
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) {
      onNext();
    } else {
      onPrev();
    }
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden glass-card group touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[16/10] sm:aspect-[16/8] lg:aspect-[16/6.5]">
        {property.image ? (
          <PropertyImage
            image={property.image}
            alt={`${property.title} en ${property.locationLabel}`}
            className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 saturate-110 transition-transform duration-700 group-hover:scale-105"
            eager
          />
        ) : (
          <div className="absolute inset-0">
            <PhotoPlaceholder />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base-100/70 via-transparent to-transparent" />

        {/* badges superiores */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="badge badge-elite badge-sm sm:badge-md font-semibold">
            En vivo
          </span>
          <span className="badge badge-sm sm:badge-md font-semibold border border-secondary/40 bg-secondary/10 text-secondary">
            {property.featured
              ? "Destacada"
              : property.operationLabel || "Crypto-friendly"}
          </span>
        </div>

        {/* flechas (solo si hay más de un listado) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Propiedad anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm sm:btn-md glass-card border-base-content/20"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Siguiente propiedad"
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm sm:btn-md glass-card border-base-content/20"
            >
              ›
            </button>
          </>
        )}

        {/* contenido inferior */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight">
                  {property.title}
                </h3>
                <VerifiedBadge className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base opacity-80">
                <span>{property.locationLabel}</span>
                <span className="opacity-50">·</span>
                <span>Propietario verificado</span>
              </div>
              <Link
                href={property.url}
                className="btn btn-primary btn-sm sm:btn-md mt-3"
              >
                Ver ficha
              </Link>
            </div>

            {/* mini stats con datos reales del listado */}
            <div className="flex gap-3 sm:gap-5">
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60">
                  Precio
                </p>
                <p className="font-extrabold text-gradient-gold text-sm sm:text-lg">
                  {property.priceLabel}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60">
                  Operación
                </p>
                <p className="font-semibold text-sm sm:text-lg">
                  {property.operationLabel || "—"}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60">
                  Acepta
                </p>
                <div className="flex gap-1 mt-0.5">
                  {property.cryptos.length > 0 ? (
                    property.cryptos.map((c) => (
                      <span
                        key={c}
                        className="badge badge-ghost border border-base-content/20 text-[10px] sm:text-xs"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm opacity-60">Por acordar</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* dots indicador tocables */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Ver propiedad ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-base-content/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tarjeta pequeña de la grid, estilo marketplace Web3. Enlaza a la ficha real.
const TrendingCard = ({ property }) => (
  <Link
    href={property.url}
    className="glass-card rounded-2xl p-3 sm:p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
  >
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0">
      {property.image ? (
        <PropertyImage
          image={property.image}
          alt={property.title}
          className="w-full h-full object-cover brightness-110 saturate-110"
        />
      ) : (
        <PhotoPlaceholder />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="font-bold truncate">{property.title}</p>
        <VerifiedBadge className="w-3.5 h-3.5" />
      </div>
      <p className="text-xs opacity-60 mt-0.5 truncate">
        {property.locationLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        <span className="font-bold text-sm text-gradient-gold">
          {property.priceLabel}
        </span>
        <span
          className={`badge badge-xs sm:badge-sm font-medium ${
            property.featured
              ? "border border-warning/40 bg-warning/10 text-warning"
              : "border border-success/40 bg-success/10 text-success"
          }`}
        >
          {property.featured ? "Destacado" : "Crypto-friendly"}
        </span>
      </div>
    </div>
  </Link>
);

const MarketplacePreviewClient = ({ items, categories, ticker }) => {
  const [index, setIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

  if (!items?.length) return null;

  const featured = items[index % items.length];
  const goPrev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setIndex((i) => (i + 1) % items.length);

  const filtered =
    activeCategory == null
      ? items
      : items.filter((p) => p.typeKey === activeCategory);

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing.
    <section
      id="marketplace-preview"
      className="scroll-mt-20 border-t border-base-content/10"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <p className="text-sm font-semibold text-primary mb-3">
            El directorio
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            En vivo en el directorio
          </h2>
          <p className="opacity-70 leading-relaxed">
            Fichas reales publicadas por propietarios verificados, con precio,
            ubicación y criptos aceptadas.
          </p>
          <Link
            href="/propiedades"
            className="link link-primary text-sm font-medium inline-block mt-3"
          >
            Ver todas en el directorio →
          </Link>
        </div>

        {/* pills de categoría — filtran la grid de abajo */}
        {categories.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 mb-8 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`btn btn-sm rounded-full ${
                  activeCategory === cat.key
                    ? "btn-primary"
                    : "btn-ghost border border-base-content/15"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* banner destacado estilo colección Web3 */}
        <FeaturedBanner
          property={featured}
          index={index}
          total={items.length}
          onPrev={goPrev}
          onNext={goNext}
          onSelect={setIndex}
        />

        {/* grid de listados */}
        <div className="mt-8 mb-10">
          <p className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-3">
            Listados en el marketplace
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((property) => (
              <TrendingCard key={property.id} property={property} />
            ))}
          </div>
        </div>

        {/* ticker de cryptos aceptadas en fichas reales */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 mb-10">
          <p className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-3">
            Cryptos aceptadas en el directorio
          </p>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 -mx-1 px-1">
            {ticker.map((c) => {
              const style = tickerStyles[c.symbol] || {
                bg: "bg-base-300",
                text: "",
              };
              return (
                <div
                  key={c.symbol}
                  className="flex items-center gap-2.5 rounded-xl border border-base-content/10 px-3.5 py-2.5 shrink-0"
                >
                  <CryptoDot
                    symbol={c.symbol}
                    bg={style.bg}
                    text={style.text}
                  />
                  <div>
                    <p className="font-semibold text-sm leading-tight">
                      {c.symbol}{" "}
                      <span className="opacity-50 font-normal">
                        {cryptoNames[c.symbol] || ""}
                      </span>
                    </p>
                    <p className="text-xs opacity-80">
                      {c.count > 0
                        ? `Aceptada en ${c.count} ficha${c.count === 1 ? "" : "s"}`
                        : "Sin fichas aún"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs opacity-50 mt-3">
            Cada ficha indica qué cryptos acepta su propietario.
          </p>
        </div>

        <div className="rounded-2xl border border-base-content/10 bg-base-200/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between max-w-4xl mx-auto">
          <div className="text-center sm:text-left">
            <p className="font-bold text-lg mb-1">
              ¿Tienes una propiedad crypto-friendly?
            </p>
            <p className="text-sm opacity-70">
              Publícala gratis en minutos y empieza a recibir compradores
              globales. Sin tarjeta, con revisión manual.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href={config.auth.callbackUrl}
              className="btn btn-primary w-full sm:w-auto"
            >
              Publicar gratis
            </Link>
            <Link
              href="/propiedades"
              className="btn btn-outline border-base-content/20 w-full sm:w-auto"
            >
              Ver directorio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplacePreviewClient;
