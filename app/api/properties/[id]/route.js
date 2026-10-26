import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Property from "@/models/Property";

export const dynamic = "force-dynamic";

const OWNER_EDITABLE_FIELDS = [
  "title",
  "description",
  "city",
  "state",
  "country",
  "location",
  "price",
  "currency",
  "cryptoAccepted",
  "images",
  "contactEmail",
  "contactPhone",
];

// PATCH /api/properties/[id]
// - Admin: puede cambiar status ("published"/"rejected") + rejectionReason,
//   además de cualquier otro campo (revisión del panel admin).
// - Dueño (no admin): puede editar los campos de contenido de su propiedad.
//   Si estaba "published" o "rejected", editarla la regresa a "pending" para
//   que un admin la vuelva a revisar.
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 16: `params` es una Promise en route handlers dinámicos.
    const { id } = await params;
    await connectMongo();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = property.owner.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (isAdmin) {
      const { status, rejectionReason, ...rest } = body;
      if (status) {
        if (!["pending", "published", "rejected"].includes(status)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        property.status = status;
        property.rejectionReason = status === "rejected" ? rejectionReason || "" : "";
      }
      OWNER_EDITABLE_FIELDS.forEach((field) => {
        if (rest[field] !== undefined) property[field] = rest[field];
      });
    } else {
      let touchedContent = false;
      OWNER_EDITABLE_FIELDS.forEach((field) => {
        if (body[field] !== undefined) {
          property[field] = body[field];
          touchedContent = true;
        }
      });

      // El dueño puede marcar el estado comercial (activa/en oferta/cerrada)
      // sin disparar una nueva revisión — es solo informativo hoy.
      if (body.dealStatus && ["active", "under_offer", "closed"].includes(body.dealStatus)) {
        property.dealStatus = body.dealStatus;
      }

      // Cualquier edición del contenido (título, precio, fotos, etc.) manda
      // la propiedad de nuevo a revisión.
      if (touchedContent) {
        property.status = "pending";
        property.rejectionReason = "";
      }
    }

    await property.save();

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error("❌ Error updating property:", error);
    return NextResponse.json(
      { error: "Error updating property" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] — el dueño o un admin pueden borrar el listado.
export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 16: `params` es una Promise en route handlers dinámicos.
    const { id } = await params;
    await connectMongo();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = property.owner.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await property.deleteOne();

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("❌ Error deleting property:", error);
    return NextResponse.json(
      { error: "Error deleting property" },
      { status: 500 }
    );
  }
}
