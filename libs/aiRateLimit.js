import connectMongo from "@/libs/mongoose";
import AiUsage from "@/models/AiUsage";

// Límite de uso diario para las rutas de Meta Model API — protege el saldo
// del hackathon ($150 compartidos entre todas las llamadas del proyecto).
// Persistido en MongoDB (no en memoria) porque Vercel corre funciones
// serverless: un contador en memoria se perdería entre invocaciones/cold
// starts y no protegería nada en producción.
//
// `key` identifica al "quién" (ver models/AiUsage.js): `user:<id>` para las
// rutas autenticadas del dashboard, `ip:<ip>` para la demo pública.
// `limit` es el máximo de llamadas permitidas para esa `action` en el día
// UTC actual.
//
// Devuelve { allowed: boolean, remaining: number }.
export async function checkAiRateLimit({ key, action, limit }) {
  await connectMongo();

  const day = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" en UTC

  // findOneAndUpdate con upsert es atómico — dos requests simultáneas del
  // mismo `key` no pueden "robarse" el mismo cupo (a diferencia de un
  // find + save en dos pasos).
  const usage = await AiUsage.findOneAndUpdate(
    { key, action, day },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  const allowed = usage.count <= limit;
  return { allowed, remaining: Math.max(0, limit - usage.count) };
}

// Devuelve 1 unidad de cuota cuando el intento falló ANTES de que la IA
// hiciera trabajo real (ej. la imagen no era descargable y ni siquiera se
// llamó a Meta, o Meta rechazó la URL). Sin esto, 3 URLs malas agotarían la
// demo pública del día sin haber gastado un solo crédito.
export async function refundAiRateLimit({ key, action }) {
  await connectMongo();
  const day = new Date().toISOString().slice(0, 10);
  await AiUsage.findOneAndUpdate(
    { key, action, day, count: { $gt: 0 } },
    { $inc: { count: -1 } }
  );
}

// Límites por acción. Las rutas autenticadas del dashboard (dueños reales
// armando SU propio listado) son más generosas; la demo pública sin login
// (/demo-ai, pensada para jueces y redes sociales) es más estricta porque
// cualquiera en internet puede encontrarla.
export const AI_LIMITS = {
  authenticated: {
    "listing-copy": 20,
    "listing-image": 10,
    "privacy-scan": 20,
  },
  public: {
    "listing-copy": 3,
    "listing-image": 2,
    "privacy-scan": 3,
  },
};

// Mejor esfuerzo para identificar al visitante anónimo por IP en Vercel
// (detrás de su proxy, la IP real viaja en `x-forwarded-for`). No es a
// prueba de bots sofisticados — es suficiente para el alcance de un
// hackathon de 9 días, no un sistema anti-abuso de producción.
export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
