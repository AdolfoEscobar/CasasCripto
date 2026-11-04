"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { SiweMessage } from "siwe";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
} from "wagmi";
import config from "@/config";
import MetaMaskIcon from "@/components/MetaMaskIcon";
import { getAuthErrorMessage } from "./authErrors";
import {
  METAMASK_DOWNLOAD_URL,
  classifyConnectError,
  hasInjectedProvider,
  resolveWalletConnector,
} from "@/libs/walletConnect";

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

// Formulario de login (Google + magic link + MetaMask) del <AuthModal/>
// global — la única UI de login de la app. initialCallbackUrl lo fija quien
// abre el modal y onClose lo cierra.
const SignInCard = ({ initialCallbackUrl = null, onClose = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const callbackUrl =
    initialCallbackUrl ||
    searchParams.get("callbackUrl") ||
    config.auth.callbackUrl;
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInstall, setShowInstall] = useState(false);

  // Already logged in? Close the modal and land on the callback URL.
  useEffect(() => {
    if (status === "authenticated") {
      onClose?.();
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router, onClose]);

  useEffect(() => {
    if (urlError) {
      setErrorMsg(getAuthErrorMessage(urlError));
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
      setLoadingWallet(false);
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
      setErrorMsg(getAuthErrorMessage());
      setLoadingGoogle(false);
    }
  };

  // Envío del magic link, separado del submit para reutilizarlo en el
  // botón "Reenviar" de la vista de éxito.
  const sendMagicLink = async () => {
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
        setErrorMsg(getAuthErrorMessage(res.error));
      } else {
        setEmailSent(true);
        toast.success("Enlace enviado. Revisa tu correo.");
      }
    } catch {
      setErrorMsg(getAuthErrorMessage());
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleEmail = (e) => {
    e.preventDefault();
    sendMagicLink();
  };

  // Login con wallet: conecta MetaMask, pide nonce, firma el mensaje SIWE y
  // entra con el proveedor "siwe" (ver libs/auth.js). Si el usuario rechaza
  // la firma o falla la verificación, se muestra error sin cerrar el modal.
  const handleWallet = async () => {
    setErrorMsg("");
    setShowInstall(false);
    setLoadingWallet(true);
    try {
      if (!hasInjectedProvider()) {
        setShowInstall(true);
        throw new Error("no-wallet");
      }
      const connector = await resolveWalletConnector(connectors);
      if (!connector) {
        setShowInstall(true);
        throw new Error("no-wallet");
      }

      let activeAddress = isConnected ? address : null;
      if (!activeAddress) {
        try {
          const result = await connectAsync({ connector });
          activeAddress = result?.accounts?.[0] || null;
        } catch (connectError) {
          console.error("connect wallet failed:", connectError);
          const kind = classifyConnectError(connectError);
          if (kind === "no-provider") setShowInstall(true);
          throw connectError;
        }
      }
      if (!activeAddress) {
        throw new Error("no-wallet");
      }

      const nonceRes = await fetch("/api/auth/siwe/nonce");
      if (!nonceRes.ok) {
        throw new Error("nonce");
      }
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address: activeAddress,
        statement: `Entrar a ${config.appName}`,
        uri: window.location.origin,
        version: "1",
        chainId: chainId || 1,
        nonce,
      });
      const prepared = message.prepareMessage();
      const signature = await signMessageAsync({ message: prepared });

      const res = await signIn("siwe", {
        // Se manda el texto firmado tal cual (siwe v3 ya no acepta JSON).
        message: prepared,
        signature,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg(getAuthErrorMessage(res.error));
        try {
          await disconnectAsync();
        } catch {
          // noop: la desconexión es mejor esfuerzo
        }
      }
      // Si no hay error, el efecto de `status === "authenticated"` cierra el
      // modal y navega al callbackUrl.
    } catch (e) {
      if (e?.message === "no-wallet") {
        setErrorMsg(
          "No detectamos una wallet en este navegador. Instala MetaMask e inténtalo de nuevo."
        );
      } else if (classifyConnectError(e) === "rejected") {
        setErrorMsg(
          "Aprobá la conexión y la firma en tu wallet para continuar."
        );
      } else if (classifyConnectError(e) === "no-provider") {
        setShowInstall(true);
        setErrorMsg(
          "No detectamos una wallet en este navegador. Instala MetaMask e inténtalo de nuevo."
        );
      } else {
        setErrorMsg(
          e?.shortMessage || e?.message || getAuthErrorMessage()
        );
      }
    } finally {
      setLoadingWallet(false);
    }
  };

  return (
    <div className="w-full">
      {/* Tarjeta sólida siempre, sin glass ni glow: el backdrop-blur y las
          sombras grandes son lo más caro para el GPU de iPhones viejos (ver
          AuthModal). */}
      <div className="rounded-box p-6 sm:p-10 relative bg-base-200 border border-base-content/15">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => onClose?.()}
          className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold">
            Bienvenido a{" "}
            <span className="text-gradient-gold">{config.appName}</span>
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            Accede o crea tu cuenta para gestionar tus propiedades e inversiones
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="alert alert-error mb-6 py-3 text-sm">
            <span>{errorMsg}</span>
          </div>
        )}
        {showInstall && !emailSent && (
          <a
            href={METAMASK_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline w-full mb-6 gap-3"
          >
            <span aria-hidden="true" className="flex">
              <MetaMaskIcon size={20} />
            </span>
            Instalar MetaMask
          </a>
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
            <p className="mt-3 text-xs text-base-content/50">
              ¿No lo ves? Revisa tu carpeta de spam o promociones.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={sendMagicLink}
                disabled={loadingEmail}
              >
                {loadingEmail ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Reenviar enlace"
                )}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Usar otro correo
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="btn btn-outline w-full border-base-content/20 gap-3 hover:border-primary/60"
              onClick={handleGoogle}
              disabled={loadingGoogle || loadingEmail || loadingWallet}
            >
              {loadingGoogle ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <GoogleIcon />
              )}
              Continuar con Google
            </button>

            <button
              className="btn btn-outline w-full border-base-content/20 gap-3 hover:border-primary/60 mt-3"
              onClick={handleWallet}
              disabled={loadingGoogle || loadingEmail || loadingWallet}
            >
              {loadingWallet ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <span aria-hidden="true" className="flex">
                  <MetaMaskIcon size={20} />
                </span>
              )}
              Continuar con MetaMask
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
                  aria-label="Correo electrónico"
                  className="grow text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="send"
                  required
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loadingEmail || loadingGoogle || loadingWallet}
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
    </div>
  );
};

export default SignInCard;
