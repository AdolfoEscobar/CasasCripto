# Claude Instructions for Casas Cripto - Inmobiliaria con Criptomonedas

## Project Context

You are working on **Casas Cripto**, a modern real estate **marketplace** focused on properties that accept cryptocurrency payments. It connects crypto-friendly property owners/agents with buyers **and investors**. Listing is **free by default** (plan Básico); Premium is optional for higher listing caps. The marketing home is still an investor-facing pitch (pre-seed, future `$CASA` token, donations). The product now also includes a real property catalog, owner dashboard, admin moderation, Stripe (subscriptions + donations + featured listings), AI listing tools (Meta Model API: Muse Spark copy, Muse Image photos, SAM 3.1 privacy scan — dashboard + public `/demo-ai`, with sample-response fallbacks when `MODEL_API_KEY` is unset), and a premium dark "elite fintech" UI (gold / cyan / violet on obsidian).

### Technology Stack
- **Frontend**: Next.js 16 with App Router, React 19, Tailwind CSS v4, DaisyUI v5 with a custom `casascripto` theme
- **Backend**: Next.js API Routes, NextAuth v5 (beta), MongoDB with Mongoose
- **Payments & monetization**: listing does **not** require Stripe/`hasAccess`. Plan Básico is free (`config.stripe.plans` `isFree: true`, sentinel `priceId` `price_free_basico`, `maxProperties: 20`). Premium is Stripe Checkout `subscription` + Customer Portal (`maxProperties: 100`). One-time Checkout with inline `price_data` for **donations** (`createDonationCheckout`) and **featured listings** (`createFeaturedListingCheckout`, `config.featuredListing`). On-chain donations via placeholder wallets in `components/CopyWalletAddress.js`. Property `cryptoAccepted` is informational — sale settlement is still off-platform.
- **Email**: Resend for transactional emails (magic links, notifications)
- **AI listing tools**: Meta Model API (`libs/metaModel.js`) — Muse Spark (`/api/ai/listing-copy`), Muse Image (`/api/ai/listing-image`), SAM 3.1 (`/api/ai/privacy-scan`), each with a stricter public variant under `/api/ai/public/*` for the no-login `/demo-ai`. Daily per-user/per-IP rate limits via `libs/aiRateLimit.js` + `models/AiUsage.js`. Without `MODEL_API_KEY` every route returns a sample response, so the UI is testable with no key.
- **Authentication**: NextAuth with Google OAuth and Email (magic link) providers, JWT sessions carrying a `role` (`user`, `admin`, `editor`, `moderator`). Custom sign-in page at `/signin` (`pages.signIn` in `libs/auth.js`).
- **Navigation**: global `AppShell` + left `Sidebar` mounted in `app/layout.js`. No `Header.js` / `HeaderBlog`.
- **Deployment**: Optimized for Vercel deployment

