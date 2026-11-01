// Cliente de Meta Model API (Muse Spark, Muse Image, SAM 3.1) para el Meta
// Global AI Developer Hackathon. API compatible con OpenAI — HTTP + Bearer
// token, sin SDK adicional (usamos `fetch` nativo de Next.js). Docs:
// https://dev.meta.ai/docs/overview · https://dev.meta.ai/docs/api-reference
import { fetchImageAsDataUrl } from "./imageUrl.js";
//
// MODO MOCK: los $150 de crédito del hackathon tardan hasta 2 días hábiles
// en reflejarse después de reclamarlos en el form, y `MODEL_API_KEY` puede
// no estar configurada todavía en este entorno. Mientras no exista esa env
// var, cada función de abajo devuelve una respuesta de muestra claramente
// marcada (`mock: true`) en vez de fallar — así el flujo completo (UI, API
// routes, dashboard) se puede construir y demostrar de punta a punta antes
// de que lleguen los créditos reales. En cuanto `MODEL_API_KEY` exista, estas
// mismas funciones empiezan a llamar a Meta de verdad sin tocar el resto del
// código.
const META_MODEL_BASE_URL =
  process.env.META_MODEL_BASE_URL || "https://api.meta.ai/v1";
const META_MODEL_API_KEY = process.env.MODEL_API_KEY;

export const isMetaModelConfigured = () => Boolean(META_MODEL_API_KEY);

// Statuses que ameritan reintento con backoff: rate limit y fallos
// transitorios del lado de Meta. Los demás 4xx (400, 401, 403, 404...) no se
// reintentan: repetirlos no cambia el resultado y solo suma latencia.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

// Intentos totales por llamada a Meta (1 inicial + 2 reintentos).
const MAX_ATTEMPTS = 3;

function retryDelayMs(attempt) {
  // Backoff exponencial con jitter: ~0.7s, ~1.4s (+ hasta ~35% aleatorio
  // para no sincronizar reintentos entre instancias). META_RETRY_BASE_MS
  // solo existe para que los tests no duerman de verdad.
  const base = Number(process.env.META_RETRY_BASE_MS) || 700;
  return base * 2 ** attempt + Math.random() * base * 0.35;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableMetaError(error) {
  if (error?.code === "meta_timeout" || error?.code === "meta_network") {
    return true;
  }
  return (
    typeof error?.status === "number" && RETRYABLE_STATUS.has(error.status)
  );
}

async function metaFetch(path, options = {}) {
  let delayOverrideMs = 0;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(Math.max(retryDelayMs(attempt - 1), delayOverrideMs));
      delayOverrideMs = 0;
    }
    try {
      return await metaFetchOnce(path, options);
    } catch (error) {
      const retryable = isRetryableMetaError(error);
      if (!retryable || attempt === MAX_ATTEMPTS - 1) {
        // `retriesExhausted` le dice a las rutas que el fallo sobrevivió a
        // los reintentos: mapean a un 503 amable ("saturado, intenta de
        // nuevo") en vez de un 500 opaco.
        if (retryable) error.retriesExhausted = true;
        throw error;
      }
      delayOverrideMs = error.retryAfterMs || 0;
    }
  }
}

