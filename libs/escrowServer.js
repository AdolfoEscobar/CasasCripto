import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAINS, MAINNET_ID, escrowAddress } from "./chains.js";
import { escrowAbi } from "./escrowAbi.js";

// Operaciones firmadas por el árbitro (llave del admin en servidor):
// crear/cancelar deals on-chain, resolver disputas y pausar.
// SOLO SERVIDOR — nunca importar desde componentes cliente.
//
// Seguridad: la llave vive en ARBITER_PRIVATE_KEY (solo testnet). Mainnet
// está bloqueado salvo ESCROW_MAINNET_LIVE=true, que solo se pone tras
// auditoría + revisión legal + signer seguro (KMS/multisig). Ver Fase 4.
function arbiterClient(chainId) {
  if (chainId === MAINNET_ID && process.env.ESCROW_MAINNET_LIVE !== "true") {
    throw new Error(
      "Mainnet bloqueado: completa auditoría + legal antes de operar (ver contracts/README.md)."
    );
  }
  const key = process.env.ARBITER_PRIVATE_KEY;
  if (!key) {
    throw new Error("Falta ARBITER_PRIVATE_KEY en el servidor.");
  }
  const address = escrowAddress(chainId);
  if (!address) {
    throw new Error(`Escrow no desplegado en la cadena ${chainId}.`);
  }
  const chain = chainId === MAINNET_ID ? CHAINS.mainnet : CHAINS.sepolia;
  const url =
    chainId === MAINNET_ID
      ? process.env.ETH_RPC_URL || process.env.NEXT_PUBLIC_ETH_RPC_URL
      : process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  const account = privateKeyToAccount(key);
  const client = createWalletClient({
    account,
    chain,
    transport: http(url || undefined),
  });
  return { client, account, address };
}

async function arbiterWrite(chainId, functionName, args) {
  const { client, account, address } = arbiterClient(chainId);
  const hash = await client.writeContract({
    address,
    abi: escrowAbi,
    functionName,
    args,
    account,
    chain: client.chain,
  });
  return hash;
}

// Espeja un deal aceptado off-chain en el contrato. Llamado al aceptar la
// oferta; si falla, el deal queda accepted con onchainError y se reintenta
// desde GET sync (no bloquea el flujo off-chain).
export function createOnchainDeal({
  chainId,
  onchainId,
  buyer,
  seller,
  token,
  amount,
  deadline,
}) {
  return arbiterWrite(chainId, "createDeal", [
    onchainId,
    buyer,
    seller,
    token,
    BigInt(amount),
    BigInt(Math.floor(deadline.getTime() / 1000)),
  ]);
}

export function cancelOnchainDeal(chainId, onchainId) {
  return arbiterWrite(chainId, "cancel", [onchainId]);
}

export function arbiterRelease(chainId, onchainId) {
  return arbiterWrite(chainId, "arbiterRelease", [onchainId]);
}

export function arbiterRefund(chainId, onchainId) {
  return arbiterWrite(chainId, "arbiterRefund", [onchainId]);
}

export function setEscrowPaused(chainId, paused) {
  return arbiterWrite(chainId, paused ? "pause" : "unpause", []);
}
