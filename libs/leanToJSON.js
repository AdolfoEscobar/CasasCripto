// `.lean()` en Mongoose devuelve objetos planos con `_id` (ObjectId), SIN
// pasar por el plugin toJSON (models/plugins/toJSON.js) que normalmente
// convierte `_id` -> `id`. Ese plugin solo se dispara en documentos reales
// (ej. `.save()`), no en `.lean()`. Como todas las queries de propiedades
// usan `.lean()` por performance, cualquier código que lea `property.id`
// (keys de listas, links a /propiedades/[id], botones de editar/borrar)
// recibía `undefined` sin que nadie lo notara hasta que React se quejó del
// "key" prop. Estos helpers normalizan `.lean()` igual que el plugin.
export function leanToJSON(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { ...rest, id: _id?.toString?.() ?? _id };
}

export function leanArrayToJSON(docs) {
  return (docs || []).map(leanToJSON);
}
