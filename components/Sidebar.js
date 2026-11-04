"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  MapPinIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import logo from "@/app/icon.png";
import config from "@/config";
import SocialIcons from "./SocialIcons";
import ButtonAuthCta from "./ButtonAuthCta";
import { topCities } from "@/libs/geoDirectory.mjs";
import { cityUrl } from "@/libs/propertyUrls.mjs";

// El logo usa la misma tipografía display de los titulares (Sora vía
// `font-display`) — el degradado dorado es el diferenciador de marca,
// no una tercera familia tipográfica.

// Navegación principal del "producto": siempre visible, en todas las
// páginas (home, marketplace, blog), porque este sidebar es ahora la única
// navegación del sitio (reemplaza el Header/HeaderBlog flotantes).
const mainLinks = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/propiedades", label: "Propiedades", icon: BuildingOffice2Icon },
  { href: "/propiedades/ciudad", label: "Ciudades", icon: MapPinIcon },
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
  // PLANES OCULTOS (temporal, hasta tracción):
  // { href: "/#pricing", label: "Planes", icon: CurrencyDollarIcon },
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
  {
    href: "/admin/dashboard/deals",
    label: "Deals escrow",
    icon: CurrencyDollarIcon,
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
  const { data: session } = useSession();
  const isAdminArea = pathname.startsWith("/admin");

  // Cierra el drawer en mobile al navegar. En desktop (lg:drawer-open) el
  // checkbox no controla visibilidad, así que esto no tiene efecto ahí.
  const closeDrawer = () => {
    const el = document.getElementById("app-sidebar");
    if (el) el.checked = false;
  };

  // Solo UN link activo: gana la coincidencia más específica. Sin esto, en
  // /propiedades/ciudad se resaltaban "Propiedades" y "Ciudades" a la vez
  // (ambos hacen startsWith). "/" solo activa en el home exacto.
  const activeMainHref = mainLinks
    .filter((link) =>
      link.href === "/" ? pathname === "/" : pathname.startsWith(link.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="w-72 max-w-[85vw] h-full flex flex-col bg-base-200/95 lg:bg-base-100/60 lg:backdrop-blur-xl border-r border-base-content/10">
      {/* Logo */}
      <Link
        href="/"
        onClick={closeDrawer}
        title={`${config.appName} homepage`}
        className="flex items-center gap-2.5 px-5 py-5 shrink-0"
      >
        <span className="relative flex items-center justify-center w-10 h-10 shrink-0 rounded-full ring-1 ring-primary/30 bg-base-100/60 overflow-hidden">
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            className="w-full h-full object-cover"
            priority
            width={40}
            height={40}
          />
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight text-gradient-gold leading-tight">
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
              isActive={link.href === activeMainHref}
              onNavigate={closeDrawer}
            />
          ))}
        </div>

        {/* Acceso directo principal: publicar (abre login si no hay sesión,
            va al panel si la hay). */}
        <div>
          <ButtonAuthCta
            href={config.auth.callbackUrl}
            className="btn btn-primary w-full rounded-xl"
          >
            + Publicar propiedad
          </ButtonAuthCta>
        </div>

        {/* Cuenta: Mi panel siempre visible. Invitado → abre el login en el
            lugar y cae en /dashboard; logueado → link normal con activo.
            El wrapper cierra el drawer en móvil en ambos casos. */}
        <div>
          <NavSectionLabel>Cuenta</NavSectionLabel>
          <div className="space-y-1" onClick={closeDrawer}>
            <ButtonAuthCta
              href="/dashboard"
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 w-full text-left ${
                pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                  ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                  : "text-base-content/75 hover:bg-base-content/5 hover:text-base-content"
              }`}
            >
              <Squares2X2Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">Mi panel</span>
            </ButtonAuthCta>
          </div>
        </div>

        {/* Interlinking sitewide: las ciudades top en TODAS las páginas
            reparten PageRank interno. Plegado para no alargar el sidebar
            (los links igual están en el DOM para crawlers). */}
        <details className="group">
          <summary className="cursor-pointer px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/40 list-none flex items-center justify-between rounded-xl hover:bg-base-content/5">
            Ciudades populares
            <span className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="mt-1 space-y-0.5">
            {topCities.map((c) => (
              <Link
                key={`${c.stateSlug}/${c.citySlug}`}
                href={cityUrl(c.stateSlug, c.citySlug)}
                onClick={closeDrawer}
                className="block rounded-lg px-3.5 py-1.5 text-sm text-base-content/75 hover:bg-base-content/5 hover:text-base-content"
              >
                {c.city}
              </Link>
            ))}
            <Link
              href="/propiedades/ciudad"
              onClick={closeDrawer}
              className="block rounded-lg px-3.5 py-1.5 text-sm font-medium text-primary hover:bg-base-content/5"
            >
              Ver todas →
            </Link>
          </div>
        </details>

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

        {isAdminArea && session?.user?.role === "admin" && (
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

      {/* CTA siempre anclado abajo. La cuenta vive en las barras
          superiores (Topbar en desktop, MobileTopbar en móvil), no aquí —
          un solo lugar para abrir el menú en todos los tamaños. */}
      <div className="p-4 border-t border-base-content/10 shrink-0">
        <Link
          href="/#invertir"
          onClick={closeDrawer}
          className="btn btn-sm btn-outline border-primary/40 text-primary hover:bg-primary/10 hover:border-primary rounded-full w-full min-h-[40px]"
        >
          Invertir
        </Link>
        <div className="mt-1 flex items-center justify-center">
          <SocialIcons />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
