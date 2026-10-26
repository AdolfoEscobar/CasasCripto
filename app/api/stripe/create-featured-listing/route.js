import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createFeaturedListingCheckout } from "@/libs/stripe";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import User from "@/models/User";
import config from "@/config";

// Crea un checkout de Stripe (pago único) para destacar una propiedad del
// propio usuario. Solo propiedades "published" pueden destacarse — no tiene
// sentido pagar por visibilidad de algo que todavía no pasó revisión.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, successUrl, cancelUrl } = body;

    if (!propertyId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "propertyId, successUrl y cancelUrl son requeridos" },
        { status: 400 }
      );
    }

    await connectMongo();

    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (property.status !== "published") {
      return NextResponse.json(
        { error: "Solo puedes destacar propiedades ya publicadas" },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    const { price: amount, currency, days } = config.featuredListing;

    const url = await createFeaturedListingCheckout({
      propertyId: property._id.toString(),
      propertyTitle: property.title,
      amount,
      currency,
      days,
      successUrl,
      cancelUrl,
      email: user?.email,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("❌ Error creating featured listing checkout:", error);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago" },
      { status: 500 }
    );
  }
}
