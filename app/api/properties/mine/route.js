import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import { leanArrayToJSON } from "@/libs/leanToJSON";

export const dynamic = "force-dynamic";

// GET /api/properties/mine
// Devuelve todas las propiedades del usuario autenticado, sin importar su
// estado (pending/published/rejected). Usado por el dashboard de usuario.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const properties = await Property.find({ owner: session.user.id })
      .sort("-createdAt")
      .lean();

    return NextResponse.json({ data: leanArrayToJSON(properties) });
  } catch (error) {
    console.error("❌ Error fetching my properties:", error);
    return NextResponse.json(
      { error: "Error fetching properties" },
      { status: 500 }
    );
  }
}
