import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/Deal";
import { serializeDeal } from "@/libs/deals";

export const dynamic = "force-dynamic";

// GET /api/admin/deals?status=&page=&limit= — lista deals para el árbitro
// (solo admin). Por defecto trae los que necesitan acción: funded primero.
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);

    await connectMongo();
    const query = status ? { status } : {};
    const deals = await Deal.find(query)
      .populate("property", "title city price currency status")
      .populate("buyer", "name email walletAddress")
      .populate("seller", "name email walletAddress")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Deal.countDocuments(query);

    return NextResponse.json({
      data: deals.map(serializeDeal),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("GET /api/admin/deals failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos cargar los deals." },
      { status: 500 }
    );
  }
}
