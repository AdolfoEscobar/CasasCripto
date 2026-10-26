"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ButtonLead from "./ButtonLead";
import VerifiedBadge from "./VerifiedBadge";

// Casas Cripto todavía no tiene un modelo Property/Listing ni inventario real
// (ver .cursorrules). Esta sección NO pretende mostrar propiedades reales —
// es una vista previa / mockup de cómo lucirá el marketplace (Fase 2 del
// roadmap, ver <TokenRoadmap/>). El diseño está inspirado deliberadamente en
// marketplaces Web3 ya establecidos y de confianza (OpenSea y similares:
// banner destacado + grid de tendencias + ticker + badges verificados) para
// que el producto se sienta tan real y confiable como esas plataformas,
// pero cada dato sigue etiquetado como "Vista previa" / "Mockup" / "Ilustrativo"
// para no implicar tracción, inventario o feeds en vivo que no existen.
const mockProperties = [
  {
    title: "Villa frente al mar",
    location: "Tulum, México",
    type: "Villas",
    price: "US$ 480,000",
    beds: 5,
    area: "420 m²",
    agency: "Riviera Crypto Homes",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    crypto: ["USDC", "BTC"],
  },
  {
    title: "Penthouse con vista a la ciudad",
    location: "Miami, EE. UU.",
    type: "Penthouses",
    price: "US$ 1,250,000",
    beds: 4,
    area: "310 m²",
    agency: "Brickell Digital Realty",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
    crypto: ["USDC", "ETH"],
  },
  {
    title: "Loft moderno cripto-friendly",
    location: "Medellín, Colombia",
    type: "Lofts",
    price: "US$ 210,000",
    beds: 2,
    area: "95 m²",
    agency: "Nodo Inmobiliaria",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    crypto: ["USDT", "BTC"],
  },
];

const categories = ["Todo", "Villas", "Penthouses", "Lofts"];

// Ticker de cryptos aceptadas, estilo "tokens en tendencia" de marketplaces
// Web3. Los precios/variación son estáticos e ilustrativos (se marca
// explícitamente abajo del ticker) — no es un feed en vivo.
const cryptoTicker = [
  { symbol: "BTC", name: "Bitcoin", price: "$ 68,420", change: "+2.4%", up: true, bg: "bg-primary/15", text: "text-primary" },
  { symbol: "ETH", name: "Ethereum", price: "$ 3,180", change: "+1.1%", up: true, bg: "bg-accent/15", text: "text-accent" },
  { symbol: "USDC", name: "USD Coin", price: "$ 1.00", change: "0.0%", up: true, bg: "bg-secondary/15", text: "text-secondary" },
  { symbol: "USDT", name: "Tether", price: "$ 1.00", change: "-0.01%", up: false, bg: "bg-success/15", text: "text-success" },
];

const CryptoDot = ({ symbol, bg, text, className = "w-9 h-9 text-xs" }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${bg} ${text} ${className}`}
  >
    {symbol.slice(0, 1)}
  </span>
);

const AgencyAvatar = ({ name, className = "w-6 h-6 text-[10px]" }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 font-bold text-base-content shrink-0 ${className}`}
  >
    {name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")}
  </span>
);

