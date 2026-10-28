const config = {
  // REQUIRED
  appName: "Casas Cripto",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Casas Cripto es la plataforma inmobiliaria elite que conecta propietarios crypto-friendly con compradores e inversionistas globales. Lista, invierte o dona para construir el futuro del real estate en criptomonedas.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "casascripto.com",
  // Tagline corto usado en Hero, SEO y redes sociales
  tagline: "El real estate elite que ya opera en criptomonedas.",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Premium ($299 MXN/mes, "precio fundador de lanzamiento" con ancla
    // $599): el priceId de dev es un Price real (modo test). Para prod
    // falta: 1) crear el producto recurrente "Premium $299 MXN/mes" en el
    // Stripe Dashboard (modo live), 2) copiar el Price ID real abajo, 3)
    // poner STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET en las env vars de
    // Vercel (producción) y en tu .env.local (dev/test), 4) registrar el
    // webhook https://TU-DOMINIO/api/webhook/stripe en Stripe escuchando:
    // checkout.session.completed, checkout.session.expired,
    // customer.subscription.updated, customer.subscription.deleted,
    // invoice.paid, invoice.payment_failed. 5) activar el Customer Portal
    // en Stripe (Settings → Billing → Customer portal).
    plans: [
      {
        // Plan gratuito SIEMPRE disponible (no solo "de lanzamiento"):
        // publicar no debe tener fricción de pago. Cada propiedad publicada
        // es una página indexable por Google — cobrar por crearla castiga
        // la única fuente de tráfico orgánico gratis que tiene un
        // marketplace de día cero (ver análisis SEO/cold-start). priceId es
        // un sentinel fijo, no un Price real de Stripe: este plan es el
        // fallback automático de cualquier usuario sin suscripción paga
        // (ver app/api/properties/route.js y dashboard/page.js) — no
        // requiere "activarlo" ni pasar por checkout.
        isFree: true,
        priceId: "price_free_basico",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Básico",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description:
          "Incluido automáticamente al crear tu cuenta — publica gratis, sin tarjeta",
        // REQUIRED — límite real de propiedades que este plan permite crear.
        // Se usa en app/api/properties/route.js para hacer cumplir el
        // límite. Alto a propósito (no 1): más listados = más páginas
        // indexables = más SEO orgánico. El filtro de calidad real es la
        // revisión manual del admin antes de publicar, no un muro de pago.
        maxProperties: 20,
        // The price you want to display, the one user will be charged on Stripe.
        price: 0,
        features: [
          { name: "Hasta 20 propiedades listadas" },
          { name: "Indica qué criptos aceptas (USDC, USDT, BTC, ETH)" },
          { name: "Perfil de propietario verificado" },
          { name: "Etiqueta crypto-friendly" },
          { name: "Soporte por email" },
        ],
      },
      {
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        // Precio fundador de lanzamiento: $299 MXN/mes (ancla $599). El
        // priceId de dev es un Price real (modo test). ⚠️ TODO antes de
        // vender en prod: crea el producto recurrente "Premium $299 MXN/mes"
        // en el Stripe Dashboard (modo live) y copia el Price ID real abajo.
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1UVeQMPL3F83hITMaCRDrHi4" // Price real (modo test) de "Premium $299 MXN/mes"
            : "price_456", // TODO: reemplaza por tu Price ID real (modo live) de "Premium"
        name: "Premium",
        description:
          "Para agentes y portafolios grandes que quieren escalar y destacar",
        price: 299,
        priceAnchor: 599,
        // REQUIRED — límite real de propiedades que este plan permite crear.
        // Muy por encima del límite gratuito (20): Premium es para
        // portafolios grandes, no la barrera de entrada para publicar.
        maxProperties: 100,
        features: [
          { name: "Hasta 100 propiedades listadas" },
          { name: "Indica qué criptos aceptas (USDC, USDT, BTC, ETH)" },
          { name: "Perfil premium de agente verificado" },
          { name: "Analítica de leads e inversionistas" },
          { name: "Posición destacada en el marketplace" },
          { name: "Acceso anticipado a $CASA (ver roadmap)" },
          { name: "Soporte prioritario 24/7" },
        ],
      },
    ],
  },
  // Listados destacados: pago único (no requiere un Price preconfigurado en
  // Stripe, igual que donations) para que una propiedad aparezca primero en
  // /propiedades durante X días. Es el primer ingreso real ligado al
  // marketplace en sí (modelo tipo Zillow Premier Agent / idealista
  // "destacado"), en vez de cobrar solo por el derecho a publicar.
  // Ver libs/stripe.js → createFeaturedListingCheckout.
  featuredListing: {
    price: 149,
    currency: "mxn",
    days: 7,
  },
  // Donaciones puntuales (pagos únicos vía Stripe, sin necesidad de un priceId
  // preconfigurado — ver libs/stripe.js → createDonationCheckout)
  donations: {
    currency: "mxn",
    suggestedAmounts: [50, 100, 200, 500, 1000],
    minAmount: 50,
    description:
      "Apoya el desarrollo de Casas Cripto. Las donaciones financian producto, cumplimiento regulatorio y expansión del marketplace.",
  },
  // Narrativa de inversión — usada en la sección "Invierte" del landing.
  // No constituye una oferta de valores; ver config.legal.disclaimer.
  investors: {
    contactEmail: "contactovoltixlabs@gmail.com",
    calendlyUrl: "", // agrega tu link de agenda cuando esté disponible
    deckUrl: "", // agrega el link al pitch deck (PDF/Notion) cuando esté disponible
    stage: "Pre-seed",
    highlights: [
      {
        label: "Mercado",
        value: "Real estate global + adopción cripto creciente",
      },
      {
        label: "Modelo",
        value: "Suscripción (SaaS) + comisión por cierre + token $CASA",
      },
      {
        label: "Tracción",
        value: "MVP funcional, auth, pagos y panel admin ya construidos",
      },
      {
        label: "Ronda",
        value: "Pre-seed abierta a inversionistas ángeles y fondos early-stage",
      },
    ],
  },
  // Roadmap del futuro token de utilidad $CASA. Es informativo/aspiracional:
  // su lanzamiento depende de validación legal y regulatoria.
  token: {
    ticker: "$CASA",
    name: "Casas Cripto Token",
    status: "En diseño — sujeto a marco legal y regulatorio",
    utility: [
      "Descuentos en comisiones de la plataforma",
      "Participación en gobernanza de futuras funciones",
      "Recompensas por referidos y actividad en el marketplace",
      "Acceso prioritario a nuevos listados premium",
    ],
    roadmap: [
      {
        phase: "Fase 1",
        title: "MVP & fundaciones",
        detail:
          "Plataforma web, autenticación, suscripciones y panel admin (completado).",
      },
      {
        phase: "Fase 2",
        title: "Marketplace de propiedades",
        detail:
          "Modelo de propiedad/listing, pagos cripto end-to-end y verificación KYC/AML.",
      },
      {
        phase: "Fase 3",
        title: "Ronda pre-seed",
        detail:
          "Captación de capital con inversionistas ángeles y fondos early-stage.",
      },
      {
        phase: "Fase 4",
        title: "Diseño y lanzamiento de $CASA",
        detail:
          "Tokenomics, auditoría de contratos y lanzamiento condicionado a cumplimiento regulatorio.",
      },
    ],
  },
  // Texto legal reutilizado en Footer, sección de inversión y token.
  legal: {
    disclaimer:
      "Casas Cripto es un proyecto en etapa de desarrollo (MVP). Las suscripciones y donaciones de esta página son pagos de producto/apoyo voluntario, no instrumentos financieros. Nada en este sitio constituye una oferta de venta de valores, asesoría de inversión o garantía de retornos. El token $CASA es un concepto en diseño: su existencia, características y lanzamiento dependen de validación legal y regulatoria, y podrían no concretarse.",
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links.
    // ⚠️ Keep this on the casascripto.com domain once it's verified in Resend
    // (gmail.com addresses can't be used as a custom "From" sender). The real
    // inbox the team monitors for replies/support is config.resend.supportEmail.
    fromNoReply: `Casas Cripto <noreply@casascripto.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Equipo Casas Cripto <equipo@casascripto.com>`,
    // Real inbox the team monitors — shown in Footer, FAQ, invest section, legal pages.
    supportEmail: "contactovoltixlabs@gmail.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Custom "elite fintech" theme defined in app/globals.css
    theme: "casascripto",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..).
    // HEX only — approximates the "casascripto" theme's gold primary color (see app/globals.css).
    main: "#E3BA5F",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    // Custom "elite fintech" sign-in page — see app/signin/page.js
    loginUrl: "/signin",
    callbackUrl: "/dashboard",
  },
};

export default config;
