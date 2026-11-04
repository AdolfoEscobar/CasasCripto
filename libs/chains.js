import { mainnet, sepolia } from "wagmi/chains";

// Constantes de cadena y tokens. Todo corre en Ethereum:
// - Activos soportados: ETH, USDC y USDT (mainnet). BTC quedó fuera porque
//   requeriría WBTC.
// - Balances: se leen en mainnet.
// - Escrow: corre en la red de pruebas Sepolia hasta pasar auditoría y
//   revisión legal (ver contracts/README.md). En Sepolia los stables son
//   mocks desplegados por scripts/escrow-deploy.mjs, NO USDC/USDT reales.
export const CHAINS = { mainnet, sepolia };
export const MAINNET_ID = mainnet.id;
export const SEPOLIA_ID = sepolia.id;

// Direcciones mainnet (verificar en Etherscan antes de mainnet real).
export const MAINNET_TOKENS = {
  ETH: { symbol: "ETH", address: null, decimals: 18, native: true },
  USDC: {
    symbol: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    native: false,
  },
  USDT: {
    symbol: "USDT",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    native: false,
  },
};

export const DEAL_TOKENS = ["ETH", "USDC", "USDT"];

// Dirección del escrow por cadena (env). Mainnet vacío = escrow deshabilitado
// ahí hasta completar los gates humanos (auditoría + legal).
export function escrowAddress(chainId) {
  if (chainId === MAINNET_ID)
    return process.env.NEXT_PUBLIC_ESCROW_MAINNET || null;
  if (chainId === SEPOLIA_ID)
    return process.env.NEXT_PUBLIC_ESCROW_SEPOLIA || null;
  return null;
}

// Cadena activa del escrow: mainnet solo si ya hay contrato; si no, Sepolia.
export function activeEscrowChainId() {
  if (process.env.NEXT_PUBLIC_ESCROW_MAINNET) return MAINNET_ID;
  return SEPOLIA_ID;
}

export function shortAddress(address) {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function explorerTxUrl(chainId, hash) {
  if (!hash) return null;
  const base =
    chainId === MAINNET_ID
      ? "https://etherscan.io"
      : "https://sepolia.etherscan.io";
  return `${base}/tx/${hash}`;
}
