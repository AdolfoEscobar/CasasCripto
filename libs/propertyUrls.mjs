// Fuente ÚNICA de verdad para las URLs públicas de propiedades.
// Toda página, tarjeta, sitemap o redirect que enlace a una propiedad, ciudad
// o estado DEBE usar estos builders — nunca concatenar strings a mano. Así
// la estructura SEO solo se puede romper en un lugar.
//
// Estructura canónica (estilo Inmuebles24/Lamudi):
//   /propiedades                      → hub del marketplace
//   /propiedades/[estado]             → ej. /propiedades/chihuahua
//   /propiedades/[estado]/[ciudad]    → ej. /propiedades/chihuahua/delicias
//   /propiedades/[estado]/[ciudad]/[slug]
//     → ej. /propiedades/chihuahua/delicias/casa-en-venta-centro-a1b2c3
//
// Archivo .mjs a propósito: los tests corren con `node --test` sin bundler y
// el package no es ESM, así que solo .mjs puede usar `import/export` ahí.
// Este módulo NO importa otros libs (ni slugify): recibe slugs ya hechos y
// es 100% puro — por eso se puede testear aislado (ver .test.mjs).
export function stateUrl(stateSlug) {
  return `/propiedades/${stateSlug}`;
}

export function cityUrl(stateSlug, citySlug) {
  return `/propiedades/${stateSlug}/${citySlug}`;
}

// Landing de país: /propiedades/pais/mexico. Con /pais/ explícito para no
// colisionar con estados del mismo slug (ej. estado "panama" vs país
// "panama") — ver knownCountry en geoDirectory.mjs.
export function paisUrl(countrySlug) {
  return `/propiedades/pais/${countrySlug}`;
}

// URL canónica de una propiedad. Si el documento ya tiene los 3 slugs
// (cualquier propiedad creada o migrada después del rework SEO), devuelve la
// URL con keywords; si no (documento viejo sin migrar), cae de vuelta a la
// URL legacy por id — que a su vez redirige (301) a la canónica en cuanto el
// documento se migra. Nunca devuelve una URL rota a medias.
export function propertyUrl(property) {
  const { stateSlug, citySlug, propertySlug, id, _id } = property || {};
  if (stateSlug && citySlug && propertySlug) {
    return `/propiedades/${stateSlug}/${citySlug}/${propertySlug}`;
  }
  return `/propiedades/${id || _id}`;
}

// Detecta si el segmento /propiedades/[param] es un ObjectId legacy (24
// hex) en vez de un slug de estado — ver app/propiedades/[param]/page.js.
// Un slug real (letras + guiones, ej. "chihuahua") jamás matchea esto.
export function isObjectIdParam(param) {
  return /^[0-9a-f]{24}$/i.test(param || "");
}

// URL de una página geo con filtros/orden/búsqueda (?tipo=casa&operacion=
// venta&orden=precio-asc&q=...). Solo incluye parámetros con valor y omite
// el orden default ("recientes") para URLs limpias. El canonical de estas
// vistas siempre es la URL base sin query (ver cada generateMetadata).
export function geoPageUrl(base, { q, tipo, operacion, orden } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tipo) params.set("tipo", tipo);
  if (operacion) params.set("operacion", operacion);
  if (orden && orden !== "recientes") params.set("orden", orden);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Destino del héroe de búsqueda: con ciudad elegida va directo a su página;
// con estado (sin ciudad) a la página del estado; con país a su landing
// (que también acepta ?q= y filtros); con texto suelto al hub; solo filtros
// se quedan en `base` (la página actual). `countrySlug` ya viene resuelto
// por el llamador (este módulo no importa otros libs): si el país no es del
// registro, el llamador lo manda como `q`.
export function searchTarget({
  base,
  city,
  state,
  countrySlug,
  q,
  tipo,
  operacion,
} = {}) {
  if (city?.stateSlug && city?.citySlug) {
    return geoPageUrl(cityUrl(city.stateSlug, city.citySlug), {
      tipo,
      operacion,
    });
  }
  if (state) {
    return geoPageUrl(stateUrl(state), { tipo, operacion });
  }
  if (countrySlug) {
    return geoPageUrl(paisUrl(countrySlug), { q, tipo, operacion });
  }
  if (q) {
    return geoPageUrl("/propiedades", { q, tipo, operacion });
  }
  return geoPageUrl(base || "/propiedades", { tipo, operacion });
}
