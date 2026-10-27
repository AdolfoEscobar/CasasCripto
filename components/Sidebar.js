"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Playfair_Display } from "next/font/google";
import {
  HomeIcon,
  BuildingOffice2Icon,
  NewspaperIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CircleStackIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import logo from "@/app/icon.png";
import config from "@/config";
import ButtonSignin from "./ButtonSignin";
import ButtonAccount from "./ButtonAccount";

// Misma tipografía "VIP" (Playfair Display itálica + degradado dorado) que
// usaba el Header flotante anterior, para que el rebranding del logo no
// cambie al migrar a navegación lateral.
const accentFont = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["600", "700"],
});

// Navegación principal del "producto": siempre visible, en todas las
// páginas (home, marketplace, blog), porque este sidebar es ahora la única
// navegación del sitio (reemplaza el Header/HeaderBlog flotantes).
const mainLinks = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/propiedades", label: "Propiedades", icon: BuildingOffice2Icon },
  // Demo pública (sin login) de Muse Spark/Image + SAM 3.1 — ver
  // app/demo-ai. Visible en la nav principal a propósito: es la forma más
  // rápida para un juez del hackathon (o alguien en redes) de probar la
  // integración de Meta Model API sin crear cuenta primero.
  { href: "/demo-ai", label: "Demo Meta AI", icon: CpuChipIcon },
  { href: "/blog", label: "Blog", icon: NewspaperIcon },
];

// Secciones de la landing de inversión — son anchors en "/", pero deben
// seguir siendo accesibles desde cualquier página (ej. desde /propiedades
// un inversionista debe poder llegar a "Invierte" sin volver manualmente al
// home primero).
const landingLinks = [
  { href: "/#features", label: "Características", icon: SparklesIcon },
  { href: "/#pricing", label: "Precios", icon: CurrencyDollarIcon },
  { href: "/#token", label: "Token $CASA", icon: CircleStackIcon },
  { href: "/#invertir", label: "Invierte", icon: ChartBarIcon },
  { href: "/#faq", label: "FAQ", icon: QuestionMarkCircleIcon },
];

// Enlaces de administración: solo se muestran a usuarios con role "admin" Y
// únicamente mientras navegan dentro de /admin/dashboard — evita que el
// sidebar público se infle con links de gestión irrelevantes para el resto
// de las páginas.
const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/dashboard/users", label: "Usuarios", icon: UsersIcon },
  {
    href: "/admin/dashboard/properties",
    label: "Propiedades",
    icon: BuildingOffice2Icon,
  },
];

function NavSectionLabel({ children }) {
  return (
    <p className="px-3.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">
      {children}
    </p>
  );
}

function NavLink({ href, label, icon: Icon, isActive, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={label}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 ${
        isActive
          ? "bg-primary/15 text-primary ring-1 ring-primary/25"
          : "text-base-content/75 hover:bg-base-content/5 hover:text-base-content"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// Sidebar izquierdo: navegación fija a la izquierda en desktop,
// complementado por el header superior (<Topbar/>, solo desktop). Se usa en
// absolutamente todas las páginas vía <AppShell/> en app/layout.js.
const Sidebar = () => {
  const pathname = usePathname();
  const { status } = useSession();
  const isAdminArea = pathname.startsWith("/admin");

  // Cierra el drawer en mobile al navegar. En desktop (lg:drawer-open) el
  // checkbox no controla visibilidad, así que esto no tiene efecto ahí.
  const closeDrawer = () => {
    const el = document.getElementById("app-sidebar");
    if (el) el.checked = false;
  };

  return (
    <div className="w-72 h-full flex flex-col bg-base-200/95 lg:bg-base-100/60 lg:backdrop-blur-xl border-r border-base-content/10">
      {/* Logo */}
      <Link
        href="/"
        onClick={closeDrawer}
        title={`${config.appName} homepage`}
        className="flex items-center gap-2.5 px-5 py-5 shrink-0 group"
      >
        <span className="relative flex items-center justify-center w-10 h-10 shrink-0 rounded-full ring-1 ring-primary/30 bg-base-100/60 overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:ring-primary/60">
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            className="w-full h-full object-cover"
            priority
            width={40}
            height={40}
          />
        </span>
        <span
          className={`${accentFont.className} italic text-xl tracking-wide text-gradient-gold leading-tight pb-1`}
        >
          {config.appName}
        </span>
      </Link>

      <div className="h-px bg-base-content/10 mx-5" />

      {/* Navegación (scrollable si no cabe en pantallas bajas) */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              isActive={
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href)
              }
              onNavigate={closeDrawer}
            />
          ))}
        </div>

        <div>
          <NavSectionLabel>Casas Cripto</NavSectionLabel>
          <div className="space-y-1">
            {landingLinks.map((link) => (
              <NavLink
                key={link.href}
                {...link}
                isActive={false}
                onNavigate={closeDrawer}
              />
            ))}
          </div>
        </div>

        {isAdminArea && (
          <div>
            <NavSectionLabel>Admin</NavSectionLabel>
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  isActive={pathname === link.href}
                  onNavigate={closeDrawer}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* CTA + cuenta, siempre anclados abajo. Los controles de cuenta
          son solo-mobile (`lg:hidden`): en desktop viven en el <Topbar/>
          superior. El menú abre hacia arriba (`direction="up"`) porque el
          botón está al fondo del viewport. */}
      <div className="p-4 border-t border-base-content/10 space-y-2.5 shrink-0">
        <Link
          href="/#invertir"
          onClick={closeDrawer}
          className="btn btn-sm btn-outline border-primary/40 text-primary hover:bg-primary/10 hover:border-primary rounded-full w-full"
        >
          Invertir
        </Link>
        <div className="lg:hidden">
          {status === "authenticated" ? (
            <div className="w-full [&>div>button]:w-full [&>div>button]:justify-between">
              <ButtonAccount direction="up" />
            </div>
          ) : (
            <ButtonSignin
              extraStyle="btn-primary btn-sm rounded-full glow-primary w-full"
              text="Entrar"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
