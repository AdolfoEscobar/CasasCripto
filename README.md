# Casas Cripto — Inmobiliaria Cripto

**Casas Cripto** es un marketplace inmobiliario **elite** de propiedades que aceptan pago en criptomonedas. Conecta a propietarios/agentes crypto-friendly con compradores e **inversionistas** globales. Publicar un listado es **gratis** (plan Básico); Premium, los destacados y las donaciones son opcionales. El home sigue funcionando como pitch de producto/inversión: ronda pre-seed, roadmap del futuro token de utilidad (`$CASA`) y donaciones para apoyar el desarrollo. 🚀🏠

> Este repo nace sobre el boilerplate **ShipFast** (Next.js), se rebrandeó a Casas Cripto y hoy incluye un marketplace real (modelo `Property`, dashboard de propietario, revisión admin y páginas públicas SEO), más un rediseño de UI/UX ("elite fintech": obsidiana + oro + cian) y navegación lateral tipo marketplace.

## Stack técnico

- **Framework**: Next.js 16 (App Router) + React 19
- **Auth**: NextAuth v5 (beta) — Google OAuth + Email (magic link vía Resend) + adapter de MongoDB; página de login propia en `/signin`
- **Base de datos**: MongoDB con Mongoose (`User`, `Lead`, `Property`)
- **Pagos**: Stripe — Checkout + Customer Portal para Premium; Checkout de monto libre (`price_data`) para donaciones y para **destacar un listado**; donaciones on-chain (wallets placeholder)
- **Geo**: `country-state-city` + `i18n-iso-countries` **solo en servidor** (`libs/geo.js` → `/api/geo/*`)
- **Email**: Resend
- **IA**: Meta Model API (Muse Spark para copy, Muse Image para fotos, SAM 3.1 para revisión de privacidad) — botones en el dashboard (`PropertyManager.js` → `/api/ai/*`) y demo pública sin login en `/demo-ai` (→ `/api/ai/public/*`, con límite diario por IP). Sin `MODEL_API_KEY`, las rutas devuelven respuestas de muestra.
- **UI**: Tailwind CSS v4 + DaisyUI v5, tema custom `casascripto` (oro metálico + cian eléctrico + violeta sobre fondo obsidiana) en `app/globals.css`
- **Navegación**: sidebar global a la izquierda (`AppShell` + `Sidebar`) + header superior clásico en desktop (`Topbar`, con accesos rápidos y cuenta; en mobile es una barra compacta con logo + burger) en `app/layout.js` — no hay `Header` flotante legacy
- **Despliegue objetivo**: Vercel

## Estado actual del proyecto

✅ Implementado:

