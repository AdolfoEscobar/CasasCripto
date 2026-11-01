"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import config from "@/config";

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
