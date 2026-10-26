// Badge de "verificado" estilo plataformas Web3 ya establecidas (OpenSea,
// etc.): un check azul/cian junto al nombre de marca o de una propiedad.
// Es puramente una señal visual de confianza — no implica ningún proceso de
// verificación legal/KYC que no exista; para eso ya tenemos el flujo real
// descrito en <FeaturesAccordion/> ("Verificación y cumplimiento").
const VerifiedBadge = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`text-secondary shrink-0 ${className}`}
    aria-label="Verificado"
    role="img"
  >
    <path d="M12 2.5l2.2 1.27 2.54-.2 1.08 2.3 2.3 1.08-.2 2.54L21.5 12l-1.27 2.2.2 2.54-2.3 1.08-1.08 2.3-2.54-.2L12 21.5l-2.2-1.27-2.54.2-1.08-2.3-2.3-1.08.2-2.54L2.5 12l1.27-2.2-.2-2.54 2.3-1.08 1.08-2.3 2.54.2L12 2.5z" />
    <path
      d="M8.5 12.2l2.3 2.3 4.7-4.9"
      stroke="var(--color-base-100)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default VerifiedBadge;
