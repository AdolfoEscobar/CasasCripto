import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import { createCustomerPortal } from "@/libs/stripe";
import User from "@/models/User";

export async function POST(req) {
  const session = await auth();

  if (session) {
    try {
      await connectMongo();

      const body = await req.json();

      const { id } = session.user;

      const user = await User.findById(id);

      if (!user?.customerId) {
        return NextResponse.json(
          {
            error:
              "Aún no tienes cuenta de facturación: primero suscríbete a Premium o destaca un listado.",
          },
          { status: 400 }
        );
      } else if (!body.returnUrl) {
        return NextResponse.json(
          { error: "Falta la URL de retorno" },
          { status: 400 }
        );
      }

      const stripePortalUrl = await createCustomerPortal({
        customerId: user.customerId,
        returnUrl: body.returnUrl,
      });

      // createCustomerPortal devuelve null si Stripe falla — sin este chequeo
      // el front redirigiría a la URL literal "null".
      if (!stripePortalUrl) {
        return NextResponse.json(
          {
            error:
              "No pudimos abrir el portal de facturación. Intenta de nuevo.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        url: stripePortalUrl,
      });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: e?.message }, { status: 500 });
    }
  } else {
    // Not Signed in
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
}
