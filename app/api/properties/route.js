import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";
import User from "@/models/User";
import config from "@/config";
import { leanArrayToJSON } from "@/libs/leanToJSON";
import { MAX_PROPERTY_IMAGES, sanitizeImages } from "@/libs/propertyImages";

export const dynamic = "force-dynamic";

// GET /api/properties
// Público por defecto: devuelve solo propiedades "published".
// ?status=pending|rejected requiere sesión de admin (usado por el panel de
// revisión en /admin/dashboard/properties).
// ?citySlug=tulum-mexico filtra por ciudad (ver models/Property citySlug),
// usado por /propiedades?ciudad=... y las páginas SEO por ciudad.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "published";
    const citySlug = searchParams.get("citySlug");
    const limit = Math.min(parseInt(searchParams.get("limit")) || 50, 100);

    if (status !== "published") {
      const session = await auth();
      if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectMongo();

    const query = { status, ...(citySlug && { citySlug }) };

    const properties = await Property.find(query)
      .populate("owner", "name email")
      .sort("-createdAt")
      .limit(limit)
      .lean();

    return NextResponse.json({ data: leanArrayToJSON(properties) });
  } catch (error) {
    console.error("❌ Error fetching properties:", error);
    return NextResponse.json(
      { error: "Error fetching properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties
// Crea una propiedad en estado "pending" (queda a la espera de revisión por
// un admin). Publicar es gratis para cualquier cuenta — no requiere
// hasAccess ni ningún plan "activado" (ver análisis de monetización: cobrar
// por el derecho a publicar le pone un techo artificial al único canal de
// crecimiento orgánico gratis de un marketplace de día cero). El único
// límite es cuántas propiedades activas puedes tener a la vez
// (config.stripe.plans[].maxProperties), usando el plan Básico (gratuito)
// como default si el usuario no tiene una suscripción Premium paga.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const dbUser = await User.findById(session.user.id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const paidPlan = dbUser.hasAccess
      ? config.stripe.plans.find(
          (p) => !p.isFree && p.priceId === dbUser.priceId
        )
      : null;
    const freePlan = config.stripe.plans.find((p) => p.isFree);
    const plan = paidPlan || freePlan;
    const maxProperties = plan?.maxProperties ?? 20;

    const currentCount = await Property.countDocuments({
      owner: dbUser._id,
      status: { $ne: "rejected" },
    });

    if (currentCount >= maxProperties) {
      return NextResponse.json(
        {
          error: paidPlan
            ? `Tu plan ${plan.name} permite hasta ${maxProperties} propiedad(es) activa(s).`
            : `Alcanzaste el límite gratuito de ${maxProperties} propiedades activas. Actualiza a Premium para publicar más.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      city,
      state,
      country,
      location,
      price,
      currency,
      cryptoAccepted,
      images,
      contactEmail,
      contactPhone,
    } = body;

    if (!title || !city || !country || price === undefined || price === null) {
      return NextResponse.json(
        { error: "Título, ciudad, país y precio son obligatorios" },
        { status: 400 }
      );
    }

    if (
      images !== undefined &&
      (!Array.isArray(images) || images.length > MAX_PROPERTY_IMAGES)
    ) {
      return NextResponse.json(
        { error: `Máximo ${MAX_PROPERTY_IMAGES} fotos por propiedad` },
        { status: 400 }
      );
    }

    const property = await Property.create({
      owner: dbUser._id,
      title,
      description,
      city,
      state,
      country,
      location,
      price,
      currency: currency || "USD",
      cryptoAccepted: Array.isArray(cryptoAccepted) ? cryptoAccepted : [],
      images: sanitizeImages(images),
      contactEmail: contactEmail || dbUser.email,
      contactPhone,
      status: "pending",
    });

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error("❌ Error creating property:", error);
    return NextResponse.json(
      { error: "Error creating property" },
      { status: 500 }
    );
  }
}
