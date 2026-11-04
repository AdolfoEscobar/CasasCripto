import { NextResponse } from "next/server";
import { decodeEventLog } from "viem";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/Deal";
import User from "@/models/User";
import { escrowAddress } from "@/libs/chains";
import {
  getPublicClient,
  onchainDealId,
  tokenAddress,
  NATIVE_TOKEN,
} from "@/libs/escrow";
import { escrowAbi, ONCHAIN_STATE } from "@/libs/escrowAbi";
import { createOnchainDeal } from "@/libs/escrowServer";
import {
  applyDealExpiry,
  formatDealAmount,
  serializeDeal,
} from "@/libs/deals";
import { sendDealEmail } from "@/libs/dealEmails";

export const dynamic = "force-dynamic";

const TERMINAL = ["released", "refunded", "rejected", "expired", "cancelled"];

async function notify(deal, type) {
  const [buyer, seller] = await Promise.all([
    User.findById(deal.buyer).lean(),
    User.findById(deal.seller).lean(),
  ]);
  const property = deal.property?.title
    ? deal.property
    : await deal.populate("property", "title").then((d) => d.property);
  const amountText = `${formatDealAmount(deal)} ${deal.token}`;
  await Promise.all([
    sendDealEmail({ to: buyer?.email, type, propertyTitle: property?.title, amountText }),
    sendDealEmail({ to: seller?.email, type, propertyTitle: property?.title, amountText }),
  ]);
}

// POST /api/deals/[id]/sync — verifica un txHash on-chain y avanza el deal.
// El front lo llama tras cada firma (depósito, aprobación, reembolso). Solo
// transiciones hacia adelante: nunca degrada released/refunded.
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { txHash } = await req.json();
    if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "txHash inválido." }, { status: 400 });
    }

    await connectMongo();
    const deal = await Deal.findById((await params).id);
    if (!deal) {
      return NextResponse.json({ error: "Oferta no encontrada." }, { status: 404 });
    }
    const me = session.user.id;
    const dbUser = await User.findById(me).lean();
    const allowed =
      dbUser?.role === "admin" ||
      deal.buyer.toString() === me ||
      deal.seller.toString() === me;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!deal.onchainId || TERMINAL.includes(deal.status)) {
      const out = await Deal.findById(deal._id)
        .populate("property", "title city price currency images status")
        .populate("buyer", "name email walletAddress")
        .populate("seller", "name email walletAddress")
        .lean();
      return NextResponse.json({ data: serializeDeal(out) });
    }

    const expectedEscrow = (escrowAddress(deal.chainId) || "").toLowerCase();
    const client = getPublicClient(deal.chainId);
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    if (!receipt || receipt.status !== "success") {
      return NextResponse.json(
        { error: "La transacción aún no confirma o falló." },
        { status: 400 }
      );
    }
    if ((receipt.to || "").toLowerCase() !== expectedEscrow) {
      return NextResponse.json(
        { error: "Esa transacción no es del escrow." },
        { status: 400 }
      );
    }

    let eventFound = null;
    for (const log of receipt.logs) {
      if ((log.address || "").toLowerCase() !== expectedEscrow) continue;
      let decoded = null;
      try {
        decoded = decodeEventLog({ abi: escrowAbi, data: log.data, topics: log.topics });
      } catch {
        continue;
      }
      if (
        !decoded?.args?.id ||
        String(decoded.args.id).toLowerCase() !== deal.onchainId.toLowerCase()
      ) {
        continue;
      }
      eventFound = decoded.eventName;
      if (decoded.eventName === "Funded" && deal.status === "accepted") {
        deal.status = "funded";
        deal.fundTx = txHash;
      } else if (decoded.eventName === "Released") {
        deal.status = "released";
        deal.releaseTx = txHash;
      } else if (decoded.eventName === "Refunded") {
        deal.status = "refunded";
        deal.refundTx = txHash;
      } else if (decoded.eventName === "ReleaseApproved") {
        const approver = String(decoded.args.approver || "").toLowerCase();
        if (approver === (deal.buyerWallet || "").toLowerCase()) {
          deal.buyerApproved = true;
        }
        if (approver === (deal.sellerWallet || "").toLowerCase()) {
          deal.sellerApproved = true;
        }
      } else if (decoded.eventName === "Cancelled") {
        if (!TERMINAL.includes(deal.status)) deal.status = "cancelled";
      }
    }

    if (!eventFound) {
      return NextResponse.json(
        { error: "El receipt no trae eventos de este deal." },
        { status: 400 }
      );
    }

    await deal.save();

    if (["funded", "released", "refunded"].includes(deal.status)) {
      await notify(deal, deal.status);
    }

    const out = await Deal.findById(deal._id)
      .populate("property", "title city price currency images status")
      .populate("buyer", "name email walletAddress")
      .populate("seller", "name email walletAddress")
      .lean();
    return NextResponse.json({ data: serializeDeal(out) });
  } catch (e) {
    console.error("POST /api/deals/[id]/sync failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos verificar la transacción." },
      { status: 500 }
    );
  }
}

