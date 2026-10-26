import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// AI USAGE SCHEMA — control de gasto para las integraciones de Meta Model
// API (Muse Spark, Muse Image, SAM 3.1). El hackathon da $150 de crédito
// compartidos entre TODAS las llamadas del proyecto; sin un límite, un solo
// usuario dándole clic sin parar (o un bot encontrando la ruta pública de
// /demo-ai) podría vaciarlo en minutos. Un documento por `key` + `day` +
// `action`, incrementado atómicamente — ver libs/aiRateLimit.js.
const aiUsageSchema = mongoose.Schema(
  {
    // Identificador del "quién": `user:<id>` para rutas autenticadas del
    // dashboard, o `ip:<ip>` para la demo pública sin login.
    key: {
      type: String,
      required: true,
      trim: true,
    },
    // Qué endpoint de IA se usó — permite límites distintos por acción
    // (ej. generar imagen cuesta más que redactar copy).
    action: {
      type: String,
      required: true,
      enum: ["listing-copy", "listing-image", "privacy-scan"],
    },
    // Día en formato YYYY-MM-DD (UTC) — el contador resetea solo al cambiar
    // de día, sin necesidad de un cron job que borre documentos viejos.
    day: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

aiUsageSchema.index({ key: 1, action: 1, day: 1 }, { unique: true });

aiUsageSchema.plugin(toJSON);

export default mongoose.models.AiUsage ||
  mongoose.model("AiUsage", aiUsageSchema);
