"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchSuggest } from "@/libs/useSearchSuggest";
import SuggestPanel from "@/components/SuggestPanel";
import { PROPERTY_TYPES, LISTING_TYPES, capFirst } from "@/libs/geoSeo.mjs";
import {
  popularCities,
  allCountries,
  allStateSlugs,
  stateGuides,
  knownCountry,
  guessGeoFromPath,
} from "@/libs/geoDirectory.mjs";
import { slugify } from "@/libs/slugify.js";
import { searchTarget } from "@/libs/propertyUrls.mjs";

// Héroe de búsqueda estilo portal (hub, estado, ciudad, ficha, directorio):
// texto + país + estado + ciudad + tipo + operación en una tarjeta
// protagonista. Es la ÚNICA UI de filtros (no hay chips duplicados abajo).
// Geo en cascada: el país filtra estados y ciudades; el estado filtra
// ciudades y, sin ciudad, busca en su propia página. El texto despliega
// exploración al enfocar (tipos, operación, destinos) y autocompleta al
// escribir (lugares + propiedades, igual que el header); Enter abre el
// resaltado o la búsqueda completa. Con ciudad va a su página; con texto al
// hub; solo filtros se quedan en `base` (la página actual). Inventario real
// (API) mezclado con el registro estático: siempre hay opciones.
//
// Esta tarjeta (<HeroCard/>) se pinta inline en tablet/desktop y dentro de
// un sheet modal en móvil — ver <PropertySearchHero/> al final. Una sola
// implementación, dos presentaciones: cero lógica duplicada.
const HeroCard = ({ idPrefix, base, onNavigate, startOpen = false }) => {
  const router = useRouter();
  const textRef = useRef(null);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [estado, setEstado] = useState("");
  const [cityKey, setCityKey] = useState("");
  const [tipo, setTipo] = useState("");
  const [operacion, setOperacion] = useState("");
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(startOpen);
  const [active, setActive] = useState(-1);
  const term = q.trim();
  const { items, loading } = useSearchSuggest(term);

  // Prefill desde la URL: país/estado/ciudad según el path (así los
  // selects muestran dónde estás después de buscar); tipo/operación en
  // cualquier página de listado; texto solo en el hub, único que busca
  // por texto.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (window.location.pathname === "/propiedades") {
        setQ(params.get("q") || "");
      }
      const geo = guessGeoFromPath(window.location.pathname);
      if (geo.country) setCountry(geo.country);
      if (geo.stateSlug) setEstado(geo.stateSlug);
      if (geo.cityKey) setCityKey(geo.cityKey);
      const t = params.get("tipo") || "";
      if (t && PROPERTY_TYPES[t]) setTipo(t);
      const op = params.get("operacion") || "";
      if (op === "venta" || op === "renta") setOperacion(op);
    } catch {
      // Sin URLSearchParams: arranca vacío, igual funciona.
    }
  }, []);

  // Cierra el dropdown al hacer click fuera del campo de texto.
  useEffect(() => {
    const onPointerDown = (e) => {
      if (textRef.current && !textRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo/listing-cities")
      .then((res) => (res.ok ? res.json() : { cities: [] }))
      .then((data) => {
        if (!cancelled) setInventory(data.cities || []);
      })
      .catch(() => {
        if (!cancelled) setInventory([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Estados del select: inventario real (con conteo) + registro curado,
  // filtrados por el país elegido.
  const estados = useMemo(() => {
    const map = new Map();
    for (const c of inventory) {
      if (country && c.country !== country) continue;
      const cur = map.get(c.stateSlug) || {
        slug: c.stateSlug,
        name: c.state,
        count: 0,
      };
      cur.count += c.count || 0;
      map.set(c.stateSlug, cur);
    }
    for (const slug of allStateSlugs()) {
      const guide = stateGuides[slug];
      if (!guide) continue;
      if (country && guide.country !== country) continue;
      if (!map.has(slug)) {
        map.set(slug, { slug, name: guide.name, count: 0 });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, country]);

  const groups = useMemo(() => {
    const byState = new Map();
    const push = (stateSlug, stateName, entry) => {
      if (!byState.has(stateSlug)) {
        byState.set(stateSlug, {
          slug: stateSlug,
          name: stateName,
          cities: [],
        });
      }
      byState.get(stateSlug).cities.push(entry);
    };
    const inCountry = (c) => !country || c.country === country;
    const inState = (stateSlug) => !estado || stateSlug === estado;
    for (const c of inventory) {
      if (!inCountry(c) || !inState(c.stateSlug)) continue;
      push(c.stateSlug, c.state, {
        key: `${c.stateSlug}/${c.citySlug}`,
        label: `${c.city} (${c.count})`,
        stateSlug: c.stateSlug,
        citySlug: c.citySlug,
      });
    }
    const listed = new Set(
      inventory.map((c) => `${c.stateSlug}/${c.citySlug}`),
    );
    for (const c of popularCities) {
      if (listed.has(`${c.stateSlug}/${c.citySlug}`)) continue;
      if (!inCountry(c) || !inState(c.stateSlug)) continue;
      push(c.stateSlug, c.state, {
        key: `${c.stateSlug}/${c.citySlug}`,
        label: c.city,
        stateSlug: c.stateSlug,
        citySlug: c.citySlug,
      });
    }
    return [...byState.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, country, estado]);

  // Cascada país → estado → ciudad: al cambiar un nivel se limpia lo elegido
  // abajo si quedó fuera (evita combinaciones imposibles como país=España +
  // ciudad=Delicias).
  const onCountryChange = (value) => {
    setCountry(value);
    let nextEstado = estado;
    if (value && estado) {
      const estadoOk =
        inventory.some((c) => c.stateSlug === estado && c.country === value) ||
        stateGuides[estado]?.country === value;
      if (!estadoOk) {
        setEstado("");
        nextEstado = "";
      }
    }
    if (!cityKey || !value) return;
    const [stateSlug, citySlug] = cityKey.split("/");
    const match =
      inventory.find(
        (c) => c.stateSlug === stateSlug && c.citySlug === citySlug,
      ) ||
      popularCities.find(
        (c) => c.stateSlug === stateSlug && c.citySlug === citySlug,
      );
    if (match?.country !== value || (nextEstado && stateSlug !== nextEstado)) {
      setCityKey("");
    }
  };

  const onEstadoChange = (value) => {
    setEstado(value);
    if (cityKey && value && !cityKey.startsWith(`${value}/`)) {
      setCityKey("");
    }
  };

  const selectedCity = cityKey
    ? (() => {
        const [stateSlug, citySlug] = cityKey.split("/");
        return stateSlug && citySlug ? { stateSlug, citySlug } : null;
      })()
    : null;

  // El panel abre al enfocar (modo exploración con campo corto) y cambia
  // a resultados al escribir ≥2 letras.
  const showPanel = open;
  const flat =
    term.length >= 2
      ? [...(items.geos || []), ...(items.properties || [])]
      : [];
  const hasResults = flat.length > 0;
  const optionId = (i) => `${idPrefix}-q-opt-${i}`;

  const go = (url) => {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(url);
  };

  // Búsqueda completa con todos los selects (país/estado/ciudad/tipo/
  // operación). Acepta overrides (los pills del modo exploración): el tipo
  // u operación elegido en el dropdown se combina con los selects actuales.
  const submitFull = (overrides = {}) => {
    // El select solo ofrece países del registro, así que el slug casi
    // siempre resuelve a su landing; si no, cae a búsqueda de texto.
    const slug = country ? slugify(country) : "";
    const countrySlug = slug && knownCountry(slug) ? slug : "";
    go(
      searchTarget({
        base,
        city: selectedCity,
        state: selectedCity ? undefined : estado || undefined,
        countrySlug: countrySlug || undefined,
        q: q.trim() || (!countrySlug && country) || undefined,
        tipo: overrides.tipo || tipo || undefined,
        operacion: overrides.operacion || operacion || undefined,
      }),
    );
  };

  // Hay algo que limpiar si hay texto o algún select/pill activo.
  const dirty = Boolean(
    term || country || estado || cityKey || tipo || operacion,
  );

  // Reinicia la búsqueda: vacía el formulario y vuelve a la raíz del
  // marketplace (/propiedades), sin geo ni filtros. A propósito NO usa
  // `base` (la página actual): restablecer siempre te saca a la raíz.
  const clearAll = () => {
    setQ("");
    setCountry("");
    setEstado("");
    setCityKey("");
    setTipo("");
    setOperacion("");
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push("/propiedades");
  };

  const onTextKeyDown = (e) => {
    if (e.key === "ArrowDown" && hasResults) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp" && hasResults) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // relative+z-20: .glass-card crea stacking context (backdrop-filter) que
  // atraparía el dropdown bajo contenido posterior (ej. tarjetas sticky).
  // z-20 lo eleva sobre el contenido sin tapar drawer (z-50) ni modal.
  return (
    <div className="glass-card rounded-3xl p-2.5 sm:p-3 relative z-20">
      <div
        className="flex gap-2 mb-1.5 sm:mb-2"
        role="group"
        aria-label="Operación"
      >
        {[
          { value: "", label: "Todas" },
          { value: "venta", label: "Comprar" },
          { value: "renta", label: "Rentar" },
        ].map((op) => (
          <button
            key={op.label}
            type="button"
            aria-pressed={operacion === op.value}
            onClick={() => setOperacion(op.value)}
            className={`btn btn-sm rounded-full min-h-[36px] ${
              operacion === op.value
                ? "btn-primary"
                : "btn-ghost border border-base-content/15"
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && flat[active]) go(flat[active].url);
          else submitFull();
        }}
      >
        <div className="mb-1.5 sm:mb-2 relative" ref={textRef}>
          <label htmlFor={`${idPrefix}-q`} className="sr-only">
            Buscar por texto
          </label>
          <input
            id={`${idPrefix}-q`}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={`${idPrefix}-q-listbox`}
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onTextKeyDown}
            placeholder="Ciudad, estado, país, colonia o palabra clave…"
            className="input input-bordered text-base w-full min-h-[44px] rounded-2xl"
          />
          {showPanel && (
            <SuggestPanel
              id={`${idPrefix}-q`}
              term={term}
              items={items}
              loading={loading}
              active={active}
              onActive={setActive}
              onPick={go}
              onPickFilter={(f) => submitFull(f)}
              onSubmitAll={() => submitFull()}
            />
          )}
        </div>

        <div className="grid gap-1.5 sm:gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-pais`} className="sr-only">
              País
            </label>
            <select
              id={`${idPrefix}-pais`}
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="select select-bordered text-base w-full min-h-[44px] rounded-2xl font-normal"
            >
              <option value="">Todos los países</option>
              {allCountries().map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-estado`} className="sr-only">
              Estado
            </label>
            <select
              id={`${idPrefix}-estado`}
              value={estado}
              onChange={(e) => onEstadoChange(e.target.value)}
              className="select select-bordered text-base w-full min-h-[44px] rounded-2xl font-normal"
            >
              <option value="">Todos los estados</option>
              {estados.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.count > 0 ? `${s.name} (${s.count})` : s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-ciudad`} className="sr-only">
              Ciudad
            </label>
            <select
              id={`${idPrefix}-ciudad`}
              value={cityKey}
              onChange={(e) => setCityKey(e.target.value)}
              className="select select-bordered text-base w-full min-h-[44px] rounded-2xl font-normal"
            >
              <option value="">Todas las ciudades</option>
              {groups.map((group) => (
                <optgroup key={group.slug} label={group.name}>
                  {group.cities.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-tipo`} className="sr-only">
              Tipo de propiedad
            </label>
            <select
              id={`${idPrefix}-tipo`}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="select select-bordered text-base w-full min-h-[44px] rounded-2xl font-normal"
            >
              <option value="">Todo tipo</option>
              {Object.entries(PROPERTY_TYPES).map(([key, labels]) => (
                <option key={key} value={key}>
                  {capFirst(labels.plural)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 mt-1.5 sm:mt-2">
          <button
            type="submit"
            className="btn btn-primary flex-1 min-w-0 min-h-[44px] rounded-2xl"
          >
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
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            Buscar
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={!dirty}
            title="Limpiar filtros y volver a Propiedades"
            aria-label="Limpiar filtros y volver a Propiedades"
            className="btn btn-ghost border border-base-content/15 min-h-[44px] rounded-2xl px-4 shrink-0 disabled:opacity-40"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// En móvil (<sm) el héroe completo ocuparía toda la pantalla: mejor una
// barra compacta estilo Airbnb que abre la misma tarjeta en un sheet modal
// de pantalla completa. El resumen (título/subtítulo) se deriva de la URL,
// no de estado: siempre refleja los filtros activos al abrir/cerrar.
const prettySlug = (slug) =>
  (slug || "")
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const PropertySearchHero = ({
  idPrefix = "hero-search",
  base = "/propiedades",
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Bloquea el scroll del fondo mientras el sheet está abierto.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const summary = useMemo(() => {
    const fallback = {
      title: "Buscar propiedades",
      sub: "Ciudad · Tipo · Operación",
    };
    try {
      const params = new URLSearchParams(window.location.search);
      const geo = guessGeoFromPath(window.location.pathname);
      const q = (params.get("q") || "").trim();
      const t = params.get("tipo") || "";
      const op = params.get("operacion") || "";
      if (!q && !geo.cityKey && !geo.stateSlug && !geo.country && !t && !op) {
        return fallback;
      }
      let place = "";
      if (geo.cityKey) {
        const [stateSlug, citySlug] = geo.cityKey.split("/");
        place =
          popularCities.find(
            (c) => c.stateSlug === stateSlug && c.citySlug === citySlug,
          )?.city || prettySlug(citySlug);
      } else if (geo.stateSlug) {
        place = stateGuides[geo.stateSlug]?.name || prettySlug(geo.stateSlug);
      } else if (geo.country) {
        place = geo.country;
      }
      const bits = [];
      if (t && PROPERTY_TYPES[t]) bits.push(capFirst(PROPERTY_TYPES[t].plural));
      if (op === "venta" || op === "renta")
        bits.push(capFirst(LISTING_TYPES[op]));
      const sub = [place && q ? place : null, ...bits]
        .filter(Boolean)
        .join(" · ");
      return {
        title: q ? `“${q}”` : place || "Buscar propiedades",
        sub: sub || "Ciudad · Tipo · Operación",
      };
    } catch {
      return fallback;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  return (
    <>
      {/* Móvil: barra compacta que abre el sheet. */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Abrir búsqueda de propiedades"
        className="sm:hidden w-full rounded-full pl-4 pr-2 py-2 flex items-center gap-3 text-left min-h-[56px] bg-base-100 border border-base-content/15 shadow-lg"
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            />
          </svg>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-sm truncate">
            {summary.title}
          </span>
          <span className="block text-xs opacity-60 truncate">
            {summary.sub}
          </span>
        </span>
        <span className="flex items-center justify-center w-10 h-10 rounded-full border border-base-content/15 shrink-0">
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
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
        </span>
      </button>

      {/* Tablet/desktop: héroe completo inline. */}
      <div className="hidden sm:block">
        <HeroCard idPrefix={idPrefix} base={base} />
      </div>

      {/* Móvil: sheet de pantalla completa con el héroe completo. */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buscar propiedades"
          className="sm:hidden fixed inset-0 z-[300] bg-base-100 overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-base-100/90 backdrop-blur-xl border-b border-base-content/10">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Cerrar búsqueda"
              className="btn btn-ghost btn-sm btn-circle min-w-[40px] min-h-[40px]"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <p className="font-bold">Buscar propiedades</p>
          </div>
          <div className="p-4 pb-16">
            <HeroCard
              idPrefix={`${idPrefix}-sheet`}
              base={base}
              startOpen
              onNavigate={() => setSheetOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PropertySearchHero;
