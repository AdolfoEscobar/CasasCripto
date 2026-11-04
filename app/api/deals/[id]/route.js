import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/Deal";
import User from "@/models/User";
import config from "@/config";
import { onchainDealId, tokenAddress, NATIVE_TOKEN } from "@/libs/escrow";
import { createOnchainDeal, cancelOnchainDeal } from "@/libs/escrowServer";
import { applyDealExpiry, formatDealAmount, serializeDeal } from "@/libs/deals";
import { sendDealEmail } from "@/libs/dealEmails";

export const dynamic = "force-dynamic";

const populateOne = (id) =>
  Deal.findById(id)
    .populate("property", "title city state country price currency images status")
    .populate("buyer", "name email walletAddress")
    .populate("seller", "name email walletAddress");

const isParticipant = (deal, userId) =>
  deal.buyer.toString() === userId || deal.seller.toString() === userId;

// GET /api/deals/[id] — detalle para comprador, vendedor o admin.
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
    const isAdmin = dbUser?.role === "admin";
    if (!isAdmin && !isParticipant(deal, session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (applyDealExpiry(deal)) {
      await deal.save();
    }

    const populated = await populateOne(deal._id).lean();
    return NextResponse.json({ data: serializeDeal(populated) });
  } catch (e) {
    console.error("GET /api/deals/[id] failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos cargar la oferta." },
      { status: 500 }
    );
  }
}

// PATCH /api/deals/[id] — { action: accept | reject | cancel }.
// - accept (vendedor): fija sellerWallet, abre ventana de depósito (3 días) y
//   espeja el deal on-chain (firmado por el árbitro). Si el espejo falla, el
//   deal queda accepted con onchainError y se reintenta en GET sync.
// - reject (vendedor, offered) / cancel (comprador, offered o accepted sin
//   fondear; si ya hay espejo on-chain se cancela best-effort).
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();
    if (!["accept", "reject", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }

    await connectMongo();
    const deal = await Deal.findById((await params).id).populate(
      "property",
      "title"
    );
    if (!deal) {
      return NextResponse.json({ error: "Oferta no encontrada." }, { status: 404 });
    }
    if (!isParticipant(deal, session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (applyDealExpiry(deal)) {
      await deal.save();
      return NextResponse.json(
        { error: "Esta oferta ya venció." },
        { status: 410 }
      );
    }

    const me = session.user.id;
    const isSeller = deal.seller.toString() === me;
    const isBuyer = deal.buyer.toString() === me;

    if (action === "accept") {
      if (!isSeller) {
        return NextResponse.json(
          { error: "Solo el vendedor puede aceptar." },
          { status: 403 }
        );
      }
      if (deal.status !== "offered") {
        return NextResponse.json(
          { error: "Solo se puede aceptar una oferta enviada." },
          { status: 400 }
        );
      }
      const seller = await User.findById(me);
      if (!seller?.walletAddress) {
        return NextResponse.json(
          { error: "Vincula tu wallet de MetaMask antes de aceptar." },
          { status: 400 }
        );
      }

      deal.sellerWallet = seller.walletAddress;
      deal.status = "accepted";
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + config.escrow.depositDays);
      deal.depositDeadline = deadline;
      deal.onchainId = onchainDealId(deal._id.toString());

      // Espejo on-chain (mejor esfuerzo: si falla, reintenta GET sync).
      try {
        const token = tokenAddress(deal.chainId, deal.token) || NATIVE_TOKEN;
        if (deal.token !== "ETH" && token === NATIVE_TOKEN) {
          throw new Error(`Token ${deal.token} sin desplegar en la cadena.`);
        }
        const hash = await createOnchainDeal({
          chainId: deal.chainId,
          onchainId: deal.onchainId,
          buyer: deal.buyerWallet,
          seller: deal.sellerWallet,
          token,
          amount: deal.amount,
          deadline,
        });
        deal.createTx = hash;
        deal.onchainError = undefined;
      } catch (e) {
        deal.onchainError = e?.message || "createDeal falló";
        console.error("createOnchainDeal failed:", deal.onchainError);
      }
      await deal.save();

      const buyer = await User.findById(deal.buyer).lean();
      sendDealEmail({
        to: buyer?.email,
        type: "accepted",
        propertyTitle: deal.property?.title,
        amountText: `${formatDealAmount(deal)} ${deal.token}`,
      });
    } else if (action === "reject") {
      if (!isSeller) {
        return NextResponse.json(
          { error: "Solo el vendedor puede rechazar." },
          { status: 403 }
        );
      }
      if (deal.status !== "offered") {
        return NextResponse.json(
          { error: "Solo se puede rechazar una oferta enviada." },
          { status: 400 }
        );
      }
      deal.status = "rejected";
      await deal.save();

      const buyer = await User.findById(deal.buyer).lean();
      sendDealEmail({
        to: buyer?.email,
        type: "rejected",
        propertyTitle: deal.property?.title,
      });
    } else {
      if (!isBuyer) {
        return NextResponse.json(
          { error: "Solo el comprador puede cancelar." },
          { status: 403 }
        );
      }
      if (!["offered", "accepted"].includes(deal.status)) {
        return NextResponse.json(
          { error: "Esta oferta ya no se puede cancelar." },
          { status: 400 }
        );
      }
      // Si ya hay espejo on-chain sin fondear, cancelarlo best-effort.
      if (deal.status === "accepted" && deal.onchainId && !deal.fundTx) {
        try {
          await cancelOnchainDeal(deal.chainId, deal.onchainId);
        } catch (e) {
          console.error("cancelOnchainDeal failed:", e?.message || e);
        }
      }
      deal.status = "cancelled";
      await deal.save();

      const seller = await User.findById(deal.seller).lean();
      sendDealEmail({
        to: seller?.email,
        type: "cancelled",
        propertyTitle: deal.property?.title,
      });
    }

    const populated = await populateOne(deal._id).lean();
    return NextResponse.json({ data: serializeDeal(populated) });
  } catch (e) {
    console.error("PATCH /api/deals/[id] failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos actualizar la oferta." },
      { status: 500 }
    );
  }
}
