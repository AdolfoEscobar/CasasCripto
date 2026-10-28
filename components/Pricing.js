import Link from "next/link";
import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

// <Pricing/> muestra una sola opción de compra: Premium. Publicar siempre es
// gratis (el plan Básico en config sigue gobernando los límites gratuitos),
// así que la sección no necesita una parrilla de planes: una tarjeta centrada
// + una nota discreta con la vía gratuita. La tarjeta de inversionistas vive
// en #invertir, no aquí.
const Pricing = () => {
  const premium = config.stripe.plans.find((plan) => !plan.isFree);

  if (!premium) return null;

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing
    // (app/page.js). La tarjeta usa `glass-card` (en vez de un bg-base-100
    // sólido) para seguir distinguiéndose del fondo sin crear un bloque de
    // color aparte.
    <section className="overflow-hidden border-t border-base-content/10 scroll-mt-20" id="pricing">
      <div className="py-20 md:py-28 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col text-center w-full mb-12 md:mb-14">
          <p className="text-sm font-semibold text-primary mb-3">Premium</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Lista tu propiedad, acepta cripto hoy
          </h2>
          <p className="opacity-70 mt-4 max-w-xl mx-auto">
            Publicar siempre es gratis. Premium es para agentes y portafolios
            que quieren escalar y destacar.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative w-full max-w-lg">
            <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 glass-card p-6 sm:p-8 rounded-2xl">
              <div>
                <p className="text-lg lg:text-xl font-bold">{premium.name}</p>
                {premium.description && (
                  <p className="text-base-content/80 mt-2">
                    {premium.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {premium.priceAnchor && (
                  <div className="flex flex-col justify-end mb-[4px] text-lg ">
                    <p className="relative">
                      <span className="absolute bg-base-content h-[1.5px] inset-x-0 top-[53%]"></span>
                      <span className="text-base-content/80">
                        ${premium.priceAnchor}
                      </span>
                    </p>
                  </div>
                )}
                <p className="text-5xl tracking-tight font-extrabold">
                  ${premium.price}
                </p>
                <div className="flex flex-col justify-end mb-[4px] max-w-[70px] sm:max-w-none">
                  <p className="text-xs text-base-content/60 uppercase font-semibold leading-tight">
                    MXN / mes
                  </p>
                </div>
              </div>
              {premium.features && (
                <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                  {premium.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-[18px] h-[18px] opacity-80 shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <span>{feature.name} </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                <ButtonCheckout
                  priceId={premium.priceId}
                  mode="subscription"
                  label={`Elegir ${premium.name}`}
                />

                <p className="flex items-center justify-center gap-2 text-sm text-center text-base-content/80 font-medium relative">
                  Cancela cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-base-content/60 mt-8">
          ¿Solo quieres publicar una propiedad?{" "}
          <Link
            href={config.auth.callbackUrl}
            className="link link-primary font-medium"
          >
            Es gratis, sin tarjeta
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Pricing;
