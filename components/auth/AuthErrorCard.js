"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthModal } from "./AuthModalContext";
import { getAuthErrorMessage } from "./authErrors";
import config from "@/config";

// Tarjeta de app/auth/error: destino de los casos borde de NextAuth (OAuth
// denegado, magic link vencido/reusado). Muestra el mensaje amable del
// ?error= y ofrece reintentar abriendo el modal de login. Sin ?error=
// (visita directa) muestra un mensaje genérico con el mismo CTA.
const AuthErrorCard = () => {
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();
  const errorCode = searchParams.get("error");
  const message = errorCode
    ? getAuthErrorMessage(errorCode)
    : "Inicia sesión para continuar.";

  return (
    <div className="w-full max-w-md">
      <div className="glass-card glow-primary rounded-box p-8 sm:p-10 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-error/15 text-error ring-1 ring-error/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">
          No pudimos iniciar sesión
        </h1>
        <p role="alert" className="mt-3 text-sm text-base-content/70">
          {message}
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <button
            className="btn btn-primary w-full"
            onClick={() => openAuthModal(config.auth.callbackUrl)}
          >
            Intentar de nuevo
          </button>
          <Link href="/" className="btn btn-ghost w-full">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorCard;
