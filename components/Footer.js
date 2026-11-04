import Image from "next/image";
import FooterLink from "./FooterLink";
import config from "@/config";
import logo from "@/app/icon.png";
import { SocialIcon } from "./SocialIcons";
import { topCities } from "@/libs/geoDirectory.mjs";
import { cityUrl } from "@/libs/propertyUrls.mjs";

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
      // PLANES OCULTOS (temporal, hasta tracción):
      // { label: "Planes", href: "/#pricing" },
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
  {
    title: "Síguenos",
    links: config.socials.map((s) => ({
      label: s.label,
      href: s.href,
      icon: s.icon,
      external: true,
      newTab: true,
    })),
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
          <FooterLink
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
            <strong className="font-display text-lg font-extrabold tracking-tight text-gradient-gold leading-tight">
              {config.appName}
            </strong>
          </FooterLink>

          <p className="mt-3 text-sm text-base-content/80">{config.tagline}</p>
          <p className="mt-2 text-sm text-base-content/60">
            Copyright © {new Date().getFullYear()} - Todos los derechos
            reservados
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 sm:grid-cols-4 gap-8"
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
                      <a
                        href={link.href}
                        className={`link link-hover ${link.icon ? "inline-flex items-center gap-2" : ""}`}
                        {...(link.newTab
                          ? {
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : {})}
                      >
                        {link.icon && (
                          <SocialIcon name={link.icon} className="w-4 h-4" />
                        )}
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <FooterLink href={link.href} className="link link-hover">
                        {link.label}
                      </FooterLink>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Interlinking sitewide server-side (el que más pesa para crawlers):
            destinos top en TODAS las páginas + link al directorio completo. */}
        <nav
          aria-label="Destinos populares"
          className="border-t border-base-content/10 pt-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3 text-center sm:text-left">
            Destinos populares
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm justify-center sm:justify-start">
            {topCities.map((c) => (
              <li key={`${c.stateSlug}/${c.citySlug}`}>
                <FooterLink
                  href={cityUrl(c.stateSlug, c.citySlug)}
                  className="link link-hover opacity-70"
                >
                  {c.city}
                </FooterLink>
              </li>
            ))}
            <li>
              <FooterLink
                href="/propiedades/ciudad"
                className="link link-hover font-medium"
              >
                Ver todas →
              </FooterLink>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
