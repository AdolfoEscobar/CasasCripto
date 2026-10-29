"use client";

import { useEffect, useState } from "react";

// Botón flotante "volver arriba": círculo abajo a la derecha, disponible en
// TODAS las páginas (se monta una vez en <AppShell/>). Aparece con fade
// después de bajar 500px y lleva arriba con scroll suave — o instantáneo si
// el usuario prefiere movimiento reducido.
const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      className={`fixed z-40 btn btn-circle btn-primary shadow-lg transition-all duration-300 right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    </button>
  );
};

export default BackToTopButton;
