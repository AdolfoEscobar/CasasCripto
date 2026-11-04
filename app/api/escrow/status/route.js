import { NextResponse } from "next/server";
import config from "@/config";
import { activeEscrowChainId, escrowAddress } from "@/libs/chains";
import { getPublicClient } from "@/libs/escrow";
import { escrowAbi } from "@/libs/escrowAbi";

export const dynamic = "force-dynamic";

// GET /api/escrow/status — estado público del escrow: cadena activa,
// contrato, árbitro, comisión y pausa (leída on-chain; null si no hay
// contrato o el RPC falla). Lo usan el panel de deals y el admin.
export async function GET() {
  const chainId = activeEscrowChainId();
  const address = escrowAddress(chainId);

  let paused = null;
  if (address) {
    try {
      const client = getPublicClient(chainId);
      paused = await client.readContract({
        address,
        abi: escrowAbi,
        functionName: "paused",
      });
    } catch (e) {
      console.error("escrow status read failed:", e?.message || e);
    }
  }

  return NextResponse.json({
    chainId,
    chainName: chainId === 1 ? "Ethereum" : "Sepolia",
    testnet: chainId !== 1,
    address,
    arbiter: config.escrow.arbiter,
    feeBps: config.escrow.feeBps,
    paused,
  });
}