// Banner destacado grande (estilo "colección destacada" de OpenSea): foto a
// toda altura, overlay con gradiente, info superpuesta + mini-stats + flechas
// para recorrer las 3 propiedades mockup.
const FeaturedBanner = ({ property, index, total, onPrev, onNext }) => (
  <div className="relative rounded-3xl overflow-hidden glass-card group">
    <div className="relative aspect-[16/10] sm:aspect-[16/8] lg:aspect-[16/6.5]">
      <Image
        src={property.image}
        alt={`Vista previa: ${property.title} en ${property.location}`}
        fill
        className="object-cover brightness-110 contrast-105 saturate-110 transition-transform duration-700 group-hover:scale-105"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-base-100/70 via-transparent to-transparent" />

      {/* badges superiores */}
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="badge badge-elite badge-sm sm:badge-md font-semibold">
          Vista previa
        </span>
        <span className="badge badge-sm sm:badge-md font-semibold border border-secondary/40 bg-secondary/10 text-secondary">
          Destacada
        </span>
      </div>

      {/* flechas */}
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
              <AgencyAvatar name={property.agency} />
              <span>
                Por <span className="font-medium">{property.agency}</span>
              </span>
              <span className="opacity-50">·</span>
              <span>{property.location}</span>
            </div>
          </div>

          {/* mini stats, estilo "PRECIO SUELO / ARTÍCULOS / VOLUMEN" */}
          <div className="flex gap-3 sm:gap-5">
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60">
                Precio
              </p>
              <p className="font-extrabold text-gradient-gold text-sm sm:text-lg">
                {property.price}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60">
                Hab. / Área
              </p>
              <p className="font-semibold text-sm sm:text-lg">
                {property.beds} · {property.area}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60">
                Acepta
              </p>
              <div className="flex gap-1 mt-0.5">
                {property.crypto.map((c) => (
                  <span
                    key={c}
                    className="badge badge-ghost border border-base-content/20 text-[10px] sm:text-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* dots indicador */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === index ? "w-5 bg-primary" : "w-1.5 bg-base-content/30"
          }`}
        />
      ))}
    </div>
  </div>
);

// Tarjeta pequeña de la grid de "tendencias", estilo tokens/colecciones en
// tendencia de un marketplace Web3.
const TrendingCard = ({ property, highlight }) => (
  <div className="glass-card rounded-2xl p-3 sm:p-4 flex items-center gap-3 hover:border-primary/40 transition-colors">
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0">
      <Image
        src={property.image}
        alt={`Vista previa: ${property.title}`}
        fill
        className="object-cover brightness-110 saturate-110"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="font-bold truncate">{property.title}</p>
        <VerifiedBadge className="w-3.5 h-3.5" />
      </div>
      <div className="flex items-center gap-1.5 text-xs opacity-60 mt-0.5">
        <AgencyAvatar name={property.agency} className="w-4 h-4 text-[8px]" />
        <span className="truncate">{property.agency}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="font-bold text-sm text-gradient-gold">
          {property.price}
        </span>
        <span
          className={`badge badge-xs sm:badge-sm font-medium ${
            highlight === "nuevo"
              ? "border border-secondary/40 bg-secondary/10 text-secondary"
              : "border border-success/40 bg-success/10 text-success"
          }`}
        >
          {highlight === "nuevo" ? "Nuevo" : "Crypto-friendly"}
        </span>
      </div>
    </div>
  </div>
);

const MarketplacePreview = () => {
  const [index, setIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Todo");

  const featured = mockProperties[index];
  const goPrev = () =>
    setIndex((i) => (i - 1 + mockProperties.length) % mockProperties.length);
  const goNext = () => setIndex((i) => (i + 1) % mockProperties.length);

  const filtered =
    activeCategory === "Todo"
      ? mockProperties
      : mockProperties.filter((p) => p.type === activeCategory);

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <section id="marketplace-preview">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <p className="font-medium text-primary mb-3">Próximamente</p>
          <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            Así se verá tu propiedad en el marketplace
          </h2>
          <p className="opacity-70 leading-relaxed">
            El marketplace de búsqueda y publicación está en construcción
            (Fase 2 de nuestro{" "}
            <a href="#token" className="link link-primary">
              roadmap
            </a>
            ). Todo lo que ves aquí —banner, tendencias, precios y el ticker
            de cryptos— es un mockup ilustrativo del producto, no propiedades
            reales, inventario ni cotizaciones en vivo.
          </p>
          <Link
            href="/propiedades"
            className="link link-primary text-sm font-medium inline-block mt-3"
          >
            Ver propiedades publicadas →
          </Link>
        </div>

        {/* pills de categoría — filtran la grid de tendencias de abajo */}
        <div className="flex items-center justify-center gap-2 mt-10 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm rounded-full ${
                activeCategory === cat
                  ? "btn-primary"
                  : "btn-ghost border border-base-content/15"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* banner destacado estilo colección Web3 */}
        <FeaturedBanner
          property={featured}
          index={index}
          total={mockProperties.length}
          onPrev={goPrev}
          onNext={goNext}
        />

        {/* grid de tendencias */}
        <div className="mt-8 mb-10">
          <p className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-3">
            Tendencias en el marketplace
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((property, i) => (
              <TrendingCard
                key={property.title}
                property={property}
                highlight={i === 0 ? "nuevo" : "crypto"}
              />
            ))}
          </div>
        </div>

        {/* ticker de cryptos aceptadas, estilo "tokens en tendencia" */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 mb-14">
          <p className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-3">
            Cryptos que aceptará el marketplace
          </p>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 -mx-1 px-1">
            {cryptoTicker.map((c) => (
              <div
                key={c.symbol}
                className="flex items-center gap-2.5 rounded-xl border border-base-content/10 px-3.5 py-2.5 shrink-0"
              >
                <CryptoDot symbol={c.symbol} bg={c.bg} text={c.text} />
                <div>
                  <p className="font-semibold text-sm leading-tight">
                    {c.symbol}{" "}
                    <span className="opacity-50 font-normal">{c.name}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm opacity-80">{c.price}</span>
                    <span
                      className={`text-xs font-medium ${
                        c.up ? "text-success" : "text-error"
                      }`}
                    >
                      {c.up ? "▲" : "▼"} {c.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs opacity-50 mt-3">
            Ilustrativo — no es un feed de precios en vivo.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between max-w-4xl mx-auto">
          <div className="text-center sm:text-left">
            <p className="font-bold text-lg mb-1">
              ¿Quieres ser de los primeros en publicar?
            </p>
            <p className="text-sm opacity-70">
              Únete a la lista de espera y te avisamos en cuanto el
              marketplace esté listo para recibir propiedades.
            </p>
          </div>
          <ButtonLead
            source="marketplace_waitlist"
            extraStyle="sm:max-w-xs shrink-0"
            buttonLabel="Avísenme"
            successMessage="¡Listo! Te avisaremos en cuanto el marketplace esté disponible."
          />
        </div>
      </div>
    </section>
  );
};

export default MarketplacePreview;
