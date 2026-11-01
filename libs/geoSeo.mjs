// Copy SEO programático para las páginas geo (estado/ciudad) y detalle.
// Genera títulos, descripciones, intros y FAQs con las keywords que la gente
// realmente busca ("casas en venta en Delicias, Chihuahua") a partir de los
// datos reales del listado. .mjs puro (sin imports) para poder testearse con
// `node --test` — ver libs/propertyUrls.mjs.

// Tipos de propiedad. `plural` es la keyword principal ("casas en venta en
// X"); `article` sirve para frases ("una casa", "un terreno").
export const PROPERTY_TYPES = {
  casa: { plural: "casas", singular: "casa", article: "una" },
  departamento: { plural: "departamentos", singular: "departamento", article: "un" },
  terreno: { plural: "terrenos", singular: "terreno", article: "un" },
  local: { plural: "locales comerciales", singular: "local comercial", article: "un" },
  oficina: { plural: "oficinas", singular: "oficina", article: "una" },
  rancho: { plural: "ranchos", singular: "rancho", article: "un" },
  edificio: { plural: "edificios", singular: "edificio", article: "un" },
};

export const LISTING_TYPES = {
  venta: "en venta",
  renta: "en renta",
};

export const isPropertyType = (v) => Boolean(v && PROPERTY_TYPES[v]);
export const isListingType = (v) => Boolean(v && LISTING_TYPES[v]);

// Agrega datos reales de un listado para alimentar descriptions, intros y
// FAQs (ver geoDescription/geoIntro/geoFaqs). Puro: recibe docs planos.
export function summarizeListings(listings = []) {
  const count = listings.length;
  const prices = listings
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const currencies = {};
  const cryptos = {};
  const cities = {};
  for (const p of listings) {
    if (p.currency) currencies[p.currency] = (currencies[p.currency] || 0) + 1;
    for (const c of p.cryptoAccepted || []) {
      if (c) cryptos[c] = (cryptos[c] || 0) + 1;
    }
    if (p.city) cities[p.city] = (cities[p.city] || 0) + 1;
  }
  const top = (freq, n) =>
    Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);
  const topCurrencies = top(currencies, 1);
  return {
    count,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    currency: topCurrencies[0] || "USD",
    topCryptos: top(cryptos, 4),
    topCities: top(cities, 4),
  };
}

// Solo primera letra (NO CSS `capitalize`: en español "casas en venta" debe
// quedar "Casas en venta", no "Casas En Venta").
export const capFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const cap = capFirst;

// Sujeto de la keyword: "casas en venta" | "departamentos en renta" |
// "propiedades en venta" (fallback cuando no hay tipo). Sin tipo ni
// operación: "propiedades".
export function keywordSubject({ propertyType, listingType } = {}) {
  const plural = isPropertyType(propertyType)
    ? PROPERTY_TYPES[propertyType].plural
    : "propiedades";
  const op = isListingType(listingType) ? ` ${LISTING_TYPES[listingType]}` : "";
  return `${plural}${op}`;
}

// "Delicias, Chihuahua" | "Chihuahua" (estado) — el país solo se agrega en
// el title cuando hay mezcla de países (ver geoTitle).
export function placeName({ city, state, country }) {
  if (city && state) return `${city}, ${state}`;
  return city || state || country || "";
}

// Title tag (<=60 chars ideal). Estable: NO incluye conteos (cambian con
// cada listado y fuerzan re-crawl). Formato:
// "Casas en venta en Delicias, Chihuahua | Casas Cripto"
export function geoTitle({ propertyType, listingType, city, state, country, mixedCountries }) {
  const subject = keywordSubject({ propertyType, listingType });
  const place = mixedCountries && country ? state || country : placeName({ city, state, country });
  return `${cap(subject)} en ${place} | Casas Cripto`;
}

// Meta description (<=160 chars): keyword + criptos + CTA. Incluye el conteo
// y rango de precios cuando hay datos reales (mejora CTR en SERPs).
export function geoDescription({ propertyType, listingType, city, state, country, count, minPrice, maxPrice, currency, cryptos }) {
  const subject = keywordSubject({ propertyType, listingType });
  const place = placeName({ city, state, country });
  const bits = [];
  if (count > 0) bits.push(`${count} ${subject} en ${place}`);
  else bits.push(`${cap(subject)} en ${place}`);
  if (minPrice && maxPrice && minPrice !== maxPrice) {
    bits.push(`desde $${Number(minPrice).toLocaleString("en-US")} hasta $${Number(maxPrice).toLocaleString("en-US")} ${currency || "USD"}`);
  } else if (minPrice) {
    bits.push(`desde $${Number(minPrice).toLocaleString("en-US")} ${currency || "USD"}`);
  }
  const cryptoList = (cryptos || []).filter(Boolean);
  bits.push(
    cryptoList.length > 0
      ? `que aceptan ${cryptoList.slice(0, 4).join(", ")}`
      : "que aceptan criptomonedas"
  );
  return `${bits.join(" ")}. Publica o encuentra tu próxima propiedad en Casas Cripto.`.slice(0, 160);
}

