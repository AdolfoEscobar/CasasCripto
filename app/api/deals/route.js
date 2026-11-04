import { NextResponse } from "next/server";
import { parseUnits } from "viem";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/Deal";
import Property from "@/models/Property";
import User from "@/models/User";
import config from "@/config";
import { activeEscrowChainId, DEAL_TOKENS } from "@/libs/chains";
import { tokenDecimals } from "@/libs/escrow";
import {
  ACTIVE_DEAL_STATUS,
  applyDealExpiry,
  serializeDeal,
} from "@/libs/deals";
import { sendDealEmail } from "@/libs/dealEmails";

export const dynamic = "force-dynamic";

const populateDeal = (query) =>
  query
    .populate("property", "title city state country price currency images status")
    .populate("buyer", "name email walletAddress")
    .populate("seller", "name email walletAddress");

// GET /api/deals?role=made|received — deals del usuario como comprador o
// vendedor. Aplica vencimientos perezosos antes de responder.
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = new URL(req.url).searchParams.get("role") || "received";
    const field = role === "made" ? "buyer" : "seller";

    await connectMongo();
    const deals = await Deal.find({ [field]: session.user.id })
      .sort("-createdAt")
      .limit(100);

    for (const deal of deals) {
      if (applyDealExpiry(deal)) {
        await deal.save();
      }
    }

    const populated = await Deal.populate(deals, [
      { path: "property", select: "title city state country price currency images status" },
      { path: "buyer", select: "name email walletAddress" },
      { path: "seller", select: "name email walletAddress" },
    ]);

    return NextResponse.json({
      data: populated.map((d) => serializeDeal(d.toObject())),
    });
  } catch (e) {
    console.error("GET /api/deals failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos cargar tus ofertas." },
      { status: 500 }
    );
  }
}

// POST /api/deals — crea una oferta { propertyId, token, amount } (amount en
// unidades legibles, ej. "1.5"). Exige wallet vinculada al comprador (queda
// fijada como buyerWallet para el escrow) y propiedad publicada ajena. Una
// oferta activa por comprador+propiedad. Expira en 7 días.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, token, amount } = await req.json();
    if (!propertyId || !token || amount === undefined) {
      return NextResponse.json(
        { error: "Faltan propertyId, token o amount." },
        { status: 400 }
      );
    }
    if (!DEAL_TOKENS.includes(token)) {
      return NextResponse.json(
        { error: `Token inválido. Usa: ${DEAL_TOKENS.join(", ")}.` },
        { status: 400 }
      );
    }

    let baseUnits;
    try {
      baseUnits = parseUnits(String(amount), tokenDecimals(token)).toString();
      if (BigInt(baseUnits) <= 0n) throw new Error("non-positive");
    } catch {
      return NextResponse.json(
        { error: "Monto inválido. Debe ser un número mayor a cero." },
        { status: 400 }
      );
    }

    await connectMongo();
    const [dbUser, property] = await Promise.all([
      User.findById(session.user.id),
      Property.findById(propertyId),
    ]);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!property || property.status !== "published") {
      return NextResponse.json(
        { error: "Esa propiedad no está disponible para ofertar." },
        { status: 404 }
      );
    }
    if (property.owner.toString() === session.user.id) {
      return NextResponse.json(
        { error: "No puedes ofertar por tu propia propiedad." },
        { status: 400 }
      );
    }
    if (!dbUser.walletAddress) {
      return NextResponse.json(
        { error: "Vincula tu wallet de MetaMask antes de ofertar." },
        { status: 400 }
      );
    }

    const existing = await Deal.findOne({
      property: propertyId,
      buyer: session.user.id,
      status: { $in: ACTIVE_DEAL_STATUS },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes una oferta activa por esta propiedad." },
        { status: 409 }
      );
    }

    const offerExpiresAt = new Date();
    offerExpiresAt.setDate(offerExpiresAt.getDate() + config.escrow.offerDays);

    const deal = await Deal.create({
      property: propertyId,
      buyer: session.user.id,
      seller: property.owner,
      buyerWallet: dbUser.walletAddress,
      token,
      amount: baseUnits,
      chainId: activeEscrowChainId(),
      status: "offered",
      offerExpiresAt,
    });

    const seller = await User.findById(property.owner).lean();
    const populated = await populateDeal(Deal.findById(deal._id)).lean();
    const json = serializeDeal(populated);

    sendDealEmail({
      to: seller?.email,
      type: "offered",
      propertyTitle: property.title,
      amountText: `${json.amountDisplay} ${token}`,
    });

    return NextResponse.json({ data: json }, { status: 201 });
  } catch (e) {
    console.error("POST /api/deals failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos crear tu oferta." },
      { status: 500 }
    );
  }
}
