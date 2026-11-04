import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WALLET_CONNECTOR_PRIORITY,
  sortByPriority,
  resolveWalletConnector,
  hasInjectedProvider,
  classifyConnectError,
} from "./walletConnect.js";

describe("WALLET_CONNECTOR_PRIORITY", () => {
  it("prefiere extensión MetaMask, luego inyectada genérica, luego SDK", () => {
    assert.deepEqual(WALLET_CONNECTOR_PRIORITY, [
      "metaMask",
      "injected",
      "metaMaskSDK",
    ]);
  });
});

describe("sortByPriority", () => {
  it("ordena sin importar el orden de entrada y tolera ids raros", () => {
    const sorted = sortByPriority([
      { id: "metaMaskSDK" },
      { id: "otro" },
      { id: "injected" },
      { id: "metaMask" },
    ]);
    assert.deepEqual(
      sorted.map((c) => c.id),
      ["metaMask", "injected", "metaMaskSDK", "otro"]
    );
  });

  it("tolera lista vacía o nula", () => {
    assert.deepEqual(sortByPriority([]), []);
    assert.deepEqual(sortByPriority(null), []);
  });
});

describe("resolveWalletConnector", () => {
  const withProvider = (id) => ({
    id,
    getProvider: async () => ({ mock: true }),
  });
  const withoutProvider = (id) => ({
    id,
    getProvider: async () => {
      throw new Error("ProviderNotFoundError");
    },
  });

  it("elige el primero con provider disponible", async () => {
    const picked = await resolveWalletConnector([
      withoutProvider("metaMask"),
      withProvider("injected"),
      withProvider("metaMaskSDK"),
    ]);
    assert.equal(picked.id, "injected");
  });

  it("prefiere metaMask cuando tiene provider aunque venga último", async () => {
    const picked = await resolveWalletConnector([
      withProvider("injected"),
      withProvider("metaMask"),
    ]);
    assert.equal(picked.id, "metaMask");
  });

  it("devuelve null si ninguno tiene provider", async () => {
    const picked = await resolveWalletConnector([
      withoutProvider("metaMask"),
      withoutProvider("injected"),
    ]);
    assert.equal(picked, null);
  });

  it("tolera conectores sin getProvider", async () => {
    const picked = await resolveWalletConnector([
      { id: "raro" },
      withProvider("injected"),
    ]);
    assert.equal(picked.id, "injected");
  });
});

describe("hasInjectedProvider", () => {
  it("es false sin window (SSR/Node)", () => {
    assert.equal(hasInjectedProvider(), false);
  });
});

describe("classifyConnectError", () => {
  it("detecta falta de provider", () => {
    for (const e of [
      { name: "ProviderNotFoundError" },
      { message: "No provider found" },
      { shortMessage: "No injected provider found" },
    ]) {
      assert.equal(classifyConnectError(e), "no-provider");
    }
  });

  it("detecta rechazo del usuario", () => {
    for (const e of [
      { name: "UserRejectedRequestError" },
      { message: "User denied the request" },
      { shortMessage: "User dismissed the request" },
    ]) {
      assert.equal(classifyConnectError(e), "rejected");
    }
  });

  it("detecta ya-conectado y resto desconocido", () => {
    assert.equal(
      classifyConnectError({ message: "Connector already connected" }),
      "already-connected"
    );
    assert.equal(classifyConnectError({ message: "boom" }), "unknown");
    assert.equal(classifyConnectError(null), "unknown");
  });
});
