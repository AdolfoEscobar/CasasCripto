import Link from "next/link";
import Image from "next/image";
import config from "@/config";

const trustBadges = [
  "Publicar es gratis",
  "USDC · USDT · BTC · ETH",
  "Revisión manual",
  "Cierre acompañado",
];

const Hero = () => {
  return (
    // Sin bg ni decoraciones propias: el fondo ambiental (grid + glows) es
    // único para toda la landing y vive en <AmbientBackground/>, para que no
    // haya "costuras" entre esta sección y el resto de bloques.
    <section className="relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-20 lg:py-24">
        <div className="flex flex-col gap-6 sm:gap-7 items-center justify-center text-center lg:text-left lg:items-start lg:w-1/2">
          <span className="badge badge-elite badge-lg h-auto py-2 font-medium text-xs sm:text-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            MVP en vivo · Ronda {config.investors.stage} abierta
          </span>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[3.4rem] tracking-tight leading-[1.08]">
            El directorio de propiedades que aceptan{" "}
            <span className="text-primary">cripto</span>
          </h1>

          <p className="text-base sm:text-lg opacity-70 leading-relaxed max-w-xl">
            Publica gratis, indica qué aceptas (USDC, USDT, BTC o ETH) y
            recibe compradores globales. Nosotros intermediamos para que el
            deal se cierre.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href={config.auth.callbackUrl}
              className="btn btn-primary w-full sm:w-auto sm:btn-wide"
            >
              Publicar gratis
            </Link>
            <Link
              href="/propiedades"
              className="btn btn-outline w-full sm:w-auto sm:btn-wide border-base-content/20"
            >
              Explorar directorio
            </Link>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-2">
            {trustBadges.map((b) => (
              <span
                key={b}
                className="badge badge-ghost border border-base-content/10 text-xs"
              >
                {b}
              </span>
            ))}
          </div>

          {/* Señal de estado honesta en vez de testimonios/avatares falsos:
          refleja lo que el MVP ya hace hoy, sin inventar tracción de
          usuarios (misma filosofía que <StatsSection/>). */}
          <p className="text-sm opacity-70">
            <span className="font-semibold text-base-content">
              Sin bancos que bloqueen fondos.
            </span>{" "}
            El comprador cripto te encuentra directo.
          </p>
        </div>

        <div className="relative lg:w-1/2 w-full max-w-md sm:max-w-xl lg:max-w-none">
          <div className="relative rounded-xl overflow-hidden border border-base-content/10">
            <Image
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
              alt="Casa moderna listada en el directorio de Casas Cripto"
              className="w-full aspect-[4/3] object-cover"
              priority={true}
              width={800}
              height={600}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-base-100/60 via-transparent to-transparent"
            />
          </div>

          {/* Tarjeta flotante: lo que hace única a una ficha del directorio */}
          <div className="absolute -bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:-bottom-5 sm:-left-5 flex items-center gap-3 rounded-xl border border-base-content/10 bg-base-100/95 backdrop-blur px-4 sm:px-5 py-3 shadow-xl">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-success/15 text-success shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="text-sm">
              <p className="font-semibold">Ficha verificada</p>
              <p className="opacity-60 text-xs">Acepta USDC · BTC</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
