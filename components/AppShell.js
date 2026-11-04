"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ScrollToTop from "./ScrollToTop";
import BackToTopButton from "./BackToTopButton";
import ButtonSignin from "./ButtonSignin";
import ButtonAccount from "./ButtonAccount";
import SearchBar from "./SearchBar";
import logo from "@/app/icon.png";
import config from "@/config";

// El logo móvil usa la misma tipografía display de los titulares (Sora vía
// `font-display`) que el sidebar y el footer — ver <Sidebar/>.

// Barra superior compacta, SOLO visible en mobile/tablet (<lg). Sustituye al
// antiguo burger del Header flotante: aquí solo abre/cierra el drawer que
// contiene el <Sidebar/>. Fondo sólido translúcido (no `glass-card`: esa
// clase pinta un borde completo que chocaba con el `border-b`).
const MobileTopbar = () => {
  const { status } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 lg:hidden px-4 py-2.5 bg-base-100/85 backdrop-blur-xl border-b border-base-content/10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => document.getElementById("app-sidebar")?.click()}
          className="btn btn-ghost btn-sm btn-circle shrink-0 min-w-[40px] min-h-[40px] ring-1 ring-primary/30 text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M4 7.5h16M4 12h9.5M4 16.5h13" />
          </svg>
        </button>

        <Link
          href="/"
          title={`${config.appName} homepage`}
          className="flex items-center gap-2 min-w-0"
        >
          <span className="relative flex items-center justify-center w-9 h-9 shrink-0 rounded-full ring-1 ring-primary/30 bg-base-100/60 overflow-hidden">
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-full h-full object-cover"
              priority
              width={36}
              height={36}
            />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-gradient-gold leading-tight whitespace-nowrap truncate">
            {config.appName}
          </span>
        </Link>

        {/* Lupa + cuenta arriba a la derecha. La lupa expande el buscador en
        una segunda fila (no cabe junto al logo en 360px). */}
        <span className="ml-auto shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
            aria-expanded={searchOpen}
            className="btn btn-ghost btn-sm btn-circle min-w-[40px] min-h-[40px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              {searchOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                />
              )}
            </svg>
          </button>
          {status === "authenticated" ? (
            <ButtonAccount compact />
          ) : (
            <ButtonSignin
              extraStyle="btn-primary btn-sm rounded-full min-h-[40px]"
              text="Entrar"
            />
          )}
        </span>
      </div>
      {searchOpen && (
        <div className="pt-2">
          <SearchBar autoFocus id="site-search-mobile" />
        </div>
      )}
    </div>
  );
};

// Shell global de navegación: sidebar fijo a la izquierda en desktop
// (siempre visible, vía `lg:drawer-open`) + header superior clásico
// (<Topbar/>, solo desktop) y drawer deslizable + topbar compacta en mobile.
// Se monta UNA sola vez en app/layout.js, así que es la única navegación de
// TODO el sitio — páginas individuales ya no renderizan su propio Header.
export default function AppShell({ children }) {
  const pathname = usePathname();

  // Cierra el drawer mobile automáticamente al cambiar de ruta (ej. al
  // tocar un link del sidebar en un teléfono).
  useEffect(() => {
    const el = document.getElementById("app-sidebar");
    if (el) el.checked = false;
  }, [pathname]);

  // Cierre por teclado con Escape (el overlay es pointer-only).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        const el = document.getElementById("app-sidebar");
        if (el) el.checked = false;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    // `relative z-10`: pinta toda la app (barras, sidebar, contenido) por
    // encima del <AmbientBackground/> global (fondo `fixed` sin z-index).
    <div className="drawer lg:drawer-open relative z-10">
      <ScrollToTop />
      <BackToTopButton />
      {/* Checkbox de estado del drawer (invisible): con nombre accesible
          para lectores de pantalla; el botón visible "Abrir menú" lo opera. */}
      <input
        id="app-sidebar"
        type="checkbox"
        className="drawer-toggle"
        aria-label="Mostrar u ocultar el menú de navegación"
      />

      <div className="drawer-content flex flex-col min-h-screen min-w-0">
        <MobileTopbar />
        <Topbar />
        {children}
      </div>

      <div className="drawer-side z-50">
        {/* Overlay pointer-only (default daisyUI): sin aria-label porque
            <label> no admite nombre accesible sin rol, y el rol está
            prohibido en label. El cierre por teclado es con Escape (ver
            efecto en <AppShell/>). */}
        <label htmlFor="app-sidebar" className="drawer-overlay"></label>
        <Sidebar />
      </div>
    </div>
  );
}
