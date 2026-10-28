"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ScrollToTop from "./ScrollToTop";
import logo from "@/app/icon.png";
import config from "@/config";

// Misma tipografía "VIP" del logo en desktop (Playfair Display itálica +
// degradado dorado vía `text-gradient-gold`) para que el branding no cambie
// entre mobile y desktop. Ver <Sidebar/>.
const accentFont = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["600", "700"],
});

// Barra superior compacta, SOLO visible en mobile/tablet (<lg). Sustituye al
// antiguo burger del Header flotante: aquí solo abre/cierra el drawer que
// contiene el <Sidebar/>.
const MobileTopbar = () => (
  <div className="sticky top-0 z-30 lg:hidden flex items-center justify-start gap-3 px-4 py-3 glass-card border-b border-primary/15">
    <label
      htmlFor="app-sidebar"
      aria-label="Abrir menú"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          document.getElementById("app-sidebar")?.click();
        }
      }}
      className="btn btn-ghost btn-sm btn-circle shrink-0 min-w-[40px] min-h-[40px] ring-1 ring-primary/30 text-primary"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          d="M4 7.5h16M4 12h9.5M4 16.5h13"
        />
      </svg>
    </label>

    <Link href="/" title={`${config.appName} homepage`} className="flex items-center gap-2">
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
      <span
        className={`${accentFont.className} italic text-lg tracking-wide text-gradient-gold leading-tight whitespace-nowrap pb-1`}
      >
        {config.appName}
      </span>
    </Link>
  </div>
);

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

  return (
    // `relative z-10`: pinta toda la app (barras, sidebar, contenido) por
    // encima del <AmbientBackground/> global (fondo `fixed` sin z-index).
    <div className="drawer lg:drawer-open relative z-10">
      <ScrollToTop />
      <input id="app-sidebar" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen min-w-0">
        <MobileTopbar />
        <Topbar />
        {children}
      </div>

      <div className="drawer-side z-50">
        <label
          htmlFor="app-sidebar"
          aria-label="Cerrar menú"
          className="drawer-overlay"
        ></label>
        <Sidebar />
      </div>
    </div>
  );
}
