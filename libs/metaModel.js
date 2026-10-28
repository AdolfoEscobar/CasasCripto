// Cliente de Meta Model API (Muse Spark, Muse Image, SAM 3.1) para el Meta
// Global AI Developer Hackathon. API compatible con OpenAI — HTTP + Bearer
// token, sin SDK adicional (usamos `fetch` nativo de Next.js). Docs:
// https://dev.meta.ai/docs/overview · https://dev.meta.ai/docs/api-reference
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

async function metaFetch(path, options = {}) {
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
    throw e;
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(
      `Meta Model API ${path} → ${res.status}: ${bodyText.slice(0, 300)}`
    );
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
const LISTING_COPY_MODEL = "muse-spark-1.3";

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

  const data = await metaFetch("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: LISTING_COPY_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      // Muse Spark 1.3 razona antes de responder y ese "pensamiento" también
      // consume max_tokens — "minimal" lo reduce (sigue gastando algunos
      // tokens) y max_tokens trae colchón de sobra para no cortar el JSON de
      // salida (confirmado con una llamada real: sin esto, el content llega
      // null por finish_reason "length").
      reasoning_effort: "minimal",
      max_tokens: 900,
    }),
  });

  const raw = data?.choices?.[0]?.message?.content || "{}";
  const parsed = safeParseJSON(raw);

  return {
    title: (parsed.title || rawNotes || "Propiedad crypto-friendly").slice(0, 70),
    description: parsed.description || rawNotes || "",
    mock: false,
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
              { type: "input_image", image_url: imageUrl },
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
