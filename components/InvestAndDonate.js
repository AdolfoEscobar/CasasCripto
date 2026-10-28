import config from "@/config";
import ButtonLead from "./ButtonLead";
import DonateButton from "./DonateButton";
// ⚠️ Donaciones on-chain directas deshabilitadas a propósito: las wallets en
// <CopyWalletAddress/> son placeholders (0x000...dEaD / bc1qxxx...). Si
// alguien dona a esas direcciones hoy, el dinero se pierde para siempre.
// Vuelve a importar y usar el componente una vez que agregues wallets reales.
// import CopyWalletAddress from "./CopyWalletAddress";

// Sección dual: (1) captación de interés de inversionistas (ronda pre-seed)
// y (2) donaciones abiertas a cualquier persona que quiera apoyar el
// desarrollo del proyecto, en fiat (Stripe) o directamente en cripto.
const InvestAndDonate = () => {
  const { highlights, contactEmail, stage } = config.investors;

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <section className="border-t border-base-content/10 scroll-mt-20" id="invertir">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <p className="text-sm font-semibold text-primary mb-3">
            Para inversionistas
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            Únete a la ronda <span className="text-primary">{stage}</span> de{" "}
            {config.appName}
          </h2>
          <p className="opacity-80 leading-relaxed">
            Buscamos inversionistas ángeles y fondos early-stage que quieran
            construir, junto a nosotros, la infraestructura de pagos
            inmobiliarios del futuro.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 md:mb-12">
          {highlights.map((h) => (
            <div key={h.label} className="glass-card rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide opacity-60 mb-1">
                {h.label}
              </p>
              <p className="font-semibold text-sm leading-snug">{h.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Investor interest capture */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
            <h3 className="font-bold text-xl">
              Soy inversionista / fondo
            </h3>
            <p className="text-sm opacity-70">
              Déjanos tu email y te enviaremos el pitch deck y acceso a
              nuestras métricas cuando estén disponibles. También puedes
              escribirnos directamente a{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="link link-primary"
              >
                {contactEmail}
              </a>
              .
            </p>
            <ButtonLead
              source="investor"
              placeholder="tu@fondo.com"
              buttonLabel="Quiero el pitch deck"
              successMessage="¡Gracias! Te contactaremos pronto con más información."
            />
          </div>

          {/* Donations */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col gap-5 scroll-mt-20" id="donar">
            <h3 className="font-bold text-xl">Quiero donar / apoyar</h3>
            <p className="text-sm opacity-70">
              {config.donations.description}
            </p>

            <p className="text-xs font-semibold uppercase tracking-wide opacity-50">
              En MXN (tarjeta, vía Stripe)
            </p>
            <DonateButton />

            {/* Donaciones on-chain: próximamente — ver nota arriba sobre
            <CopyWalletAddress/>. Se reactiva cuando haya wallets reales. */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestAndDonate;