### Design system — read before touching any landing component
The whole marketing site was redesigned around a single custom DaisyUI theme called **`casascripto`**, defined with `@plugin "daisyui/theme"` in `app/globals.css`:
- Base: deep obsidian/navy (`--color-base-100/200/300`)
- Primary: metallic gold (confidence, money, elite feel)
- Secondary: electric cyan (crypto/tech feel)
- Accent: electric violet (Web3/innovation)
- Helper utility classes already defined in `globals.css` — reuse them instead of re-inventing styles: `.text-gradient-gold`, `.text-gradient-crypto`, `.glass-card`, `.glow-primary` / `.glow-secondary`, `.bg-grid-fade`, `.badge-elite`.
- `config.colors.theme` is `"casascripto"`; `config.colors.main` is a plain hex approximation of the gold primary (used for `NextTopLoader` and the browser `theme-color` meta tag — these can't consume CSS custom properties, so keep it a literal hex, not `hsl(var(--p))`).

### Current Project State — read this before building features
This codebase started from the ShipFast Next.js boilerplate, was rebranded into Casas Cripto, had its **landing redesigned** as an investor pitch, and now has a **working property marketplace**. Do not recreate listing CRUD, public catalog pages, geo selects, or the sidebar.

- ✅ **Implemented**:
  - Landing in Spanish at `app/page.js`: `Hero`, `Problem`, `MarketplacePreview` (home teaser — the real catalog is `/propiedades`), `FeaturesAccordion`, `StatsSection`, `Pricing` (free Básico + paid Premium + "Elite / Inversionistas" contact card), `TokenRoadmap`, `InvestAndDonate` (`#invertir` / `#donar`), `FAQ`, `CTA`, `Footer`.
  - Custom sign-in at `app/signin` (`SignInCard`).
  - Auth with roles; user dashboard `app/(private)/(user)/dashboard` with `PropertyManager.js` (create/edit/delete listings, featured-listing checkout).
  - Admin RBAC `app/(private)/admin/dashboard` + user API `app/api/admin/*` + property review UI `app/(private)/admin/dashboard/properties`.
  - **`models/Property.js`**: `owner`, `title`, `description`, structured `city` / `state` / `country` (+ auto `citySlug`), optional `location`, `price`, `currency`, `cryptoAccepted[]`, `images[]` (URLs), contact fields, moderation `status` (`pending` | `published` | `rejected`) + `rejectionReason`, commercial `dealStatus` (`active` | `under_offer` | `closed`), `commissionRate` (default 1.5%, not billed yet), `featured` / `featuredUntil`.
  - Public marketplace: `/propiedades` (published, featured first), `/propiedades/[id]` (SEO + JSON-LD), `/propiedades/ciudad/[slug]` (programmatic SEO even for empty cities), `app/sitemap.js`.
  - APIs: `GET/POST /api/properties` (GET public published by default; non-published requires admin), `GET /api/properties/mine`, `PATCH/DELETE /api/properties/[id]` (owner can edit content — published/rejected go back to pending; owner can set `dealStatus` without re-review; admin sets status), `/api/geo/countries|states|cities`.
  - Stripe: `create-checkout`, `create-portal`, `create-donation`, `create-featured-listing`; webhook grants Premium `hasAccess` **or** sets `featured`/`featuredUntil` when `metadata.type === "featured_listing"`.
  - Blog `app/blog` (index copy updated); legal `/tos` and `/privacy-policy`; `/api/lead` persists to `Lead` (`source`: free-form string, default `"waitlist"` — e.g. `"investor"` from `<ButtonLead source="investor" />`).
  - AI listing tools in the owner dashboard (`PropertyManager.js` buttons → `/api/ai/*`) + public no-login demo `/demo-ai` (`DemoAIClient.js` → `/api/ai/public/*`); `libs/metaModel.js` (sample fallback without key), `libs/aiRateLimit.js` + `models/AiUsage.js` (daily per-user/IP counters).
- 🚧 **Not implemented yet**: native image upload/CDN; on-chain escrow or in-app crypto payment to close a sale; automatic commission invoice when a deal is marked `closed`; KYC/AML; `$CASA` token (no contracts, no sale).
- ⚠️ **Known placeholders**: dummy wallets in `CopyWalletAddress.js`; empty `config.investors.deckUrl` / `calendlyUrl`; Premium Stripe `priceId` is still a ShipFast/template placeholder; Stripe env keys may be unset locally; `MODEL_API_KEY` unset → AI routes return sample responses; `app/blog/_assets/content.js` is still ShipFast tutorials; unused leftovers `Testimonials1.js`, `Testimonials3.js`, `Testimonials11.js`, `FeaturesGrid.js`, `FeaturesListicle.js`, `libs/gpt.js` (dead code — nothing imports it).
- Listing rules already encoded — keep them: publish is free; cap via `maxProperties`; only `published` is public; geo fields come from `/api/geo/*` (do **not** import `country-state-city` in Client Components — it would balloon the bundle; `libs/geo.js` is server-only).
- `$CASA` is narrative only (`config.token`). New copy must match `config.legal.disclaimer`.
- Do **not** re-comment out `/api/lead`.
- There is **no `middleware.js`**. Protect routes in server layouts with `auth()` + `redirect()`. Next.js 16: `params` in dynamic route handlers is a Promise (`const { id } = await params`).

## Core Principles

### 1. Consistency First
- Follow existing patterns in the codebase
- Use the same naming conventions and file structures
- Maintain the established component architecture
- Always check existing implementations before creating new ones

### 2. User Experience Priority
- Implement proper loading states for all async operations
- Provide clear error messages and feedback
- Ensure responsive design across all screen sizes
- Include accessibility features (ARIA labels, semantic HTML)

### 3. Security & Best Practices
- Validate all inputs in API routes
- Use environment variables for sensitive data
- Implement proper error handling with try-catch blocks
- Follow Next.js security best practices

### 4. Performance Optimization
- Use Server Components by default, Client Components only when needed
- Implement proper image optimization with Next.js Image
- Minimize bundle size and optimize database queries
- Use appropriate caching strategies

## File Structure & Organization

This reflects the actual current structure of the repo (not a generic template):

```
CasasCripto/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── admin/                 # Admin users + dashboard stats
│   │   ├── properties/            # Public list + create; [id] PATCH/DELETE; mine/
│   │   ├── geo/                   # countries, states, cities (server-only geo data)
│   │   ├── lead/                  # Lead capture — persists to Lead
│   │   ├── stripe/                # create-checkout, create-portal, create-donation, create-featured-listing
│   │   ├── ai/                    # listing-copy, listing-image, privacy-scan (+ public/* for /demo-ai)
│   │   └── webhook/stripe/        # Subscriptions + featured_listing metadata
│   ├── (private)/
│   │   ├── (user)/dashboard/      # Owner panel + PropertyManager.js
│   │   └── admin/dashboard/       # Admin home, users, properties moderation
│   ├── propiedades/               # Marketplace: index, [id], ciudad/[slug]
│   ├── demo-ai/                   # Public no-login Meta AI demo (DemoAIClient.js)
│   ├── signin/                    # Custom elite sign-in
│   ├── blog/, privacy-policy/, tos/
│   ├── sitemap.js
│   └── page.js, layout.js         # Landing + global AppShell
├── components/
│   ├── AppShell.js, Sidebar.js    # Site-wide navigation (replaces Header)
│   ├── Hero.js, Problem.js, MarketplacePreview.js, FeaturesAccordion.js,
│   │   StatsSection.js, Pricing.js, TokenRoadmap.js, InvestAndDonate.js,
│   │   FAQ.js, CTA.js, Footer.js
│   ├── PropertyCard.js, VerifiedBadge.js
│   ├── DonateButton.js, CopyWalletAddress.js
│   ├── ButtonCheckout.js, ButtonLead.js, ButtonSignin.js, ButtonAccount.js
│   ├── auth/SignInCard.js
│   ├── admin/, common/, forms/
│   └── Testimonials*.js, FeaturesGrid.js, FeaturesListicle.js  # unused leftovers
├── libs/                          # auth, mongoose, mongo, stripe, resend, api, seo, geo, slugify, leanToJSON, metaModel, aiRateLimit (+ gpt — unused ShipFast leftover)
├── models/                        # User.js, Lead.js, Property.js, AiUsage.js
└── config.js                      # plans (incl. isFree/maxProperties), featuredListing, donations, investors, token, legal, colors, auth
```

> Notes:
> - There is no top-level `auth.js`; NextAuth lives in `libs/auth.js` (`auth`, `signIn`, `signOut`, `handlers`).
> - There is **no `middleware.js`**. Protect new private routes with a server `layout.js` that calls `auth()` and `redirect()`, same as `app/(private)/(user)/dashboard/layout.js` and `app/(private)/admin/dashboard/layout.js`.
> - Do not add a floating `Header` — navigation is only `AppShell`/`Sidebar`.

## Coding Standards

### Component Development

#### Server Components (Default)
```javascript
// app/example/page.js
import { auth } from "@/libs/auth";
import config from "@/config";

export default async function ExamplePage() {
  const session = await auth();
  
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold">
        Welcome to {config.appName}
      </h1>
      {session?.user && (
        <p>Hello, {session.user.name}!</p>
      )}
    </div>
  );
}

// Add metadata for SEO
export const metadata = {
  title: "Example Page - Casas Cripto",
  description: "Example page description",
};
```

#### Client Components
```javascript
// components/ExampleComponent.js
"use client";

import { useState } from "react";
import apiClient from "@/libs/api";
import { toast } from "react-hot-toast";

const ExampleComponent = ({ initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(initialData);

  const handleAction = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiClient.post("/api/example", { data });
      setData(response.data);
      toast.success("Action completed successfully!");
    } catch (error) {
      console.error("Action failed:", error);
      toast.error(error?.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Example Component</h2>
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary"
            onClick={handleAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Perform Action"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExampleComponent;
```

### API Route Development

#### Standard API Route Pattern
```javascript
// app/api/example/route.js
import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req) {
  try {
    // Authentication check (if required)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Input validation
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Required field is missing" },
        { status: 400 }
      );
    }

    // Database connection
    await connectMongo();

    // Business logic
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Perform operations
    const result = await performOperation(body, user);

    // Return success response
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function
async function performOperation(data, user) {
  // Implementation here
  return { message: "Operation completed" };
}
```

### Database Model Development

#### Mongoose Schema Pattern
```javascript
// models/ExampleModel.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const exampleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
exampleSchema.index({ userId: 1, status: 1 });
exampleSchema.index({ createdAt: -1 });

// Virtual fields
exampleSchema.virtual("isActive").get(function() {
  return this.status === "active";
});

// Instance methods
exampleSchema.methods.activate = function() {
  this.status = "active";
  return this.save();
};

// Static methods
exampleSchema.statics.findByUser = function(userId) {
  return this.find({ userId, status: "active" });
};

// Plugins
exampleSchema.plugin(toJSON);

export default mongoose.models.ExampleModel || 
  mongoose.model("ExampleModel", exampleSchema);
```

## Authentication Patterns

### Protecting Pages
```javascript
// app/(private)/(user)/dashboard/page.js
import { auth } from "@/libs/auth";
import { redirect } from "next/navigation";
import config from "@/config";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect(config.auth.loginUrl);
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

### Route Protection via Server Component Layouts (current pattern — no `middleware.js` in this repo)
```javascript
// app/(private)/admin/dashboard/layout.js
import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";

export default async function LayoutAdminPrivate({ children }) {
  const session = await auth();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  if (session.user.role !== "admin") {
    redirect(config.auth.callbackUrl);
  }

  return <>{children}</>;
}
```
Use this same pattern (a server component `layout.js` that calls `auth()` and `redirect()`) for any new protected route group, instead of adding a top-level `middleware.js`, unless there's a specific reason to switch to edge middleware.

## Stripe Integration Patterns

### Payment Button Component
```javascript
// components/PaymentButton.js
"use client";

import { useState } from "react";
import apiClient from "@/libs/api";
import config from "@/config";

const PaymentButton = ({ priceId, planName }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/stripe/create-checkout", {
        priceId,
        mode: "subscription",
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/#pricing`,
      });

      window.location.href = response.url;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="btn btn-primary w-full"
      onClick={handlePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        `Get ${planName}`
      )}
    </button>
  );
};

