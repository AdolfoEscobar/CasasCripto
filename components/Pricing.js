import Link from "next/link";
import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

// <Pricing/> muestra los planes de suscripción (config.stripe.plans) para
// propietarios y agentes que quieren listar propiedades, más una tarjeta
// adicional dirigida a inversionistas/socios estratégicos (no es un plan de
// Stripe, enlaza a la sección #invertir).
const Pricing = () => {
  return (
    // Sin bg propio: toma el fondo ambiental único de la landing
    // (app/page.js). Las tarjetas de plan usan `glass-card` (en vez de un
    // bg-base-100 sólido) para seguir distinguiéndose del fondo sin crear un
    // bloque de color aparte.
    <section className="overflow-hidden border-y border-base-content/10 scroll-mt-20" id="pricing">
      <div className="py-20 sm:py-24 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col text-center w-full mb-12 sm:mb-16">
          <p className="font-medium text-primary mb-3">Planes</p>
          <h2 className="font-bold text-3xl lg:text-5xl tracking-tight">
            Lista tu propiedad, acepta cripto hoy
          </h2>
          <p className="opacity-70 mt-4 max-w-xl mx-auto">
            Elige el plan según cuántas propiedades quieras publicar. Todos
            incluyen checkout en criptomonedas.
          </p>
        </div>

        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-6">
          {config.stripe.plans.map((plan) => (
            <div key={plan.priceId} className="relative w-full max-w-lg pt-3">
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span className="badge text-[10px] sm:text-xs text-primary-content font-semibold border-0 bg-primary whitespace-nowrap px-3">
                    MÁS POPULAR
                  </span>
                </div>
              )}

              {plan.isFree && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span className="badge text-[10px] sm:text-xs text-success-content font-semibold border-0 bg-success whitespace-nowrap px-3">
                    SIEMPRE GRATIS
                  </span>
                </div>
              )}

              {plan.isFeatured && (
                <div
                  className={`absolute -inset-[1px] rounded-[9px] bg-primary z-10`}
                ></div>
              )}

              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 glass-card p-6 sm:p-8 rounded-lg">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold">{plan.name}</p>
                    {plan.description && (
                      <p className="text-base-content/80 mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {plan.priceAnchor && (
                    <div className="flex flex-col justify-end mb-[4px] text-lg ">
                      <p className="relative">
                        <span className="absolute bg-base-content h-[1.5px] inset-x-0 top-[53%]"></span>
                        <span className="text-base-content/80">
                          ${plan.priceAnchor}
                        </span>
                      </p>
                    </div>
                  )}
                  <p className={`text-5xl tracking-tight font-extrabold ${plan.isFree ? "text-success" : ""}`}>
                    {plan.isFree ? "Gratis" : `$${plan.price}`}
                  </p>
                  <div className="flex flex-col justify-end mb-[4px] max-w-[70px] sm:max-w-none">
                    <p className="text-xs text-base-content/60 uppercase font-semibold leading-tight">
                      {plan.isFree ? "Para siempre" : "USD / mes"}
                    </p>
                  </div>
                </div>
                {plan.features && (
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {plan.features.map((feature, i) => (
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
                  {plan.isFree ? (
                    <Link
                      href={config.auth.callbackUrl}
                      className="btn btn-primary btn-block"
                    >
                      Publicar mi propiedad gratis
                    </Link>
                  ) : (
                    <ButtonCheckout
                      priceId={plan.priceId}
                      mode="subscription"
                      label={`Elegir ${plan.name}`}
                    />
                  )}

                  <p className="flex items-center justify-center gap-2 text-sm text-center text-base-content/80 font-medium relative">
                    {plan.isFree
                      ? "Sin tarjeta de crédito. Publica en minutos."
                      : "Cancela cuando quieras."}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Investor / strategic partner card — not a Stripe plan */}
          <div className="relative w-full max-w-lg">
            <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 glass-card p-6 sm:p-8 rounded-lg border border-primary/30">
              <div>
                <p className="text-lg lg:text-xl font-bold">Elite / Inversionistas</p>
                <p className="opacity-80 mt-2">
                  Alianzas estratégicas, due diligence y acceso temprano al
                  roadmap y al token $CASA.
                </p>
              </div>
              <p className="text-3xl font-extrabold">A medida</p>
              <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                {[
                  "Acceso al pitch deck y métricas",
                  "Alianza estratégica con el equipo fundador",
                  "Pre-acceso al token $CASA (sujeto a regulación)",
                  "Reporte de avance mensual",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-[18px] h-[18px] opacity-80 shrink-0 text-primary"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#invertir" className="btn btn-primary btn-block">
                Hablar con el equipo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
