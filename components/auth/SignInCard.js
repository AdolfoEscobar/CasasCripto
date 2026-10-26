"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import config from "@/config";

// Human-friendly copy for the error codes NextAuth appends to the callback URL
// (see https://authjs.dev/reference/core/types#signinpageerrorparam)
const ERROR_MESSAGES = {
  OAuthAccountNotLinked:
    "Ese correo ya está registrado con otro método de acceso. Prueba con el mismo método que usaste la primera vez.",
  EmailSignin:
    "No pudimos enviar el enlace de acceso. Verifica el correo e inténtalo de nuevo.",
  Verification:
    "El enlace de acceso venció o ya fue usado. Solicita uno nuevo.",
  AccessDenied: "No tienes permiso para acceder con esta cuenta.",
  Default: "Ocurrió un problema al iniciar sesión. Inténtalo de nuevo.",
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.14c-.22-.69-.35-1.42-.35-2.14s.13-1.45.35-2.14V7.02H2.18A10.97 10.97 0 0 0 1 12c0 1.77.42 3.45 1.18 4.98l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.02l3.66 2.84c.87-2.6 3.3-4.48 6.16-4.48z"
    />
  </svg>
);

const SignInCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const callbackUrl = searchParams.get("callbackUrl") || config.auth.callbackUrl;
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Already logged in? Skip the login screen entirely.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  useEffect(() => {
    if (urlError) {
      setErrorMsg(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default);
    }
  }, [urlError]);

  // Clicking "Continuar con Google" navigates away from this page while
  // loadingGoogle stays true. If the user then hits the browser's back
  // button, the page can be restored from the bfcache (back-forward cache)
  // with that exact frozen state — button stuck disabled, spinner forever,
  // no re-mount to reset it. `pageshow` fires on every page view, including
  // bfcache restores (event.persisted === true), so we use it to reset the
  // loading flags whenever the user lands back on this page.
  useEffect(() => {
    const resetLoadingState = () => {
      setLoadingGoogle(false);
      setLoadingEmail(false);
    };

    window.addEventListener("pageshow", resetLoadingState);
    return () => window.removeEventListener("pageshow", resetLoadingState);
  }, []);

  const handleGoogle = async () => {
    setErrorMsg("");
    setLoadingGoogle(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setErrorMsg(ERROR_MESSAGES.Default);
      setLoadingGoogle(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg("Ingresa un correo válido.");
      return;
    }

    setLoadingEmail(true);
    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg(ERROR_MESSAGES[res.error] || ERROR_MESSAGES.Default);
      } else {
        setEmailSent(true);
        toast.success("Enlace enviado. Revisa tu correo.");
      }
    } catch {
      setErrorMsg(ERROR_MESSAGES.Default);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-card glow-primary rounded-box p-8 sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold">
            Bienvenido a{" "}
            <span className="text-gradient-gold">{config.appName}</span>
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            Inicia sesión para gestionar tus propiedades e inversiones
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error mb-6 py-3 text-sm">
            <span>{errorMsg}</span>
          </div>
        )}

        {emailSent ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full badge-elite">
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <p className="font-semibold">Revisa tu correo</p>
            <p className="mt-1 text-sm text-base-content/60">
              Enviamos un enlace de acceso a{" "}
              <span className="font-medium text-base-content">{email}</span>.
              Ábrelo desde este mismo dispositivo para continuar.
            </p>
            <button
              className="btn btn-ghost btn-sm mt-6"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn btn-outline w-full border-base-content/20 gap-3 hover:border-primary/60"
              onClick={handleGoogle}
              disabled={loadingGoogle}
            >
              {loadingGoogle ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <GoogleIcon />
              )}
              Continuar con Google
            </button>

            <div className="divider text-xs text-base-content/40">
              o con tu correo
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              <label className="input input-bordered flex items-center gap-2 w-full focus-within:border-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-4 h-4 opacity-50 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  className="grow"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loadingEmail}
              >
                {loadingEmail ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Enviar enlace de acceso"
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-xs text-base-content/40">
          Al continuar aceptas nuestros{" "}
          <Link href="/tos" className="link link-hover">
            Términos
          </Link>{" "}
          y{" "}
          <Link href="/privacy-policy" className="link link-hover">
            Política de Privacidad
          </Link>
          .
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-base-content/50">
        <Link href="/" className="link link-hover">
          ← Volver al inicio
        </Link>
      </p>
    </div>
  );
};

export default SignInCard;
