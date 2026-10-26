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
// sus páginas SEO (/propiedades/[id], /propiedades/ciudad/[slug]).
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
    // Estado/provincia — OPCIONAL (no todos los países lo necesitan). Hoy es
    // solo informativo/display; no forma parte de citySlug. Sirve como base
    // para una futura capa de SEO por estado (/propiedades/estado/[slug])
    // sin necesidad de migrar datos cuando se construya.
    state: {
      type: String,
      trim: true,
    },
    // Slug normalizado de `city` (ej. "Ciudad de México" -> "ciudad-de-mexico"),
    // generado automáticamente en el hook pre("save") de abajo. Indexado
    // para que los filtros/páginas por ciudad sean rápidos.
    citySlug: {
      type: String,
      trim: true,
      index: true,
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
    // URLs de imágenes (por ahora, enlaces externos — no hay upload propio).
    images: {
      type: [String],
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

// Mantiene `citySlug` sincronizado con city+country en cada create/edit, sin
// que cada API route tenga que acordarse de regenerarlo a mano. Incluye el
// país a propósito: en una plataforma global, "Guadalajara" (México) y
// "Guadalajara" (España) son ciudades distintas y no deben compartir página.
propertySchema.pre("save", function (next) {
  if (this.isModified("city") || this.isModified("country")) {
    this.citySlug = slugify(`${this.city}-${this.country}`);
  }
  next();
});

propertySchema.plugin(toJSON);

export default mongoose.models.Property ||
  mongoose.model("Property", propertySchema);