async function metaFetchOnce(path, options = {}) {
  let res;
  try {
    res = await fetch(`${META_MODEL_BASE_URL}${path}`, {
      ...options,
      // Las generaciones de imagen reales tardan ~13s; 90s deja colchón de
      // sobra sin colgar la request eternamente si Meta se queda pegado.
      signal: options.signal || AbortSignal.timeout(90000),
      headers: {
        Authorization: `Bearer ${META_MODEL_API_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      const err = new Error(`Meta Model API ${path} → timeout`);
      err.code = "meta_timeout";
      throw err;
    }
    // fetch lanzó sin respuesta (DNS, conexión reseteada...): transitorio.
    const err = new Error(`Meta Model API ${path} → network: ${e?.message || e}`);
    err.code = "meta_network";
    err.cause = e;
    throw err;
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    const err = new Error(
      `Meta Model API ${path} → ${res.status}: ${bodyText.slice(0, 300)}`
    );
    // Propaga el `code` de Meta (ej. `model_not_found`,
    // `media_url_not_fetchable`) para que las rutas lo mapeen a mensajes
    // amables sin parsear strings.
    try {
      err.code = JSON.parse(bodyText)?.error?.code || undefined;
    } catch {
      // Cuerpo no-JSON: se mapea solo por status/timeout.
    }
    err.status = res.status;
    // En 429 Meta puede pedir espera explícita: se respeta (topada a 10s
    // para no colgar la serverless function con un valor absurdo).
    const retryAfter = Number(res.headers?.get?.("retry-after"));
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      err.retryAfterMs = Math.min(retryAfter * 1000, 10000);
    }
    throw err;
  }

  return res.json();
}

function safeParseJSON(text) {
  try {
    // Los modelos a veces envuelven el JSON en ```json ... ``` — lo limpiamos
    // antes de parsear.
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Muse Spark — redacta título + descripción del listado en español
// ---------------------------------------------------------------------------
// El cookbook oficial marca `muse-spark-1.3` como default, pero algunas
// keys/cuentas (ej. las del hackathon) solo tienen habilitado `1.1` y
// responden 404 `model_not_found`. Por eso se intenta en orden y se usa el
// primero que acepte la cuenta. `MUSE_SPARK_MODEL` permite fijar uno a mano
// (ver qué trae `GET /v1/models` con tu key) y siempre va primero. Si NINGUNO
// responde, se consulta `GET /v1/models` una vez y se reintenta con el primer
// id tipo spark no probado (cubre renames de Meta y propagación tardía de
// permisos en keys nuevas).
const LISTING_COPY_MODELS = [
  process.env.MUSE_SPARK_MODEL,
  "muse-spark-1.3",
  "muse-spark-1.1",
  "muse-spark",
].filter(Boolean);

// Último modelo que respondió OK en esta instancia serverless (warm). Se
// prueba primero para no pagar un 404 conocido en cada request; si también
// falla, la cadena sigue normal. Best-effort: en cold starts no existe.
let lastWorkingCopyModel = null;

function buildCopyBody(model, prompt) {
  return {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    // Muse Spark razona antes de responder y ese "pensamiento" también
    // consume max_tokens — "minimal" lo reduce (sigue gastando algunos
    // tokens) y max_tokens trae colchón de sobra para no cortar el JSON
    // de salida (confirmado con una llamada real: sin esto, el content
    // llega null por finish_reason "length").
    reasoning_effort: "minimal",
    max_tokens: 900,
  };
}

// Best-effort, nunca lanza: devuelve un id tipo spark no intentado o null.
async function discoverUntriedSparkModel(tried) {
  try {
    const data = await metaFetch("/models", { method: "GET" });
    const entries = Array.isArray(data?.data) ? data.data : [];
    for (const entry of entries) {
      const id = entry?.id;
      if (typeof id === "string" && /spark/i.test(id) && !tried.has(id)) {
        return id;
      }
    }
  } catch {
    // Sin lista de modelos no hay descubrimiento; el llamador reporta el
    // error original.
  }
  return null;
}

export async function generateListingCopy({
  rawNotes,
  city,
  state,
  country,
  price,
  currency = "USD",
  cryptoAccepted = [],
}) {
  if (!isMetaModelConfigured()) {
    return mockListingCopy({ city, country, price, currency, cryptoAccepted });
  }

  const cryptoLine = cryptoAccepted.length
    ? `Acepta pago en: ${cryptoAccepted.join(", ")}.`
    : "";

  const prompt = `Eres un copywriter inmobiliario para Casas Cripto, un marketplace
de propiedades que aceptan criptomonedas. Con estas notas del propietario,
escribe en ESPAÑOL un listado atractivo, honesto y breve.

Notas del propietario: """${rawNotes || "(sin notas adicionales)"}"""
Ubicación: ${city}${state ? `, ${state}` : ""}, ${country}
Precio: ${price} ${currency}
${cryptoLine}

Responde ÚNICAMENTE con JSON válido, sin texto extra ni markdown, con este
formato exacto:
{"title": "...", "description": "..."}
- title: máximo 70 caracteres, sin precio ni emojis.
- description: 3 a 5 frases en español neutro; menciona la ubicación y el
  pago en cripto si aplica. No inventes amenidades que no estén en las notas.`;

  // Intenta cada modelo candidato hasta que uno responda. Solo
  // `model_not_found` amerita probar el siguiente; cualquier otro error
  // (auth, rate limit agotado, timeout agotado, 500) se propaga de inmediato
  // — los transitorios ya traen sus propios reintentos desde metaFetch.
  const candidates = lastWorkingCopyModel
    ? [
        lastWorkingCopyModel,
        ...LISTING_COPY_MODELS.filter((m) => m !== lastWorkingCopyModel),
      ]
    : LISTING_COPY_MODELS;
  let data = null;
  let usedModel = null;
  let lastNotFound = null;
  for (const model of candidates) {
    try {
      data = await metaFetch("/chat/completions", {
        method: "POST",
        body: JSON.stringify(buildCopyBody(model, prompt)),
      });
      usedModel = model;
      break;
    } catch (e) {
      if (e?.code === "model_not_found") {
        lastNotFound = e;
        continue;
      }
      throw e;
    }
  }
  if (!data) {
    // Ningún candidato conocido aceptó la key: último recurso antes del 503 —
    // preguntar qué trae la cuenta y probar un id spark no intentado.
    const discovered = await discoverUntriedSparkModel(new Set(candidates));
    if (discovered) {
      try {
        data = await metaFetch("/chat/completions", {
          method: "POST",
          body: JSON.stringify(buildCopyBody(discovered, prompt)),
        });
        usedModel = discovered;
      } catch (e) {
        // Si el descubierto falla por otra razón (saturación, timeout), esa
        // señal fresca vale más que el model_not_found original.
        if (e?.code !== "model_not_found") throw e;
        lastNotFound = e;
      }
    }
  }
  if (!data) throw lastNotFound;
  lastWorkingCopyModel = usedModel;

  const raw = data?.choices?.[0]?.message?.content || "{}";
  const parsed = safeParseJSON(raw);

  return {
    title: (parsed.title || rawNotes || "Propiedad crypto-friendly").slice(0, 70),
    description: parsed.description || rawNotes || "",
    mock: false,
    model: usedModel,
  };
}

function mockListingCopy({ city, country, price, currency, cryptoAccepted }) {
  const cryptoLine = cryptoAccepted?.length
    ? ` Acepta pago en ${cryptoAccepted.join(", ")}.`
    : "";
  return {
    title: `Propiedad crypto-friendly en ${city || "tu ciudad"}`,
    description:
      `Excelente propiedad ubicada en ${city || "una gran ubicación"}` +
      `${country ? `, ${country}` : ""}, disponible por $${price || "—"} ${currency}.` +
      `${cryptoLine} (Vista previa — conecta MODEL_API_KEY para redactar con Meta Muse Spark.)`,
    mock: true,
  };
}

// ---------------------------------------------------------------------------
// Muse Image — genera una imagen del listado a partir de un prompt
// ---------------------------------------------------------------------------
const LISTING_IMAGE_MODEL = "muse-image-1.0";

// Imagen de muestra (Unsplash) usada solo en modo mock — nunca se le hace
// pasar por real: `mock: true` siempre viaja junto a la URL.
const MOCK_IMAGE_URL =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

export async function generateListingImage({ prompt }) {
  if (!isMetaModelConfigured()) {
    return { imageUrl: MOCK_IMAGE_URL, mock: true };
  }

  const data = await metaFetch("/images/generations", {
    method: "POST",
    body: JSON.stringify({
      model: LISTING_IMAGE_MODEL,
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  const image = data?.data?.[0];
  const imageUrl =
    image?.url ||
    (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null);

  if (!imageUrl) {
    throw new Error("Muse Image no devolvió ninguna imagen utilizable");
  }

  return { imageUrl, mock: false };
}

// ---------------------------------------------------------------------------
// SAM 3.1 — revisión de privacidad: avisa si una foto muestra personas,
// rostros o placas visibles ANTES de publicar el listado.
//
// ⚠️ La forma exacta del payload de `/v1/responses` para SAM (nombres de
// campos de cajas/máscaras) no está verificada contra una respuesta real
// todavía — `extractSamMatches` hace un best-effort buscando arreglos
// comunes. Ajustar en cuanto se pruebe con la API real (ver
// https://dev.meta.ai/docs/guides/media-segmentation).
// ---------------------------------------------------------------------------
const PRIVACY_MODEL = "sam-3.1";
const SENSITIVE_PROMPTS = ["person", "face", "license plate"];

export async function scanImagePrivacy({ imageUrl }) {
  if (!isMetaModelConfigured()) {
    return mockPrivacyScan();
  }

  // La imagen viaja embebida en base64: el fetcher de Meta rechaza URLs que
  // nuestro servidor sí descarga (400 `media_url_not_fetchable` aun con URLs
  // públicas). Una sola descarga para las 3 consultas de abajo.
  const imageRef = await fetchImageAsDataUrl(imageUrl);

  const findings = [];

  for (const label of SENSITIVE_PROMPTS) {
    const data = await metaFetch("/responses", {
      method: "POST",
      body: JSON.stringify({
        model: PRIVACY_MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: label },
              { type: "input_image", image_url: imageRef },
            ],
          },
        ],
      }),
    });

    const matches = extractSamMatches(data);
    if (matches.length) {
      findings.push({ label, count: matches.length });
    }
  }

  return {
    hasSensitiveContent: findings.length > 0,
    findings,
    mock: false,
  };
}

function extractSamMatches(responsesPayload) {
  const output = responsesPayload?.output || responsesPayload?.data || [];
  const flat = Array.isArray(output) ? output : [output];
  return flat.flatMap(
    (item) => item?.masks || item?.boxes || item?.detections || []
  );
}

function mockPrivacyScan() {
  return {
    hasSensitiveContent: false,
    findings: [],
    mock: true,
    note: "Vista previa — conecta MODEL_API_KEY para analizar con SAM 3.1.",
  };
}
