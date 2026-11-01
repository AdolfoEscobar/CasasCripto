import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Env ANTES de importar: metaModel lee MODEL_API_KEY y MUSE_SPARK_MODEL a
// nivel de módulo. META_RETRY_BASE_MS=1 para que los reintentos no duerman
// de verdad en los tests.
process.env.MODEL_API_KEY = "test-key";
process.env.MUSE_SPARK_MODEL = "spark-test-1";
process.env.META_RETRY_BASE_MS = "1";

const { generateListingCopy } = await import("./metaModel.js");

const realFetch = globalThis.fetch;
let calls;

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

function chatOk(model) {
  return jsonResponse(200, {
    choices: [
      {
        message: {
          content: JSON.stringify({
            title: `Título ${model}`,
            description: `Descripción ${model}`,
          }),
        },
      },
    ],
  });
}

function metaError(status, code) {
  return jsonResponse(status, { error: { code, message: code } });
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockFetch(handler) {
  globalThis.fetch = async (url, options) => {
    const entry = {
      url,
      model: options?.body ? JSON.parse(options.body).model : null,
    };
    calls.push(entry);
    return handler(entry, calls.length);
  };
}

const baseArgs = {
  rawNotes: "casa bonita",
  city: "Mérida",
  country: "México",
  price: 100,
};

describe("metaModel backoff", () => {
  it("reintenta un 500 transitorio y devuelve el resultado", async () => {
    mockFetch((entry, n) =>
      n === 1 ? metaError(500, "internal") : chatOk(entry.model)
    );
    const result = await generateListingCopy(baseArgs);
    assert.equal(calls.length, 2);
    assert.equal(result.mock, false);
    assert.equal(result.model, "spark-test-1");
    assert.match(result.title, /Título/);
  });

  it("reintenta tras un timeout y devuelve el resultado", async () => {
    mockFetch((entry, n) => {
      if (n < 3) throw Object.assign(new Error("aborted"), { name: "AbortError" });
      return chatOk(entry.model);
    });
    const result = await generateListingCopy(baseArgs);
    assert.equal(calls.length, 3);
    assert.equal(result.mock, false);
  });

  it("no reintenta un 400 (error de cliente)", async () => {
    mockFetch(() => metaError(400, "bad_request"));
    await assert.rejects(() => generateListingCopy(baseArgs), { status: 400 });
    assert.equal(calls.length, 1);
  });

  it("mantiene la cadena de modelos ante model_not_found", async () => {
    // El primer modelo que se pida falla con 404, el siguiente responde —
    // sin importar el orden de candidatos (el último modelo bueno se prueba
    // primero en instancias calientes).
    const seen = new Set();
    mockFetch((entry) => {
      if (!seen.size) {
        seen.add(entry.model);
        return metaError(404, "model_not_found");
      }
      return chatOk(entry.model);
    });
    const result = await generateListingCopy(baseArgs);
    assert.equal(calls.length, 2);
    assert.notEqual(calls[0].model, calls[1].model);
    assert.equal(result.model, calls[1].model);
  });

  it("descubre un modelo vía GET /models si todos los candidatos fallan", async () => {
    mockFetch((entry) => {
      if (entry.url.endsWith("/models")) {
        return jsonResponse(200, {
          data: [{ id: "muse-embed-1" }, { id: "muse-spark-9.9" }],
        });
      }
      if (entry.model === "muse-spark-9.9") return chatOk(entry.model);
      return metaError(404, "model_not_found");
    });
    const result = await generateListingCopy(baseArgs);
    assert.equal(result.model, "muse-spark-9.9");
    assert.equal(result.mock, false);
    assert.equal(
      calls.filter((c) => c.url.endsWith("/models")).length,
      1
    );
  });

  it("marca retriesExhausted cuando se agotan los reintentos", async () => {
    mockFetch(() => metaError(503, "overloaded"));
    await assert.rejects(() => generateListingCopy(baseArgs), (error) => {
      assert.equal(error.retriesExhausted, true);
      assert.equal(error.status, 503);
      return true;
    });
    assert.equal(calls.length, 3);
  });
});