// GET /api/deals/[id]/sync — reconcilia el deal con el estado on-chain:
// reintenta createDeal si falló al aceptar, y lee getDeal() para adelantar
// estados perdidos (syncs que nunca llegaron). Solo hacia adelante.
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const deal = await Deal.findById((await params).id);
    if (!deal) {
      return NextResponse.json({ error: "Oferta no encontrada." }, { status: 404 });
    }
    const dbUser = await User.findById(session.user.id).lean();
    const allowed =
      dbUser?.role === "admin" ||
      deal.buyer.toString() === session.user.id ||
      deal.seller.toString() === session.user.id;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (applyDealExpiry(deal)) {
      await deal.save();
    }

    const address = escrowAddress(deal.chainId);
    if (!address) {
      return NextResponse.json(
        { error: "Escrow no desplegado en esta cadena." },
        { status: 400 }
      );
    }

    // Reintento de createDeal si el accept lo dejó pendiente.
    if (
      deal.status === "accepted" &&
      deal.onchainId &&
      !deal.createTx &&
      deal.sellerWallet
    ) {
      try {
        const token = tokenAddress(deal.chainId, deal.token) || NATIVE_TOKEN;
        const hash = await createOnchainDeal({
          chainId: deal.chainId,
          onchainId: deal.onchainId,
          buyer: deal.buyerWallet,
          seller: deal.sellerWallet,
          token,
          amount: deal.amount,
          deadline: deal.depositDeadline || deal.offerExpiresAt,
        });
        deal.createTx = hash;
        deal.onchainError = undefined;
        await deal.save();
      } catch (e) {
        deal.onchainError = e?.message || "createDeal falló";
        await deal.save();
      }
    }

    // Lectura on-chain y avance solo-hacia-adelante.
    if (deal.onchainId && ["accepted", "funded"].includes(deal.status)) {
      try {
        const client = getPublicClient(deal.chainId);
        const onchain = await client.readContract({
          address,
          abi: escrowAbi,
          functionName: "getDeal",
          args: [deal.onchainId],
        });
        const state = Number(onchain.state ?? onchain[5]);
        if (state === ONCHAIN_STATE.Funded && deal.status === "accepted") {
          deal.status = "funded";
          await deal.save();
          await notify(deal, "funded");
        } else if (state === ONCHAIN_STATE.Released && deal.status !== "released") {
          deal.status = "released";
          await deal.save();
          await notify(deal, "released");
        } else if (state === ONCHAIN_STATE.Refunded && deal.status !== "refunded") {
          deal.status = "refunded";
          await deal.save();
          await notify(deal, "refunded");
        } else if (
          state === ONCHAIN_STATE.Cancelled &&
          !TERMINAL.includes(deal.status)
        ) {
          deal.status = "cancelled";
          await deal.save();
        }
        const buyerApproved = onchain.buyerApproved ?? onchain[6];
        const sellerApproved = onchain.sellerApproved ?? onchain[7];
        if (
          (buyerApproved && !deal.buyerApproved) ||
          (sellerApproved && !deal.sellerApproved)
        ) {
          deal.buyerApproved = deal.buyerApproved || !!buyerApproved;
          deal.sellerApproved = deal.sellerApproved || !!sellerApproved;
          await deal.save();
        }
      } catch (e) {
        console.error("reconcile read failed:", e?.message || e);
      }
    }

    const out = await Deal.findById(deal._id)
      .populate("property", "title city price currency images status")
      .populate("buyer", "name email walletAddress")
      .populate("seller", "name email walletAddress")
      .lean();
    return NextResponse.json({ data: serializeDeal(out) });
  } catch (e) {
    console.error("GET /api/deals/[id]/sync failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos reconciliar la oferta." },
      { status: 500 }
    );
  }
}
