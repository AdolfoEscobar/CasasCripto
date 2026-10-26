import { NextResponse } from "next/server";
import { createDonationCheckout } from "@/libs/stripe";
import config from "@/config";

// Creates a Stripe Checkout session for a one-time donation of any amount.
// Called by the <DonateButton /> component. No authentication required —
// donations are open to anyone who wants to support the project.
export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, successUrl, cancelUrl, email } = body;

    const numericAmount = Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount)) {
      return NextResponse.json(
        { error: "A valid donation amount is required" },
        { status: 400 }
      );
    }

    if (numericAmount < (config.donations?.minAmount || 1)) {
      return NextResponse.json(
        {
          error: `The minimum donation amount is $${
            config.donations?.minAmount || 1
          }`,
        },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "Success and cancel URLs are required" },
        { status: 400 }
      );
    }

    const url = await createDonationCheckout({
      amount: numericAmount,
      currency: config.donations?.currency || "usd",
      successUrl,
      cancelUrl,
      email,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Donation checkout error:", error);
    return NextResponse.json(
      { error: "Could not start the donation checkout" },
      { status: 500 }
    );
  }
}
