"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import logo from "@/app/icon.png";
import config from "@/config";

// Barra superior compacta, SOLO visible en mobile/tablet (<lg). Sustituye al
// antiguo burger del Header flotante: aquí solo abre/cierra el drawer que
// contiene el <Sidebar/>.
const MobileTopbar = () => (
  <div className="sticky top-0 z-30 lg:hidden flex items-center justify-between gap-3 px-4 py-3 glass-card border-b border-primary/15">
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
      <span className="font-extrabold text-base">{config.appName}</span>
    </Link>

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
      className="btn btn-ghost btn-sm btn-circle min-w-[40px] min-h-[40px]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </label>
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
    <div className="drawer lg:drawer-open">
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
