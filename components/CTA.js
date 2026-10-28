import Link from "next/link";
import config from "@/config";

// Sin fondo propio (ni foto, ni overlay): toma el fondo ambiental único
// de la landing (app/page.js), igual que el resto de secciones, para que
// no se vea como un bloque de color distinto justo antes del Footer.
const CTA = () => {
  return (
    <section className="relative border-t border-base-content/10">
      <div className="hero">
        <div className="hero-content text-center px-5 sm:px-8 py-20 md:py-28">
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight mb-4 md:mb-6">
              El futuro del real estate ya acepta{" "}
              <span className="text-primary">cripto</span>
            </h2>
            <p className="text-base sm:text-lg text-base-content/80 mb-8 md:mb-10 max-w-xl">
              Elige tu camino: lista tu propiedad, súmate como inversionista a
              nuestra ronda {config.investors.stage}, o apoya el desarrollo con
              una donación.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <Link
                href={config.auth.callbackUrl}
                className="btn btn-primary glow-primary w-full sm:w-auto sm:min-w-[13rem]"
              >
                Listar mi propiedad
              </Link>
              <Link
                href="#invertir"
                className="btn btn-outline border-base-content/30 w-full sm:w-auto sm:min-w-[10rem]"
              >
                Invertir
              </Link>
              <Link
                href="#donar"
                className="btn btn-outline border-base-content/30 w-full sm:w-auto sm:min-w-[10rem]"
              >
                Donar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
