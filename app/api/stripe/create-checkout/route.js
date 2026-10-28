import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createCheckout } from "@/libs/stripe";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// It requires users to be authenticated: subscriptions are account-bound
// (hasAccess/premium limits live on the User), and the webhook links the
// payment via clientReferenceId. Checkout also prefills with their email.
export async function POST(req) {
  const body = await req.json();

  if (!body.priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  } else if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 }
    );
  } else if (!body.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 }
    );
  }

  try {
    const session = await auth();

    // Premium is account-bound: guest checkout would leave the payment
    // unattributed (or force email-guessing in the webhook). Unauthenticated
    // callers get 401 (see libs/api.js + ButtonCheckout for the sign-in flow).
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para suscribirte" },
        { status: 401 }
      );
    }

    await connectMongo();

    const user = await User.findById(session.user.id);

    const { priceId, mode, successUrl, cancelUrl } = body;

    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      // If user is logged in, it will pass the user ID to the Stripe Session so it can be retrieved in the webhook later
      clientReferenceId: user?._id?.toString(),
      // If user is logged in, this will automatically prefill Checkout data like email and/or credit card for faster checkout
      user,
      // If you send coupons from the frontend, you can pass it here
      // couponId: body.couponId,
    });

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