- Landing en español con copy propio (`app/page.js`): `Hero`, `Problem`, `MarketplacePreview`, `FeaturesAccordion`, `StatsSection`, `Pricing`, `TokenRoadmap`, `InvestAndDonate`, `FAQ`, `CTA`, `Footer`.
- Marketplace público: `/propiedades` (solo `published`, destacadas primero), ficha `/propiedades/[id]` (SEO + datos estructurados), páginas por ciudad `/propiedades/ciudad/[slug]` y `app/sitemap.js`.
- Modelo `Property` + APIs `/api/properties`, `/api/properties/mine`, `/api/properties/[id]`. Crear listado es gratis; queda en `pending` hasta que un admin lo aprueba o rechaza. El dueño edita desde el dashboard; un edit de una publicada/rechazada vuelve a `pending`.
- Dashboard de propietario (`app/(private)/(user)/dashboard` + `PropertyManager.js`): CRUD, selects de país/estado/ciudad, criptos aceptadas (USDC/USDT/BTC/ETH, informativo), URLs de imagen, destacar listado publicado, herramientas IA (redactar copy, generar foto, escanear privacidad).
- Demo pública de IA (`/demo-ai` → `/api/ai/public/*`, sin login, con límite diario por IP) y rate-limit diario por usuario/IP en las rutas autenticadas (`libs/aiRateLimit.js` + modelo `AiUsage`).
- Panel admin: usuarios (`app/api/admin/*`) y **revisión de propiedades** (`/admin/dashboard/properties`).
- Geo estandarizado: `/api/geo/countries`, `/states`, `/cities` (mercados LatAm + ES + US priorizados en el select de país).
- Inversión (`#invertir`): captura de leads (`<ButtonLead source="investor" />` → modelo `Lead`).
- Donaciones: USD vía Stripe (`<DonateButton />`) y cripto (`<CopyWalletAddress />`, direcciones **placeholder**).
- Destacados: pago único (`config.featuredListing`, p. ej. $15 / 7 días) vía `/api/stripe/create-featured-listing`; el webhook marca `featured` + `featuredUntil`.
- Planes en `config.stripe.plans`: **Básico gratis** (hasta 20 propiedades, sin tarjeta) y **Premium** ($99/mes, hasta 100, `hasAccess` vía Stripe). La tarjeta "Elite / Inversionistas" es CTA de contacto, no un Price de Stripe.
- Auth (Google + Email) con roles (`user`, `admin`, `editor`, `moderator`). Rutas privadas protegidas en `layout.js` (no hay `middleware.js`).
- Blog (`app/blog`) — 8 artículos propios en español (comprar/vender con cripto, legalidad e impuestos, stablecoins, seguridad, inversión LatAm, tokenización, tutorial de publicación), 5 categorías, sitemap del blog y JSON-LD (BlogPosting + FAQ + breadcrumbs).
- Legales (`/tos`, `/privacy-policy`) reescritos — **placeholder, no asesoría legal**.
- Roadmap informativo de `$CASA` + `config.legal.disclaimer` (no es oferta de valores).

🚧 Pendiente / no implementado todavía:

- Upload propio de imágenes (hoy son URLs externas).
- Cierre de venta en cripto **dentro** de la plataforma (escrow on-chain, KYC/AML). `cryptoAccepted`, `dealStatus` y `commissionRate` (1.5% por defecto) son informativos; no hay cobro automático al marcar `closed`.
- Token `$CASA`: no implementado, no se vende.
- Claves/Price IDs reales de Stripe: el `priceId` de Premium sigue siendo placeholder del template; en local las env de Stripe pueden estar comentadas.
- `MODEL_API_KEY` real de Meta Model API: sin ella, las rutas `/api/ai/*` devuelven respuestas de muestra (la UI es testeable sin clave).
- Wallets de `CopyWalletAddress.js` — reemplazar por tesorería/multisig reales antes de donaciones on-chain.
- Pitch deck, Calendly y métricas reales en `config.investors` (vacíos).
- Imágenes OG por artículo (hoy reutilizan la OG global) y algunos assets de marca aún genéricos del template.
- Componentes `Testimonials1.js`, `Testimonials3.js`, `Testimonials11.js`, `FeaturesGrid.js`, `FeaturesListicle.js` **no se usan**.

## Primeros pasos (desarrollo local)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Configura `.env.local` (lista completa y coordinada en [`.cursorrules`](.cursorrules)): requeridas `NEXTAUTH_SECRET`, `MONGODB_URI`, `RESEND_API_KEY`; opcionales `GOOGLE_ID`/`GOOGLE_SECRET` (login con Google), `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (para probar Premium, donaciones y destacados) y `MODEL_API_KEY` (para las herramientas IA con modelos reales en vez de respuestas de muestra).
3. Levanta el servidor:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000). Marketplace: [http://localhost:3000/propiedades](http://localhost:3000/propiedades). Panel: `/dashboard` (login en `/signin`).

## Convenciones de código

Las reglas de arquitectura, patrones y convenciones viven en [`.cursorrules`](.cursorrules) (resumen) y en [`claude-instructions.md`](claude-instructions.md) (guía extendida con ejemplos). Revísalos antes de agregar código: no dupliques el marketplace, no importes `country-state-city` en Client Components y no trates `hasAccess` como permiso para publicar.

¡Construyamos el futuro del real estate cripto! 🚀🏠💰
