"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Garantiza que cada navegación aterrice arriba del todo de la página
// nueva. Se monta una sola vez en <AppShell/>, así cubre TODAS las rutas.
//
// - Navegación normal (push): scroll instantáneo a top + reafirmación
//   post-pintado. `behavior: "instant"` ignora el `scroll-behavior: smooth`
//   global, para que el reseteo no se vea como un "paseo" animado raro.
// - Atrás/adelante (popstate reciente): NO toca el scroll — el navegador
//   restaura la posición anterior, que es el comportamiento esperado ahí.
// - Anchors (/#pricing): si la URL destino trae hash, no interfiere — Next
//   hace el salto al anchor (con smooth + scroll-mt-20 de la sección).
//
// useLayoutEffect (no useEffect) para que el reseteo ocurra antes del
// pintado y no haya un flash de la posición vieja.
const ScrollToTop = () => {
  const pathname = usePathname();
  // Timestamp del último popstate: con expiración para que un atrás/adelante
  // SIN cambio de pathname (ej. entre anchors) no cancele el reseteo de una
  // navegación posterior.
  const popAt = useRef(0);

  useEffect(() => {
    const onPopState = () => {
      popAt.current = Date.now();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    const isPop = Date.now() - popAt.current < 800;
    popAt.current = 0;
    // Atrás/adelante o destino con hash: dejar que el navegador/Next manden.
    if (isPop || window.location.hash) return;

    const toTop = () =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    toTop();

    // Re-afirma tras el pintado: gana carreras contra restauración tardía,
    // scroll-anchoring por contenido que crece después del commit
    // (imágenes, fuentes, swaps de streaming en páginas dinámicas) y el
    // propio scroll de Next. Ventana corta (~120ms) para no pelear con el
    // scroll manual del usuario.
    let raf = 0;
    const t = setTimeout(toTop, 120);
    raf = requestAnimationFrame(() => requestAnimationFrame(toTop));
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
