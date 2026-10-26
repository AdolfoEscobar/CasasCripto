import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import SignInCard from "@/components/auth/SignInCard";
import logo from "@/app/icon.png";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Iniciar sesión | ${config.appName}`,
  canonicalUrlRelative: "/signin",
});

const trustPoints = [
  "Propiedades verificadas por nuestro equipo",
  "Pagos en USDC, USDT, BTC y ETH",
  "Panel para gestionar listados e inversiones",
];

// Split-screen, "elite fintech" login: brand/pitch panel on the left (hidden
// on mobile), the actual sign-in card on the right. Replaces the default
// NextAuth UI — see libs/auth.js (pages.signIn: "/signin").
export default function SignInPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-base-100">
      {/* Left: brand / pitch panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-base-200 p-12">
        {/* decorative grid pattern — isolated so its fade mask doesn't dim the content on top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-fade"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary/15 blur-3xl"
        />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            className="w-10"
            width={40}
            height={40}
            priority
          />
          <span className="font-extrabold text-lg">{config.appName}</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="badge badge-elite mb-4">
            Ronda {config.investors.stage}
          </p>
          <h2 className="text-3xl font-extrabold leading-tight">
            El real estate elite que ya opera en{" "}
            <span className="text-gradient-crypto">criptomonedas</span>.
          </h2>
          <p className="mt-5 text-base text-base-content/75">
            Conecta con propietarios crypto-friendly, compradores e
            inversionistas globales en una sola plataforma.
          </p>

          <ul className="mt-8 space-y-3">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full badge-elite">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-3 h-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </span>
                <span className="text-base-content/90">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-base-content/40">
          © {new Date().getFullYear()} {config.appName}. Todos los derechos reservados.
        </p>
      </div>

      {/* Right: sign-in card */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        {/* Logo on mobile, where the left panel is hidden */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-9"
              width={36}
              height={36}
              priority
            />
            <span className="font-extrabold">{config.appName}</span>
          </Link>
        </div>

        <Suspense fallback={null}>
          <SignInCard />
        </Suspense>
      </div>
    </main>
  );
}
