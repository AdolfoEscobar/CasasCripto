const stats = [
  {
    value: "100%",
    label: "MVP funcional",
    detail: "Auth, suscripciones, panel admin y pagos ya construidos",
  },
  {
    value: "4",
    label: "Criptomonedas soportadas",
    detail: "USDC, USDT, BTC y ETH en el checkout",
  },
  {
    value: "<48h",
    label: "Liquidación objetivo",
    detail: "vs. 30-60 días del sistema bancario tradicional",
  },
  {
    value: "2",
    label: "Modelos de monetización activos",
    detail: "Suscripción SaaS + donaciones; comisión por cierre en roadmap",
  },
];

// Sección de "oportunidad / tracción" pensada para inversionistas. Los
// números reflejan el estado real del producto (no inventamos tracción de
// usuarios o GMV que todavía no existe) — esto es intencional para mantener
// la credibilidad frente a cualquier due diligence.
const StatsSection = () => {
  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <section className="border-y border-base-content/10">
      <div className="max-w-7xl mx-auto px-8 py-16 md:py-20">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="font-medium text-primary mb-3">Por qué ahora</p>
          <h2 className="font-bold text-3xl md:text-4xl tracking-tight">
            Construimos la infraestructura antes de pedir el cheque
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-card rounded-2xl p-6 text-center flex flex-col gap-1"
            >
              <span className="text-3xl md:text-4xl font-extrabold text-gradient-gold">
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
