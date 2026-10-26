// Convierte "Ciudad de México" -> "ciudad-de-mexico", "Tulum, México" ->
// "tulum-mexico". Usado para generar URLs limpias e indexables por ciudad
// (ver models/Property.js `citySlug` y app/propiedades/ciudad/[slug]).
export function slugify(text) {
  return (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos (é -> e, ñ -> n vía NFD no cubre ñ del todo, pero cubre tildes)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// "ciudad-de-mexico" -> "Ciudad De Mexico" — fallback de display cuando no
// tenemos el nombre "bonito" original de la ciudad (ej. páginas
// programáticas de ciudades sin ninguna propiedad cargada todavía).
export function unslugify(slug) {
  return (slug || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
