"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthModal } from "./auth/AuthModalContext";
import { ctaRendersLink } from "@/libs/authCta.mjs";

// CTA que requiere login ("Publicar gratis", "Listar mi propiedad"...).
// Úsalo en vez de un <Link> directo a páginas privadas: un Link crudo
// navega a /dashboard, rebota al home con ?auth=signin y abre el modal allá
// (sacando al usuario de donde estaba, y sin abrir nada al segundo click).
// En cambio esto: logueado → link normal al destino; invitado → abre el
// modal global EN EL LUGAR y al entrar cae directo en el destino.
const ButtonAuthCta = ({ href, className = "", children }) => {
  const router = useRouter();
  const { status } = useSession();
  const { openAuthModal } = useAuthModal();

  if (ctaRendersLink(status)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const handleClick = () => {
    if (ctaRendersLink(status)) {
      router.push(href);
    } else {
      openAuthModal(href);
    }
  };

  return (
    <button
      type="button"
      className={`${className} cursor-pointer`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default ButtonAuthCta;
