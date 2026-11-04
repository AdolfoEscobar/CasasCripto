import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { setEscrowPaused } from "@/libs/escrowServer";
import { activeEscrowChainId } from "@/libs/chains";

export const dynamic = "force-dynamic";

// POST /api/admin/escrow/pause — { paused: true|false, chainId? } pausa o
// reanuda el escrow (firmado por el árbitro). Pausar congela depósitos y
// liberaciones, pero NUNCA bloquea reembolsos (salida garantizada).
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paused, chainId } = await req.json();
    if (typeof paused !== "boolean") {
      return NextResponse.json(
        { error: "paused debe ser boolean." },
        { status: 400 }
      );
    }

    try {
      const hash = await setEscrowPaused(
        chainId || activeEscrowChainId(),
        paused
      );
      return NextResponse.json({ hash, paused });
    } catch (e) {
      console.error("setEscrowPaused failed:", e?.message || e);
      return NextResponse.json(
        { error: e?.message || "No pudimos cambiar la pausa." },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("POST /api/admin/escrow/pause failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos cambiar la pausa." },
      { status: 500 }
    );
  }
}
