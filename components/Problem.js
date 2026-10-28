const frictions = [
  {
    title: "Vendes en cripto, nadie te encuentra",
    description:
      "Los portales tradicionales no hablan el idioma crypto: tu propiedad queda invisible para el comprador global.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
        />
      </svg>
    ),
  },
  {
    title: "El banco frena la operación",
    description:
      "Fondos en cripto retenidos, semanas de compliance y papeleo que enfrían al comprador hasta matarlo.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "El deal se cae por el camino",
    description:
      "Sin un punto de encuentro claro, vendedor y comprador se pierden entre intermediarios que no entienden cripto.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
];

// Problem Agitation: qué pasa hoy cuando alguien quiere comprar o vender
// una propiedad usando criptomonedas, sin mencionar Casas Cripto.
const Problem = () => {
  return (
    // Separador superior hairline (igual que el resto de secciones).
    <section className="border-t border-base-content/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-28 text-center">
        <h2 className="font-display max-w-3xl mx-auto font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
          Vender real estate en cripto hoy es lento y lleno de fricción
        </h2>
        <p className="max-w-xl mx-auto text-base sm:text-lg opacity-70 leading-relaxed mt-5 mb-12 md:mb-16">
          El dinero digital avanza, pero el real estate sigue atrapado en el
          papeleo del siglo pasado.
        </p>

        <div className="grid md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-base-content/10 text-left">
          {frictions.map((f, i) => (
            <div
              key={f.title}
              className="border-t border-base-content/10 pt-6 md:border-t-0 md:pt-0 md:px-8 md:first:pl-0 md:last:pr-0"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-11 h-11 rounded-full border border-base-content/15 text-primary shrink-0">
                  {f.icon}
                </span>
                <span className="font-mono text-sm font-semibold text-base-content/40">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-bold text-lg mt-4">{f.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed mt-2">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