// Párrafo introductorio único por página (contenido > thin content): combina
// la keyword con datos reales agregados (conteo, rango de precios, criptos
// más aceptadas). Las páginas SIN propiedades reciben otro copy con CTA.
export function geoIntro({ propertyType, listingType, city, state, country, count, minPrice, maxPrice, currency, topCryptos, topCities }) {
  const subject = keywordSubject({ propertyType, listingType });
  const place = placeName({ city, state, country });
  if (!count || count === 0) {
    return (
      `¿Buscas ${subject} en ${place} pagando con cripto? Casas Cripto es el directorio de ` +
      `propiedades cuyos propietarios aceptan criptomonedas como forma de pago. Aún no hay ` +
      `listados publicados aquí — sé el primero en publicar la tuya gratis y aparece en esta página.`
    );
  }
  const bits = [
    `Explora ${count} ${subject} en ${place}, publicadas por propietarios verificados que aceptan criptomonedas como forma de pago.`,
  ];
  if (minPrice) {
    bits.push(
      maxPrice && maxPrice !== minPrice
        ? `Los precios van desde $${Number(minPrice).toLocaleString("en-US")} hasta $${Number(maxPrice).toLocaleString("en-US")} ${currency || "USD"}.`
        : `Los precios parten desde $${Number(minPrice).toLocaleString("en-US")} ${currency || "USD"}.`
    );
  }
  if ((topCryptos || []).length > 0) {
    bits.push(`Las criptomonedas más aceptadas aquí son ${topCryptos.slice(0, 3).join(", ")}.`);
  }
  if ((topCities || []).length > 0) {
    bits.push(`Zonas con más oferta: ${topCities.slice(0, 4).join(", ")}.`);
  }
  return bits.join(" ");
}

// FAQs long-tail con respuestas basadas en datos reales. Se renderizan
// visibles en la página + como FAQPage JSON-LD (candidatas a rich results).
export function geoFaqs({ propertyType, listingType, city, state, country, count, minPrice, currency, topCryptos }) {
  const subject = keywordSubject({ propertyType, listingType });
  const place = placeName({ city, state, country });
  const typeLabel = isPropertyType(propertyType) ? PROPERTY_TYPES[propertyType].singular : "propiedad";
  const op = isListingType(listingType) ? LISTING_TYPES[listingType].replace("en ", "") : "compra";
  const faqs = [
    {
      q: `¿Hay ${subject} en ${place} que acepten criptomonedas?`,
      a:
        count > 0
          ? `Sí. Hoy hay ${count} ${subject} en ${place} publicadas en Casas Cripto, todas de propietarios que aceptan cripto como forma de pago.`
          : `Todavía no hay listados publicados en ${place}, pero puedes publicar el tuyo gratis o explorar propiedades en otras ciudades.`,
    },
    {
      q: `¿Qué criptomonedas aceptan para ${op === "renta" ? "rentar" : "comprar"} ${typeLabel} en ${place}?`,
      a:
        (topCryptos || []).length > 0
          ? `Depende de cada propietario. En ${place} las más aceptadas son ${topCryptos.slice(0, 4).join(", ")}. Cada listado indica exactamente cuáles acepta.`
          : `Depende de cada propietario: cada listado indica si acepta USDC, USDT, BTC, ETH u otras. El cierre se acuerda directo entre comprador y propietario.`,
    },
  ];
  if (minPrice) {
    faqs.push({
      q: `¿Cuánto cuesta ${op === "renta" ? "rentar" : "comprar"} ${typeLabel} en ${place}?`,
      a: `En Casas Cripto los precios ${op === "renta" ? "de renta" : "de venta"} en ${place} parten desde $${Number(minPrice).toLocaleString("en-US")} ${currency || "USD"}. Revisa cada listado para ver precio y criptos aceptadas.`,
    });
  }
  faqs.push({
    q: `¿Cómo publico mi ${typeLabel} en ${place} para venderla en cripto?`,
    a: `Crea tu cuenta gratis en Casas Cripto, publica tu ${typeLabel} indicando qué criptomonedas aceptas y aparece en esta página tras una revisión manual. Publicar es gratis.`,
  });
  return faqs;
}

// Title tag de la página de detalle. Prioriza lo que rankea: título del
// listado + ubicación completa. Ej: "Casa de 3 recámaras en Delicias, Chihuahua | Acepta cripto".
export function listingTitle({ title, city, state }) {
  const place = [city, state].filter(Boolean).join(", ");
  return `${title}${place ? ` en ${place}` : ""} | Acepta cripto | Casas Cripto`;
}

// Meta description del detalle: precio + criptos + ubicación + CTA.
export function listingDescription({ description, price, currency, cryptoAccepted, city, state }) {
  const place = [city, state].filter(Boolean).join(", ");
  const priceBit = price ? `Precio: $${Number(price).toLocaleString("en-US")} ${currency || "USD"}. ` : "";
  const cryptoBit =
    (cryptoAccepted || []).length > 0
      ? ` Acepta ${(cryptoAccepted || []).join(", ")}.`
      : " Acepta criptomonedas.";
  const base = (description || "").replace(/\s+/g, " ").trim();
  const tail = `${priceBit}${place ? `Ubicada en ${place}.` : ""}${cryptoBit} Contáctala en Casas Cripto.`;
  if (!base) return tail.slice(0, 160);
  return `${base.slice(0, Math.max(0, 157 - tail.length))}... ${tail}`.slice(0, 160);
}
