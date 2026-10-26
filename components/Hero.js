import Link from "next/link";
import Image from "next/image";
import config from "@/config";

const trustBadges = [
  "Cripto-nativo",
  "Stripe-ready",
  "KYC/AML preparado",
  "Open roadmap",
];

const Hero = () => {
  return (
    // Sin bg ni decoraciones propias: el fondo ambiental (grid + glows) es
    // único para toda la landing y vive en app/page.js, para que no haya
    // "costuras" entre esta sección y el Header/resto de bloques.
    <section className="relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-20 lg:py-28">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 items-center justify-center text-center lg:text-left lg:items-start lg:w-1/2">
          <span className="badge badge-elite badge-lg h-auto whitespace-normal text-center py-2 font-medium text-xs sm:text-sm">
            🚀 {config.investors.stage} abierta · construyendo el futuro del
            real estate cripto
          </span>

          <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] sm:leading-[1.05]">
            El real estate{" "}
            <span className="text-gradient-gold">elite</span> que ya opera en{" "}
            <span className="text-gradient-crypto">criptomonedas</span>
          </h1>

          <p className="text-base sm:text-lg opacity-80 leading-relaxed max-w-xl">
            {config.appName} conecta propietarios y agentes crypto-friendly
            con compradores e inversionistas globales. Sin fronteras
            bancarias, con stablecoins, verificación y la tecnología de un
            marketplace de nivel institucional.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href={config.auth.callbackUrl} className="btn btn-primary w-full sm:w-auto sm:btn-wide glow-primary">
              Listar mi propiedad
            </Link>
            <Link href="#invertir" className="btn btn-outline w-full sm:w-auto sm:btn-wide border-base-content/20">
              Invertir en {config.appName}
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
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
          reflejamos lo que el MVP ya hace hoy, sin inventar tracción de
          usuarios (misma filosofía que <StatsSection/>). */}
          <div className="flex items-center gap-2.5 text-sm opacity-80">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span>
              <span className="font-semibold text-base-content">
                MVP en vivo
              </span>{" "}
              — auth, suscripciones y pagos ya funcionan hoy
            </span>
          </div>
        </div>

        <div className="relative lg:w-1/2 w-full max-w-md sm:max-w-xl lg:max-w-none mb-6 sm:mb-8 lg:mb-0">
          <div className="relative rounded-3xl overflow-hidden border border-primary/20 glow-primary">
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
              alt="Propiedad crypto-friendly lista en Casas Cripto"
              className="w-full aspect-[4/3] sm:aspect-square object-cover brightness-110 contrast-105 saturate-110"
              priority={true}
              width={800}
              height={800}
            />
            {/* subtle golden sheen at the edges only — keeps the center of the photo bright/clear */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-secondary/15 mix-blend-soft-light"
            />
          </div>

          {/* floating "live" card to reinforce fintech / product feel */}
          <div className="absolute -bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:-bottom-6 sm:-left-6 flex glass-card rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-xl items-center gap-3 sm:max-w-none">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
            </span>
            <div className="text-sm">
              <p className="font-semibold">Pago en USDC confirmado</p>
              <p className="opacity-60 text-xs">Liquidación en &lt; 48h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
