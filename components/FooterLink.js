"use client";

import Link from "next/link";

// Link interno del footer que también sirve como "volver arriba": si ya
// estás en la URL destino (ej. "Ver todas" dentro del directorio de
// ciudades, o el logo en el home), en vez de navegar a la misma página
// hace scroll suave al inicio. Rutas distintas navegan normal (Next hace
// scroll-to-top solo). Server-renderiza como <a> clásico: SEO intacto.
const FooterLink = ({ href, className, title, children }) => (
  <Link
    href={href}
    className={className}
    {...(title ? { title } : {})}
    onClick={(e) => {
      try {
        if (window.location.pathname === href) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        // Sin window: deja navegar normal.
      }
    }}
  >
    {children}
  </Link>
);

export default FooterLink;
