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
