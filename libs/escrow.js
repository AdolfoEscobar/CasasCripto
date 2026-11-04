import {
  createPublicClient,
  http,
  keccak256,
  toHex,
  zeroAddress,
} from "viem";
import {
  CHAINS,
  MAINNET_ID,
  SEPOLIA_ID,
  MAINNET_TOKENS,
} from "./chains.js";

export const NATIVE_TOKEN = zeroAddress;

// Cliente público de lectura por cadena. Usa RPC autenticado si hay env;
// si no, viem cae al RPC público (solo para dev).
export function getPublicClient(chainId) {
  const chain = chainId === MAINNET_ID ? CHAINS.mainnet : CHAINS.sepolia;
  const url =
    chainId === MAINNET_ID
      ? process.env.ETH_RPC_URL || process.env.NEXT_PUBLIC_ETH_RPC_URL
      : process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  return createPublicClient({ chain, transport: http(url || undefined) });
}

// Dirección del token en una cadena: address(0) para ETH; mainnet usa USDC/
// USDT reales; Sepolia usa los mocks del deploy (env, ver scripts/).
export function tokenAddress(chainId, symbol) {
  if (symbol === "ETH") return NATIVE_TOKEN;
  if (chainId === MAINNET_ID) return MAINNET_TOKENS[symbol]?.address || null;
  if (chainId === SEPOLIA_ID) {
    if (symbol === "USDC") return process.env.NEXT_PUBLIC_SEPOLIA_USDC || null;
    if (symbol === "USDT") return process.env.NEXT_PUBLIC_SEPOLIA_USDT || null;
  }
  return null;
}

export function tokenDecimals(symbol) {
  return MAINNET_TOKENS[symbol]?.decimals ?? 18;
}

// ID on-chain determinista del deal: keccak256 del _id de Mongo.
export function onchainDealId(mongoId) {
  return keccak256(toHex(String(mongoId)));
}
