import config from "@/config";

// Sección informativa/aspiracional sobre el futuro token de utilidad $CASA.
// Todo el contenido viene de config.token para mantenerlo centralizado y
// fácil de actualizar a medida que avance la validación legal.
const TokenRoadmap = () => {
  const { ticker, name, status, utility, roadmap } = config.token;

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <section className="border-y border-base-content/10" id="token">
      <div className="max-w-6xl mx-auto px-8 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-medium text-primary mb-3">Roadmap</p>
          <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight mb-4">
            El futuro token <span className="text-gradient-gold">{ticker}</span>
          </h2>
          <p className="opacity-80 leading-relaxed">
            {name} — <span className="opacity-70">{status}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="font-bold text-xl mb-4">Utilidad planeada</h3>
            <ul className="space-y-3">
              {utility.map((u) => (
                <li key={u} className="flex items-start gap-3">
                  <span className="text-primary mt-0.5">●</span>
                  <span className="opacity-90">{u}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold text-xl mb-4">Roadmap por fases</h3>
            <ol className="space-y-5">
              {roadmap.map((r, i) => (
                <li key={r.phase} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    {i < roadmap.length - 1 && (
                      <span className="w-px flex-1 bg-base-content/15 mt-1" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs uppercase tracking-wide opacity-60">
                      {r.phase}
                    </p>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-sm opacity-70">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm opacity-90 max-w-3xl mx-auto">
          ⚠️ <strong>Aviso legal:</strong> {config.legal.disclaimer}
        </div>
      </div>
    </section>
  );
};

export default TokenRoadmap;
