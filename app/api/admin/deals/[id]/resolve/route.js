import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/Deal";
import { arbiterRelease, arbiterRefund } from "@/libs/escrowServer";
import { serializeDeal } from "@/libs/deals";

export const dynamic = "force-dynamic";

// POST /api/admin/deals/[id]/resolve — el árbitro resuelve un deal fondeado:
// { decision: "release" | "refund" } firma arbiterRelease/arbiterRefund con
// la llave del servidor y devuelve el hash. El front luego llama GET sync
// hasta que el estado avanza on-chain (no se espera el receipt aquí para no
// colgar el request).
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { decision } = await req.json();
    if (!["release", "refund"].includes(decision)) {
      return NextResponse.json(
        { error: "Decisión inválida: release | refund." },
        { status: 400 }
      );
    }

    await connectMongo();
    const deal = await Deal.findById((await params).id);
    if (!deal) {
      return NextResponse.json({ error: "Deal no encontrado." }, { status: 404 });
    }
    if (deal.status !== "funded" || !deal.onchainId) {
      return NextResponse.json(
        { error: "Solo se puede resolver un deal fondeado." },
        { status: 400 }
      );
    }

    try {
      const hash =
        decision === "release"
          ? await arbiterRelease(deal.chainId, deal.onchainId)
          : await arbiterRefund(deal.chainId, deal.onchainId);
      return NextResponse.json({ hash });
    } catch (e) {
      console.error("arbiter resolve failed:", e?.message || e);
      return NextResponse.json(
        { error: e?.message || "No pudimos firmar la resolución." },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("POST /api/admin/deals resolve failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos resolver el deal." },
      { status: 500 }
    );
  }
}
