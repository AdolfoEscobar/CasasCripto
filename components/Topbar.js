"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import ButtonSignin from "./ButtonSignin";
import ButtonAccount from "./ButtonAccount";

// Header superior clásico, SOLO visible en desktop (lg+). Complementa al
// sidebar izquierdo: accesos rápidos a las secciones clave a la izquierda y
// controles de cuenta a la derecha. En mobile/tablet la navegación superior
// la da <MobileTopbar/> (logo + burger) dentro de AppShell.
const quickLinks = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/demo-ai", label: "Demo Meta AI" },
  { href: "/blog", label: "Blog" },
  { href: "/#pricing", label: "Planes" },
  { href: "/#invertir", label: "Invierte" },
];

const Topbar = () => {
  const pathname = usePathname();
  const { status } = useSession();

  return (
    <div className="sticky top-0 z-30 hidden lg:flex items-center justify-between gap-4 px-6 py-3 bg-base-100/85 backdrop-blur-xl border-b border-base-content/10">
      <nav className="flex items-center gap-1 text-sm font-medium">
        {quickLinks.map((link) => {
          const isActive =
            !link.href.includes("#") && pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 transition-colors duration-200 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-base-content/70 hover:text-base-content hover:bg-base-content/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 shrink-0">
        {status === "authenticated" ? (
          <ButtonAccount />
        ) : (
          <ButtonSignin
            extraStyle="btn-primary btn-sm rounded-full glow-primary min-h-[40px]"
            text="Entrar"
          />
        )}
      </div>
    </div>
  );
};

export default Topbar;
