"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import config from "@/config";
import { nextUrlTrigger } from "@/libs/authCta.mjs";

// Evento global para abrir el modal de login desde fuera de React (ej. el
// interceptor 401 de libs/api.js, que no puede usar hooks).
export const OPEN_AUTH_MODAL_EVENT = "casascripto:open-auth-modal";

export function requestAuthModal(callbackUrl) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPEN_AUTH_MODAL_EVENT, { detail: { callbackUrl } })
  );
}

const AuthModalContext = createContext(null);

// Estado global del modal de login. Vive dentro de <SessionProvider> (ver
// LayoutClient) para que el formulario pueda usar useSession().
export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState(config.auth.callbackUrl);

  const openAuthModal = useCallback((nextCallbackUrl) => {
    if (nextCallbackUrl) setCallbackUrl(nextCallbackUrl);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.callbackUrl) setCallbackUrl(e.detail.callbackUrl);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_AUTH_MODAL_EVENT, handler);
    return () => window.removeEventListener(OPEN_AUTH_MODAL_EVENT, handler);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{ isOpen, callbackUrl, openAuthModal, closeAuthModal }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}

// Puente para los redirects de servidor (los layouts privados no pueden
// abrir el modal: redirigen a /?auth=signin&callbackUrl=... y este
// componente lo abre al montar). Limpia la URL después para que recargar
// no reabra el modal. Debe renderizarse dentro del provider y en Suspense
// (usa useSearchParams).
export function AuthModalUrlTrigger() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const openedRef = useRef(false);

  useEffect(() => {
    const decision = nextUrlTrigger({
      authParam: searchParams.get("auth"),
      opened: openedRef.current,
    });
    openedRef.current = decision.opened;
    if (!decision.open) return;

    openAuthModal(searchParams.get("callbackUrl") || undefined);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    params.delete("callbackUrl");
    const qs = params.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
  }, [searchParams, pathname, router, openAuthModal]);

  return null;
}
