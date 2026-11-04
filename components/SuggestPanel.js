import { PROPERTY_TYPES, LISTING_TYPES, capFirst } from "@/libs/geoSeo.mjs";
import { topCities } from "@/libs/geoDirectory.mjs";
import { cityUrl } from "@/libs/propertyUrls.mjs";

// Panel flotante del buscador, compartido por el header y el héroe. Dos
// modos: con ≥2 letras muestra resultados (lugares + propiedades); con el
// campo vacío/corto muestra EXPLORACIÓN (tipos, operación, destinos) para
// filtrar todo desde el dropdown sin escribir. Presentacional: el padre
// maneja `active` (teclado/hover en resultados), `onPick(url)`,
// `onPickFilter({tipo, operacion})` y `onSubmitAll` (ver todos).
const SuggestPanel = ({
  id,
  term,
  items,
  loading,
  active,
  onActive,
  onPick,
  onPickFilter,
  onSubmitAll,
}) => {
  const browse = (term || "").trim().length < 2;
  const geos = items.geos || [];
  const properties = items.properties || [];
  const flat = [...geos, ...properties];
  const hasResults = flat.length > 0;
  const optionId = (i) => `${id}-opt-${i}`;

  const renderRow = (item, kind, i) => {
    const isActive = i === active;
    return (
      <button
        key={`${kind}-${item.url}`}
        type="button"
        role="option"
        id={optionId(i)}
        aria-selected={isActive}
        onMouseEnter={() => onActive(i)}
        onClick={() => onPick(item.url)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
          isActive ? "bg-primary/15" : "hover:bg-base-content/5"
        }`}
      >
        {kind === "geo" ? (
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/15 text-secondary shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </span>
        ) : item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            aria-hidden="true"
            className="w-9 h-9 rounded-lg object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-base-300 text-base-content/50 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
              />
            </svg>
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm truncate">
            {kind === "geo" ? item.label : item.title}
          </span>
          <span className="block text-xs opacity-60 truncate">
            {kind === "geo" ? item.sub : `${item.location} · ${item.price}`}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div
      id={`${id}-listbox`}
      role={browse ? "group" : "listbox"}
      aria-label={
        browse
          ? "Explorar por tipo, operación o destino"
          : "Sugerencias de búsqueda"
      }
      className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-base-content/10 bg-base-100 shadow-xl p-2 z-[100] max-h-[70vh] overflow-y-auto"
    >
      {browse ? (
        <>
          <div className="mb-1">
            <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">
              Tipo de propiedad
            </p>
            <div className="flex flex-wrap gap-1.5 px-2 pb-2">
              {Object.entries(PROPERTY_TYPES).map(([key, labels]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPickFilter({ tipo: key })}
                  className="badge badge-md min-h-[32px] badge-ghost border border-base-content/20 hover:badge-primary"
                >
                  {capFirst(labels.plural)}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-1">
            <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">
              Operación
            </p>
            <div className="flex flex-wrap gap-1.5 px-2 pb-2">
              {Object.entries(LISTING_TYPES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPickFilter({ operacion: key })}
                  className="badge badge-md min-h-[32px] badge-ghost border border-base-content/20 hover:badge-primary"
                >
                  {capFirst(label)}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-1">
            <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">
              Destinos populares
            </p>
            {topCities.slice(0, 6).map((c) => (
              <button
                key={`${c.stateSlug}/${c.citySlug}`}
                type="button"
                onClick={() => onPick(cityUrl(c.stateSlug, c.citySlug))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors hover:bg-base-content/5"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/15 text-secondary shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-sm truncate">
                    {c.city}
                  </span>
                  <span className="block text-xs opacity-60 truncate">
                    {c.state} · {c.country}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : loading && !hasResults ? (
        <p className="px-3 py-3 text-sm opacity-60 flex items-center gap-2">
          <span className="loading loading-spinner loading-xs" />
          Buscando…
        </p>
      ) : !hasResults ? (
        <div className="px-3 py-3 text-sm">
          <p className="opacity-60 mb-2">Sin coincidencias para “{term}”.</p>
          <button
            type="button"
            onClick={onSubmitAll}
            className="link link-primary font-medium"
          >
            Buscar de todos modos →
          </button>
        </div>
      ) : (
        <>
          {geos.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">
                Lugares
              </p>
              {geos.map((g, j) => renderRow(g, "geo", j))}
            </div>
          )}
          {properties.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">
                Propiedades
              </p>
              {properties.map((p, j) =>
                renderRow(p, "property", geos.length + j),
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onSubmitAll}
            className="w-full text-center text-sm link link-primary font-medium px-3 py-2.5"
          >
            Ver todos los resultados para “{term}” →
          </button>
        </>
      )}
    </div>
  );
};

export default SuggestPanel;
