import Link from "next/link";
import Image from "next/image";
import config from "@/config";

const steps = [
  {
    number: "01",
    title: "Lista tu propiedad gratis",
    description:
      "Publica en minutos e indica qué aceptas: USDC, USDT, BTC o ETH. Revisamos cada ficha a mano antes de publicarla. Sin tarjeta, sin letra chica.",
  },
  {
    number: "02",
    title: "Recibe compradores que ya tienen cripto",
    description:
      "Filtros por país, ciudad y moneda. El inversionista global encuentra tu propiedad sin bancos que bloqueen o retrasen sus fondos.",
  },
  {
    number: "03",
    title: "Nosotros intermediamos el cierre",
    description:
      "Calificamos el lead, conectamos a ambas partes y acompañamos la negociación. Humano y simple en el MVP; la automatización vendrá después.",
  },
];

// Sección "cómo funciona" del landing. Posicionamiento deliberado para el
// MVP: Casas Cripto es un directorio Web3 de propiedades + intermediación
// humana, no un banco, un exchange ni una plataforma de custodia. El copy
// evita prometer escrow, KYC automático o el token $CASA (todo roadmap).
const FeaturesAccordion = () => {
  return (
    <section id="features" className="scroll-mt-20 border-t border-base-content/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
          {/* Intro editorial */}
          <div>
            <span className="badge badge-elite font-medium text-xs sm:text-sm">
              MVP en vivo · Directorio Web3
            </span>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] tracking-tight leading-[1.1] mt-5">
              El directorio donde el real estate se encuentra con{" "}
              <span className="text-primary">cripto</span>
            </h2>

            <p className="text-base sm:text-lg opacity-70 leading-relaxed mt-5 max-w-xl">
              No somos un banco ni un exchange. Somos el punto de encuentro:
              propiedades verificadas que aceptan criptomonedas y un equipo
              que intermedia para que el deal se cierre.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/propiedades"
                className="btn btn-primary sm:btn-wide"
              >
                Explorar propiedades
              </Link>
              <Link
                href={config.auth.callbackUrl}
                className="btn btn-outline sm:btn-wide border-base-content/20"
              >
                Publicar gratis
              </Link>
            </div>

            <p className="text-sm opacity-70 leading-relaxed mt-8 pt-6 border-t border-base-content/10 max-w-xl">
              <span className="font-semibold text-base-content">
                Para inversionistas:{" "}
              </span>
              ingresos desde el día uno con Premium y destacados, comisión
              por cierre en roadmap. Cada listado es una página que atrae
              tráfico orgánico gratis.
            </p>
          </div>

          {/* Visual: una ficha del directorio, sin mockups de producto falso */}
          <figure className="lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-xl border border-base-content/10">
              <Image
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
                alt="Ejemplo de propiedad listada en el directorio de Casas Cripto"
                className="w-full aspect-[4/3] object-cover"
                width={700}
                height={525}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base-100/95 via-base-100/20 to-transparent" />
              <span className="absolute top-4 left-4 badge badge-sm font-semibold bg-base-100/90 border-base-content/15">
                Verificada
              </span>
              <figcaption className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-bold text-lg leading-tight">
                    Villa frente al mar
                  </p>
                  <p className="text-sm opacity-70">Tulum, México</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-primary">US$ 480,000</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    Acepta USDC · BTC
                  </p>
                </div>
              </figcaption>
            </div>
            <p className="text-xs opacity-50 mt-3">
              Ficha ilustrativa del directorio — fotografía de referencia.
            </p>
          </figure>
        </div>

        {/* 3 pasos en lista editorial con divisores, sin tarjetas */}
        <ol className="mt-16 md:mt-20 grid md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-base-content/10">
          {steps.map((step) => (
            <li
              key={step.number}
              className="border-t border-base-content/10 pt-6 md:border-t-0 md:pt-0 md:px-8 md:first:pl-0 md:last:pr-0"
            >
              <span className="font-mono text-sm font-semibold text-primary">
                {step.number}
              </span>
              <h3 className="font-bold text-lg mt-2">{step.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed mt-2">
                {step.description}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
                Disponible hoy
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-sm opacity-60 max-w-2xl leading-relaxed">
          Sin custodia, sin token, sin humo — todavía. Primero el directorio
          que funciona, después la infraestructura.{" "}
          <a href="#token" className="link link-primary">
            Ver roadmap
          </a>
        </p>
      </div>
    </section>
  );
};

export default FeaturesAccordion;