export default PaymentButton;
```

### Webhook Handler
```javascript
// app/api/webhook/stripe/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import Property from "@/models/Property";
import { findCheckoutSession } from "@/libs/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    // Next.js 16: headers() is async
    const signature = (await headers()).get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    await connectMongo();

    switch (event.type) {
      case "checkout.session.completed":
        // Featured listings use price_data + metadata, not a Price id
        if (event.data.object.metadata?.type === "featured_listing") {
          await handleFeaturedListing(event.data.object);
          break;
        }
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(sessionObject) {
  // line_items are NOT expanded on the event object — re-fetch like the real
  // webhook does (see app/api/webhook/stripe/route.js)
  const session = await findCheckoutSession(sessionObject.id);
  const user = await User.findById(sessionObject.client_reference_id);
  if (user) {
    user.customerId = session.customer;
    user.priceId = session?.line_items?.data[0]?.price.id;
    user.hasAccess = true;
    await user.save();
  }
}

async function handleSubscriptionDeleted(subscription) {
  const user = await User.findOne({ customerId: subscription.customer });
  if (user) {
    user.hasAccess = false;
    await user.save();
  }
}

async function handleFeaturedListing(session) {
  const { propertyId, days } = session.metadata;
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + (parseInt(days, 10) || 7));
  await Property.findByIdAndUpdate(propertyId, {
    featured: true,
    featuredUntil,
  });
}
```

## UI/UX Best Practices

### Loading States
```javascript
// Always provide loading feedback
{isLoading ? (
  <div className="flex items-center gap-2">
    <span className="loading loading-spinner loading-sm"></span>
    Processing...
  </div>
) : (
  <span>Submit</span>
)}
```

### Error Handling
```javascript
// Use toast notifications for user feedback
import { toast } from "react-hot-toast";

