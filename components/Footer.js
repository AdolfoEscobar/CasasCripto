import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import config from "@/config";
import logo from "@/app/icon.png";

// Misma tipografía "VIP" del logo (Playfair Display itálica + degradado
// dorado vía `text-gradient-gold`) que el sidebar y el topbar móvil, para
// que el branding sea idéntico en todas las pantallas.
const accentFont = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["600", "700"],
});

const columns = [
  {
    title: "Links",
    links: [
      ...(config.resend.supportEmail
        ? [
            {
              label: "Soporte",
              href: `mailto:${config.resend.supportEmail}`,
              external: true,
            },
          ]
        : []),
      { label: "Características", href: "/#features" },
      { label: "Planes", href: "/#pricing" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Invertir", href: "/#invertir" },
      { label: "Token $CASA", href: "/#token" },
      {
        label: "Contacto inversionistas",
        href: `mailto:${config.investors.contactEmail}`,
        external: true,
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos de servicio", href: "/tos" },
      { label: "Política de privacidad", href: "/privacy-policy" },
    ],
  },
];

// Footer apilado (marca → columnas → legal): en desktop el sidebar come
// 288px, así que marca + 3 columnas lado a lado quedaba apretado (~139px
// por columna a 1024px). Apilado respira igual en móvil, tablet y desktop.
const Footer = () => {
  return (
    // Sin bg propio: toma el fondo ambiental único del sitio.
    <footer className="border-t border-base-content/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-20 flex flex-col gap-10 md:gap-12">
        <div className="text-center sm:text-left">
          <Link
            href="/"
            title={`${config.appName} homepage`}
            className="inline-flex gap-2 items-center"
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-6 h-6"
              width={24}
              height={24}
            />
            <strong
              className={`${accentFont.className} italic tracking-wide text-gradient-gold leading-tight text-lg`}
            >
              {config.appName}
            </strong>
          </Link>

          <p className="mt-3 text-sm text-base-content/80">{config.tagline}</p>
          <p className="mt-2 text-sm text-base-content/60">
            Copyright © {new Date().getFullYear()} - Todos los derechos
            reservados
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 sm:grid-cols-3 gap-8"
        >
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
                {col.title}
              </p>
              <ul className="flex flex-col items-start gap-2 text-sm">
                {col.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a href={link.href} className="link link-hover">
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link href={link.href} className="link link-hover">
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-base-content/10 pt-6">
          <p className="text-xs text-base-content/50 leading-relaxed max-w-4xl">
            {config.legal.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
