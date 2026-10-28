import config from "@/config";

// Sección informativa/aspiracional sobre el futuro token de utilidad $CASA.
// Todo el contenido viene de config.token para mantenerlo centralizado y
// fácil de actualizar a medida que avance la validación legal.
const TokenRoadmap = () => {
  const { ticker, name, status, utility, roadmap } = config.token;

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing.
    <section className="border-t border-base-content/10 scroll-mt-20" id="token">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <p className="text-sm font-semibold text-primary mb-3">Roadmap</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            El futuro token <span className="text-primary">{ticker}</span>
          </h2>
          <p className="opacity-70 leading-relaxed">
            {name} — <span className="opacity-70">{status}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 mb-12">
          <div>
            <h3 className="font-bold text-xl mb-4">Utilidad planeada</h3>
            <ul className="space-y-3">
              {utility.map((u) => (
                <li key={u} className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[18px] h-[18px] text-primary shrink-0 mt-0.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
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

        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm opacity-90 max-w-3xl mx-auto flex gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-warning shrink-0 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p>
            <strong>Aviso legal:</strong> {config.legal.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TokenRoadmap;