try {
  await apiCall();
  toast.success("Operation completed successfully!");
} catch (error) {
  toast.error(error?.response?.data?.error || "Something went wrong");
}
```

### Form Patterns
```javascript
// components/ContactForm.js
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          className="input input-bordered"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Message</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
        />
      </div>
      
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
};

export default ContactForm;
```

## Configuration Management

### Using Config Throughout the App
```javascript
// Always import and use the centralized config
import config from "@/config";

// Access app settings
const appName = config.appName;
const domain = config.domainName;
const stripePublicKey = config.stripe.plans[0].priceId;

// Use in components
<title>{`${pageTitle} - ${config.appName}`}</title>
<meta name="description" content={config.appDescription} />
```

### Environment Variables
```javascript
// Always validate required environment variables
if (!process.env.REQUIRED_VAR) {
  throw new Error("REQUIRED_VAR environment variable is not set");
}
```

Coordinated with `.cursorrules` — required: `NEXTAUTH_SECRET`, `MONGODB_URI`, `RESEND_API_KEY`. Optional: `GOOGLE_ID`/`GOOGLE_SECRET` (Google OAuth), `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (payments only — the app runs without them), `MODEL_API_KEY` (Meta AI tools, else sample responses). Not used: `NEXTAUTH_URL`, `STRIPE_PUBLIC_KEY`, `OPENAI_API_KEY` (see `.cursorrules` for why).

## Testing Considerations

### API Route Testing
```javascript
// Test API routes with proper error handling
const testApiRoute = async () => {
  const response = await fetch("/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: true }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};
```

## Common Pitfalls to Avoid

1. **Don't use Client Components unnecessarily** - Use Server Components by default
2. **Always handle loading states** - Users should know when operations are in progress
3. **Validate inputs** - Never trust user input, validate on both client and server
4. **Don't hardcode values** - Use the config file for app-wide settings
5. **Handle errors gracefully** - Provide meaningful error messages to users
6. **Don't forget database connections** - Always call `connectMongo()` before database operations
7. **Use absolute imports** - Prefer `@/` imports over relative paths
8. **Follow naming conventions** - Maintain consistency with existing codebase

## Deployment Checklist

Before deploying:
- [ ] All environment variables are set
- [ ] Stripe webhooks are configured
- [ ] MongoDB connection is established
- [ ] NextAuth domain is configured
- [ ] Email provider is set up
- [ ] Build process completes without errors
- [ ] All API routes are tested
- [ ] Payment flow is tested with Stripe test mode

Remember: Always prioritize user experience, maintain consistency with existing patterns, and ensure robust error handling throughout the application. 