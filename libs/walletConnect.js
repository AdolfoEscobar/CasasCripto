// Selección de conector de wallet (wagmi v3) + diagnóstico de errores.
// Contexto: en v3 `metaMask()` es el SDK (id "metaMaskSDK", flujo móvil/QR)
// y la extensión de escritorio se alcanza con `injected({ target: "metaMask" })`
// (id "metaMask") o el `injected()` genérico (id "injected"). Buscar solo por
// id sin sondear provider elige el conector equivocado o falla mudo.

// Prioridad: extensión MetaMask → inyectada genérica (Rabby, Brave, etc.) →
// SDK de MetaMask (último recurso: puede mostrar QR en móvil).
export const WALLET_CONNECTOR_PRIORITY = [
  "metaMask",
  "injected",
  "metaMaskSDK",
];

export function sortByPriority(connectors) {
  const rank = (c) => {
    const i = WALLET_CONNECTOR_PRIORITY.indexOf(c?.id);
    return i === -1 ? 99 : i;
  };
  return [...(connectors || [])].sort((a, b) => rank(a) - rank(b));
}

// Devuelve el primer conector cuyo provider existe (sondea getProvider()).
// Null = sin wallet disponible (típico: nada instalado). No conecta nada.
export async function resolveWalletConnector(connectors) {
  for (const connector of sortByPriority(connectors)) {
    try {
      const provider = await connector?.getProvider?.();
      if (provider) return connector;
    } catch {
      // Sin provider (o inyección lenta): probar el siguiente.
    }
  }
  return null;
}

export function hasInjectedProvider() {
  return typeof window !== "undefined" && !!window.ethereum;
}

export const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";

// Clasifica errores de connect() en causas accionables para la UI.
export function classifyConnectError(error) {
  const text =
    `${error?.shortMessage || ""} ${error?.message || ""} ${error?.name || ""}`;
  if (
    /ProviderNotFound|no provider|not found|not installed|missing provider|no injected/i.test(
      text
    )
  ) {
    return "no-provider";
  }
  if (/reject|denied|dismiss|cancel|unauthorized/i.test(text)) {
    return "rejected";
  }
  if (/already connected/i.test(text)) return "already-connected";
  return "unknown";
}
