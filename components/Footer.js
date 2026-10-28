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

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.resend.supportEmail, the link won't be displayed.

const Footer = () => {
  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <footer className="border-t border-base-content/10">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className=" flex lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
          <div className="w-64 flex-shrink-0 md:mx-0 mx-auto text-center md:text-left">
            <Link
              href="/#"
              aria-current="page"
              className="flex gap-2 justify-center md:justify-start items-center"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                priority={true}
                className="w-6 h-6"
                width={24}
                height={24}
              />
              <strong
                className={`${accentFont.className} italic tracking-wide text-gradient-gold leading-tight text-base md:text-lg`}
              >
                {config.appName}
              </strong>
            </Link>

            <p className="mt-3 text-sm text-base-content/80">
              {config.tagline}
            </p>
            <p className="mt-3 text-sm text-base-content/60">
              Copyright © {new Date().getFullYear()} - Todos los derechos
              reservados
            </p>

            <div className="mt-4 flex gap-3 justify-center md:justify-start">
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="btn btn-circle btn-sm btn-ghost"
              >
                𝕏
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="btn btn-circle btn-sm btn-ghost"
              >
                in
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="btn btn-circle btn-sm btn-ghost"
              >
                ✈
              </a>
            </div>
          </div>
          <div className="flex-grow flex flex-wrap justify-center -mb-10 md:mt-0 mt-10 text-center">
            <div className="lg:w-1/3 md:w-1/2 w-full px-4">
              <div className="footer-title font-semibold text-base-content tracking-widest text-sm md:text-left mb-3">
                LINKS
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                {config.resend.supportEmail && (
                  <a
                    href={`mailto:${config.resend.supportEmail}`}
                    target="_blank"
                    className="link link-hover"
                    aria-label="Contact Support"
                  >
                    Soporte
                  </a>
                )}
                <Link href="/#features" className="link link-hover">
                  Características
                </Link>
                <Link href="/#pricing" className="link link-hover">
                  Planes
                </Link>
                <Link href="/blog" className="link link-hover">
                  Blog
                </Link>
              </div>
            </div>

            <div className="lg:w-1/3 md:w-1/2 w-full px-4">
              <div className="footer-title font-semibold text-base-content tracking-widest text-sm md:text-left mb-3">
                COMPAÑÍA
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                <Link href="/#invertir" className="link link-hover">
                  Invertir
                </Link>
                <Link href="/#token" className="link link-hover">
                  Token $CASA
                </Link>
                <a
                  href={`mailto:${config.investors.contactEmail}`}
                  className="link link-hover"
                >
                  Contacto inversionistas
                </a>
              </div>
            </div>

            <div className="lg:w-1/3 md:w-1/2 w-full px-4">
              <div className="footer-title font-semibold text-base-content tracking-widest text-sm md:text-left mb-3">
                LEGAL
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                <Link href="/tos" className="link link-hover">
                  Términos de servicio
                </Link>
                <Link href="/privacy-policy" className="link link-hover">
                  Política de privacidad
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-base-content/10 pt-8 mt-4">
            <p className="text-xs text-base-content/50 leading-relaxed max-w-4xl">
              ⚠️ {config.legal.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
