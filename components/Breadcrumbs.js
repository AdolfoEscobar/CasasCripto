import Link from "next/link";
import { Fragment } from "react";

// Migas visibles ÚNICAS del marketplace (hub, estado, ciudad, detalle,
// directorio, país): misma posición (izquierda, como los portales), misma
// altura (justo bajo el héroe de búsqueda), mismo estilo y misma raíz
// ("Inicio >"). Incluyen el país cuando aplica (Propiedades > México >
// Chihuahua...), igual que la jerarquía del sitio. `items` es
// [{ label, href? }]: el último sin href es la página actual (truncado si
// es largo, ej. títulos de fichas). El `ul` NUNCA envuelve: una sola línea
// con justify-start explícito (el nav de daisyUI NO es flex, así que
// justify-center ahí es código muerto) y scroll horizontal en casos
// extremos. Así la posición y altura son idénticas en todas las páginas.
const Breadcrumbs = ({ items }) => {
  if (!items?.length) return null;
  return (
    <nav
      aria-label="Migas de pan"
      className="text-sm breadcrumbs mb-6 opacity-70 [&>ul]:flex-nowrap [&>ul]:justify-start [&>ul]:overflow-x-auto"
    >
      <ul>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={item.href || item.label}>
              <li className={isLast ? "min-w-0" : "shrink-0"}>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    title={item.label}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="truncate max-w-[40vw] block"
                    title={item.label}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
