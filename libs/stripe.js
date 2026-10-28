import Stripe from "stripe";

// This is used to create a Stripe Checkout for one-time payments. It's usually triggered with the <ButtonCheckout /> component. Webhooks are used to update the user's state in the database.
export const createCheckout = async ({
  priceId,
  mode,
  successUrl,
  cancelUrl,
  couponId,
  clientReferenceId,
  user,
}) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const extraParams = {};

  if (user?.customerId) {
    extraParams.customer = user.customerId;
  } else {
    if (mode === "payment") {
      extraParams.customer_creation = "always";
      // The option below costs 0.4% (up to $2) per invoice. Alternatively, you can use https://zenvoice.io/ to create unlimited invoices automatically.
      // extraParams.invoice_creation = { enabled: true };
      extraParams.payment_intent_data = { setup_future_usage: "on_session" };
    }
    if (user?.email) {
      extraParams.customer_email = user.email;
    }
    extraParams.tax_id_collection = { enabled: true };
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode,
    allow_promotion_codes: true,
    client_reference_id: clientReferenceId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    discounts: couponId
      ? [
          {
            coupon: couponId,
          },
        ]
      : [],
    success_url: successUrl,
    cancel_url: cancelUrl,
    ...extraParams,
  });

  return stripeSession.url;
};

// This is used to create Customer Portal sessions, so users can manage their subscriptions (payment methods, cancel, etc..)
export const createCustomerPortal = async ({ customerId, returnUrl }) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return portalSession.url;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// This is used to create a Stripe Checkout for one-time donations of any amount.
// Unlike createCheckout(), it doesn't need a pre-created Stripe Price (priceId) —
// it builds the price on the fly with `price_data`, so visitors can donate any
// amount (within config.donations limits) without extra Stripe dashboard setup.
// Triggered by the <DonateButton /> component via /api/stripe/create-donation.
export const createDonationCheckout = async ({
  amount, // amount in the smallest currency unit's major unit (e.g. 100 = $100 MXN)
  currency = "mxn",
  successUrl,
  cancelUrl,
  email,
}) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    customer_email: email || undefined,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: "Donación a Casas Cripto",
            description:
              "Apoyo voluntario al desarrollo de Casas Cripto. No es una inversión ni un instrumento financiero.",
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return stripeSession.url;
};

// Pago único para destacar una propiedad en /propiedades por X días —
// primer ingreso ligado directamente al marketplace (modelo tipo "listado
// patrocinado"), en vez de solo cobrar por el derecho a publicar. Igual que
// createDonationCheckout, usa price_data así que no necesita un Price
// preconfigurado en el Stripe Dashboard. El webhook (app/api/webhook/stripe)
// usa `metadata` para saber qué propiedad destacar al confirmar el pago.
export const createFeaturedListingCheckout = async ({
  propertyId,
  propertyTitle,
  amount,
  days,
  currency = "mxn",
  successUrl,
  cancelUrl,
  email,
}) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email || undefined,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Destacar propiedad: ${propertyTitle}`,
            description: `Aparece primero en /propiedades durante ${days} días.`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "featured_listing",
      propertyId,
      days: String(days),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return stripeSession.url;
};

// This is used to get the uesr checkout session and populate the data so we get the planId the user subscribed to
export const findCheckoutSession = async (sessionId) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    return session;
  } catch (e) {
    console.error(e);
    return null;
  }
};
