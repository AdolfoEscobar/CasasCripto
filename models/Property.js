import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";
import { slugify } from "@/libs/slugify";

// PROPERTY SCHEMA — modelo mínimo de listado inmobiliario, construido para
// que los planes Básico/Premium (config.stripe.plans) dejen de vender una
// función que no existía en el código (ver dashboard antes de este modelo).
// Publicar es gratis para cualquier cuenta (ver app/api/properties/route.js)
// — no requiere `hasAccess`. Las propiedades quedan en revisión ("pending")
// hasta que un admin las aprueba ("published") o las rechaza ("rejected").
// Solo las "published" se muestran públicamente en /propiedades y generan
// sus páginas SEO (/propiedades/[estado]/[ciudad]/[slug]).
const propertySchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Campo estructurado (no texto libre) usado para filtrar, agrupar y
    // generar las páginas SEO por ciudad (/propiedades/ciudad/[slug]). Es el
    // campo "fuente de verdad" para búsqueda — `location` de abajo es solo
    // un detalle adicional (zona, dirección) para mostrar en la tarjeta.
    city: {
      type: String,
      trim: true,
      required: true,
    },
    // Requerido (plataforma global, no solo México): combinado con `city`
    // forma `citySlug`, para que "Guadalajara, México" y "Guadalajara,
    // España" no choquen en el mismo filtro/página de ciudad.
    country: {
      type: String,
      trim: true,
      required: true,
    },
    // Estado/provincia — OPCIONAL (no todos los países lo necesitan). Junto
    // con `city` forma la jerarquía de URLs SEO /propiedades/[estado]/[ciudad].
    state: {
      type: String,
      trim: true,
    },
    // Tipo de inmueble y operación: opcionales para no romper listados viejos,
    // pero son lo que permite rankear long-tails ("casas en venta en Delicias,
    // Chihuahua" en vez de un genérico "propiedades"). El formulario los pide
    // siempre; el copy SEO usa fallbacks cuando faltan (ver libs/geoSeo.mjs).
    propertyType: {
      type: String,
      trim: true,
      enum: ["casa", "departamento", "terreno", "local", "oficina", "rancho", "edificio"],
    },
    listingType: {
      type: String,
      trim: true,
      enum: ["venta", "renta"],
      default: "venta",
    },
    // Slug normalizado SOLO de `city` (ej. "Delicias" -> "delicias"). La
    // ciudad se desambigua con el estado en la URL (/chihuahua/delicias), así
    // que ya no necesita llevar el país pegado como antes ("delicias-mexico").
    // Generado en el hook pre("save"). Indexado junto a stateSlug.
    citySlug: {
      type: String,
      trim: true,
      index: true,
    },
    // Slug del nivel "estado" de la URL. Es slugify(state) cuando hay estado;
    // cuando no (países sin subdivisiones), slugify(country) — el país actúa
    // como nivel estado. Ver pre("save").
    stateSlug: {
      type: String,
      trim: true,
      index: true,
    },
    // Slug del país (ej. "México" -> "mexico"). Alimenta las páginas de país
    // (/propiedades/pais/mexico) y deja lista una futura migración a URLs con
    // país si la escala global la exige. Generado en pre("save").
    countrySlug: {
      type: String,
      trim: true,
      index: true,
    },
    // Valor ANTERIOR de citySlug (formato "ciudad-pais", ej. "delicias-mexico").
    // Solo existe en documentos migrados: sirve para resolver redirects 301 de
    // las URLs viejas /propiedades/ciudad/[slug] a la nueva estructura. Los
    // documentos nuevos no lo tienen (nunca tuvieron URL vieja).
    legacyCitySlug: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    // Slug único del listado para la URL de detalle:
    // slugify(title).slice(0,60) + "-" + últimos 6 del _id
    // (ej. "casa-en-venta-centro-a1b2c3"). INMUTABLE una vez creado: si
    // cambiara al editar el título, la URL vieja moriría. El sufijo del id lo
    // hace único aunque dos títulos sean idénticos.
    propertySlug: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
    // Detalle de ubicación opcional (zona, dirección, referencia) — no se
    // usa para filtrar, solo se muestra como texto adicional.
    location: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: "USD",
    },
    // Criptomonedas que el propietario acepta como forma de pago para esta
    // propiedad (informativo hoy — el cierre de la operación sigue siendo
    // manual/off-platform hasta que el escrow on-chain esté construido).
    cryptoAccepted: {
      type: [String],
      default: [],
    },
    // Fotos del listado. Acepta dos formas (ver libs/propertyImages.js):
    // - string: URL externa legada, pegada a mano antes del uploader propio.
    // - objeto { src, srcSet, width, height }: foto subida a Vercel Blob con
    //   variantes responsive pre-generadas (ver app/api/uploads/route.js).
    // Mixed a propósito: los documentos viejos con strings siguen leyéndose
    // igual, sin migración.
    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "published", "rejected"],
      default: "pending",
    },
    // Motivo opcional que un admin deja al rechazar un listado.
    rejectionReason: {
      type: String,
      trim: true,
    },
    // Estado comercial del trato — independiente del `status` de moderación.
    // Preparado para el modelo de monetización real (comisión por cierre):
    // hoy solo es informativo/auto-reportado por el dueño; más adelante,
    // marcar "closed" es lo que dispararía el cobro de `commissionRate`.
    dealStatus: {
      type: String,
      enum: ["active", "under_offer", "closed"],
      default: "active",
    },
    // % de comisión que Casas Cripto cobraría al cerrar la venta (roadmap:
    // Fase 2/3 — hoy no hay cobro automático conectado a este campo).
    commissionRate: {
      type: Number,
      default: 1.5,
      min: 0,
      max: 100,
    },
    // Listado destacado: pago único vía Stripe (ver
    // app/api/stripe/create-featured-listing/route.js) que sube la
    // propiedad al tope de /propiedades por `featuredUntil`.
    featured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Mantiene los slugs de URL sincronizados en cada create/edit, sin que cada
// API route tenga que acordarse de regenerarlos a mano:
// - citySlug = slugify(city). La ciudad se desambigua con el ESTADO en la
//   URL (/jalisco/guadalajara vs /castilla-la-mancha/guadalajara), no con el
//   país pegado como en el formato anterior.
// - stateSlug = slugify(state || country): en países sin subdivisiones, el
//   país actúa como nivel "estado" para que la URL siempre tenga 3 niveles.
// - propertySlug se genera UNA sola vez (inmutable): si se regenerara al
//   editar el título, la URL indexada en Google moriría.
// - legacyCitySlug preserva el citySlug anterior ("ciudad-pais") la primera
//   vez que cambia, para que los redirects 301 de URLs viejas sigan
//   resolviendo. Los documentos nuevos no lo tienen.
propertySchema.pre("save", function (next) {
  if (this.isModified("city")) {
    if (!this.isNew && this.citySlug && !this.legacyCitySlug) {
      this.legacyCitySlug = this.citySlug;
    }
    this.citySlug = slugify(this.city);
  }
  if (
    this.isModified("city") ||
    this.isModified("state") ||
    this.isModified("country") ||
    !this.stateSlug
  ) {
    this.stateSlug = slugify(this.state || this.country);
  }
  if (this.isModified("country") || !this.countrySlug) {
    this.countrySlug = slugify(this.country);
  }
  if (!this.propertySlug) {
    const base = slugify(this.title).slice(0, 60) || "propiedad";
    this.propertySlug = `${base}-${this._id.toString().slice(-6)}`;
  }
  next();
});

propertySchema.plugin(toJSON);

export default mongoose.models.Property ||
  mongoose.model("Property", propertySchema);
