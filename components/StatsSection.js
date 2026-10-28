const stats = [
  {
    value: "Hoy",
    label: "Directorio en vivo",
    detail: "Publicación, búsqueda y leads funcionando",
  },
  {
    value: "4",
    label: "Criptos por ficha",
    detail: "USDC, USDT, BTC y ETH en cada propiedad",
  },
  {
    value: "$299",
    label: "Premium para agentes",
    detail: "MXN/mes: destaca y escala tu portafolio",
  },
  {
    value: "1.5%",
    label: "Comisión por cierre",
    detail: "En roadmap sobre operaciones intermediadas",
  },
];

// Sección de "oportunidad / tracción" pensada para inversionistas. Los
// números reflejan el estado real del producto (no inventamos tracción de
// usuarios o GMV que todavía no existe) — esto es intencional para mantener
// la credibilidad frente a cualquier due diligence.
const StatsSection = () => {
  return (
    // Sin bg propio: toma el fondo ambiental único de la landing.
    <section className="border-t border-base-content/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-20">
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary mb-3">
            Tracción real, sin humo
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
            Construimos el producto antes de pedir el cheque
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-base-content/10 bg-base-200/50 p-6 text-center flex flex-col gap-1"
            >
              <span className="font-display text-3xl md:text-4xl font-extrabold text-primary">
                {s.value}
              </span>
              <span className="font-semibold text-sm md:text-base">
                {s.label}
              </span>
              <span className="text-xs opacity-60 leading-relaxed">
                {s.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
