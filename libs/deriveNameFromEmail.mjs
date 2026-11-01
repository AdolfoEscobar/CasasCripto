// Deriva un nombre mostrable a partir del correo ("juan.perez+tag@x.com"
// -> "Juan Perez"). Existe porque el proveedor Email (magic link) solo
// conoce el correo: sin esto, `name` quedaría null en la BD para esos
// usuarios (Google sí manda nombre en el perfil). Convención espejo de
// unslugify() en libs/slugify.js.
// Nota: archivo .mjs a propósito — el repo no declara "type": "module",
// así que solo .mjs se puede importar desde node --test sin flags.
export function deriveNameFromEmail(email) {
  const prefix = String(email || "").split("@")[0] || "";
  const words = prefix
    .split("+")[0] // ignora sub-addressing (juan+tag@ -> juan)
    .split(/[._-]+/)
    .filter(Boolean);
  const pretty = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return pretty || "Usuario";
}
