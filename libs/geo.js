// Helpers de geografía — SOLO para uso server-side (API routes). Los
// paquetes de datos (country-state-city, i18n-iso-countries) son pesados;
// si se importan desde un componente "use client" se empaquetarían enteros
// en el bundle del navegador. Por eso el cliente nunca los importa
// directamente: consulta /api/geo/countries y /api/geo/cities en su lugar.
import { Country, State, City } from "country-state-city";
import iso from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";

iso.registerLocale(es);

// Casas Cripto es un sitio en español enfocado en LatAm + hispanos de EE.UU.
// — estos países se muestran primero en el <select> de País (en este
// orden), antes que el resto del mundo. No son los únicos permitidos: el
// marketplace es global, solo priorizamos la experiencia para el público
// principal. Ajustar este orden según tracción real por país con el tiempo.
const PRIORITY_COUNTRY_CODES = [
  "MX", // México
  "US", // Estados Unidos (gran diáspora hispana + inversión en real estate)
  "CO", // Colombia
  "ES", // España
  "AR", // Argentina
  "PA", // Panamá
  "DO", // República Dominicana
  "CR", // Costa Rica
  "CL", // Chile
  "PE", // Perú
  "EC", // Ecuador
  "PR", // Puerto Rico
  "UY", // Uruguay
  "GT", // Guatemala
  "VE", // Venezuela
];

// Lista completa de países (~250) con nombre en español. Los de
// PRIORITY_COUNTRY_CODES van primero (en ese orden), el resto alfabético
// después — cada país trae `priority: true/false` para que el cliente los
// agrupe visualmente (<optgroup>) sin tener que duplicar esta lógica.
export function getAllCountries() {
  const codes = Country.getAllCountries().map((c) => c.isoCode);

  const all = codes
    .map((code) => ({
      code,
      name: iso.getName(code, "es") || Country.getCountryByCode(code)?.name,
    }))
    .filter((c) => c.name);

  const byCode = Object.fromEntries(all.map((c) => [c.code, c]));

  const priority = PRIORITY_COUNTRY_CODES.filter((code) => byCode[code]).map(
    (code) => ({ ...byCode[code], priority: true })
  );
  const rest = all
    .filter((c) => !PRIORITY_COUNTRY_CODES.includes(c.code))
    .map((c) => ({ ...c, priority: false }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return [...priority, ...rest];
}

// Estados/provincias de un país (por código ISO), ordenados alfabéticamente.
// Paso OPCIONAL entre País y Ciudad: ayuda sobre todo en países grandes
// (México, EE. UU., Brasil...) a acotar la búsqueda de ciudad de miles a
// cientos de resultados. Países sin subdivisiones útiles devuelven [] y el
// formulario simplemente no muestra el selector.
export function getStatesForCountry(countryCode) {
  if (!countryCode) return [];
  return State.getStatesOfCountry(countryCode)
    .map((s) => ({ code: s.isoCode, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

const normalize = (str) =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Límite de seguridad para la lista de ciudades devuelta. La región más
// grande del mundo en esta base de datos (Inglaterra, como "estado" de
// Reino Unido) tiene ~2,919 ciudades — el resto del planeta está muy por
// debajo (ningún país SIN estados supera 300, y el estado más grande de
// nuestros mercados prioritarios —Texas— tiene ~1,277). 3000 cubre
// cualquier caso real sin arriesgar una respuesta gigante.
const MAX_CITIES = 3000;

// Ciudades conocidas de un país (por código ISO, ej. "MX"), opcionalmente
// acotadas a un estado/provincia (`stateCode`) y/o filtradas por texto de
// búsqueda (`query`). Se usan para llenar el <select> de Ciudad al publicar
// una propiedad: es una lista CERRADA a propósito — no se permite texto
// libre — para que "CDMX", "cdmx" y "Ciudad de Mexico" nunca terminen
// siendo 3 valores distintos en la base de datos (eso rompería los
// filtros por ciudad y la generación de URLs /propiedades/ciudad/[slug]).
// Países grandes (México, EE. UU., Brasil...) tienen miles de ciudades a
// nivel país, por eso el formulario EXIGE elegir primero un estado/
// provincia (cuando el país tiene) antes de poder elegir ciudad — así la
// lista que se manda al navegador siempre es manejable (ver MAX_CITIES).
export function getCitiesForCountry(countryCode, query = "", limit = MAX_CITIES, stateCode = "") {
  if (!countryCode) return [];

  const all = stateCode
    ? City.getCitiesOfState(countryCode, stateCode) || []
    : City.getCitiesOfCountry(countryCode) || [];
  const needle = normalize(query);

  const names = [...new Set(all.map((c) => c.name))];

  if (!needle) {
    return names.sort((a, b) => a.localeCompare(b, "es")).slice(0, limit);
  }

  // Prioriza ciudades que EMPIEZAN con lo buscado (ej. "guada" -> primero
  // "Guadalajara", no "Ahuacatlán de Guadalupe" solo porque alfabéticamente
  // viene antes). Sin esto, una ciudad grande y conocida podía quedar fuera
  // del límite de resultados por culpa de cientos de pueblos que solo
  // contienen la palabra en medio del nombre.
  const startsWith = [];
  const contains = [];
  for (const name of names) {
    const normalized = normalize(name);
    if (normalized.startsWith(needle)) startsWith.push(name);
    else if (normalized.includes(needle)) contains.push(name);
  }

  const sortEs = (a, b) => a.localeCompare(b, "es");
  return [...startsWith.sort(sortEs), ...contains.sort(sortEs)].slice(0, limit);
}
