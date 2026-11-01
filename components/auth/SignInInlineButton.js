"use client";

import { useAuthModal } from "./AuthModalContext";
import config from "@/config";

// Trigger de login para usar dentro de texto (ej. tutoriales del blog):
// se ve como un link pero abre el modal global en vez de navegar.
const SignInInlineButton = ({ children, className = "" }) => {
  const { openAuthModal } = useAuthModal();

  return (
    <button
      type="button"
      className={`${className} cursor-pointer`}
      onClick={() => openAuthModal(config.auth.callbackUrl)}
    >
      {children}
    </button>
  );
};

export default SignInInlineButton;
