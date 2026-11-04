import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SiweMessage, generateNonce } from "siwe";
import { privateKeyToAccount } from "viem/accounts";
import { expectedSiweDomain, getRequestCookie } from "./siwe.js";

// Llave de prueba pública (cuenta #0 de Anvil), sin fondos reales.
const TEST_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f3ff80";

// Replica exacta del flujo de login: el cliente construye el mensaje así
// (SignInCard/WalletCard) y el servidor lo verifica así (authorize + link).
// Si cambia el formato en un lado, este test se rompe primero.
describe("SIWE login roundtrip", () => {
  const account = privateKeyToAccount(TEST_KEY);
  const domain = "localhost:3000";

  async function signFresh() {
    const message = new SiweMessage({
      domain,
      address: account.address,
      statement: "Entrar a Casas Cripto",
      uri: `http://${domain}`,
      version: "1",
      chainId: 1,
      nonce: generateNonce(),
    });
    const prepared = message.prepareMessage();
    const signature = await account.signMessage({ message: prepared });
    return { prepared, signature, nonce: message.nonce };
  }

  it("una firma fresca verifica con dominio y nonce correctos", async () => {
    const { prepared, signature, nonce } = await signFresh();
    const received = new SiweMessage(prepared);
    const result = await received.verify({ signature, domain, nonce });
    assert.equal(result.success, true);
    assert.equal(received.address, account.address);
  });

  it("rechaza nonce incorrecto", async () => {
    const { prepared, signature } = await signFresh();
    const received = new SiweMessage(prepared);
    await assert.rejects(() =>
      received.verify({ signature, domain, nonce: "00000000" })
    );
  });

  it("rechaza dominio incorrecto", async () => {
    const { prepared, signature, nonce } = await signFresh();
    const received = new SiweMessage(prepared);
    await assert.rejects(() =>
      received.verify({ signature, domain: "evil.com", nonce })
    );
  });

  it("cada nonce es único", () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateNonce()));
    assert.equal(seen.size, 50);
  });
});

describe("expectedSiweDomain", () => {
  const req = (headers = {}) => ({
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    url: "http://localhost:3000/api/x",
  });

  it("usa el host directo en dev (incluye puerto)", () => {
    assert.equal(
      expectedSiweDomain(req({ host: "127.0.0.1:3100" })),
      "127.0.0.1:3100"
    );
  });

  it("prefiere x-forwarded-host tras proxy (Vercel)", () => {
    assert.equal(
      expectedSiweDomain({
        headers: {
          get: (k) =>
            (
              { "x-forwarded-host": "www.casascripto.com", host: "internal:1" }[
                k.toLowerCase()
              ] ?? null
            ),
        },
        url: "http://localhost:3000/api/x",
      }),
      "www.casascripto.com"
    );
  });

  it("toma el primero si x-forwarded-host trae lista", () => {
    assert.equal(
      expectedSiweDomain(req({ "x-forwarded-host": "a.com, b.com" })),
      "a.com"
    );
  });

  it("cae a la URL y luego a null", () => {
    assert.equal(expectedSiweDomain(req({})), "localhost:3000");
    assert.equal(expectedSiweDomain({ headers: { get: () => null } }), null);
  });
});

describe("getRequestCookie", () => {
  const req = (cookie) => ({ headers: { get: () => cookie } });

  it("lee y decodifica la cookie pedida", () => {
    assert.equal(
      getRequestCookie(req("a=1; siwe-nonce=ab%20c; d=4"), "siwe-nonce"),
      "ab c"
    );
  });

  it("devuelve null si falta", () => {
    assert.equal(getRequestCookie(req("a=1"), "siwe-nonce"), null);
    assert.equal(getRequestCookie({ headers: { get: () => null } }, "x"), null);
  });
});
