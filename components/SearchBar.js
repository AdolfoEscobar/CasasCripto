"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchSuggest } from "@/libs/useSearchSuggest";
import SuggestPanel from "@/components/SuggestPanel";
import { geoPageUrl } from "@/libs/propertyUrls.mjs";

// Buscador del header (desktop + móvil): al enfocar despliega exploración
// (tipos, operación, destinos) y al escribir (≥2 letras) resultados
// (propiedades + lugares). Enter abre el resaltado (o la búsqueda
// completa), Escape cierra, click fuera cierra. El prefill se lee de
// window.location al montar (a propósito NO useSearchParams: en el layout
// global exigiría un Suspense que complica el shell por un detalle menor).
const SearchBar = ({
  className = "",
  autoFocus = false,
  id = "site-search",
}) => {
  const router = useRouter();
  const rootRef = useRef(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const term = q.trim();
  const { items, loading } = useSearchSuggest(term);

  useEffect(() => {
    try {
      if (window.location.pathname === "/propiedades") {
        setQ(new URLSearchParams(window.location.search).get("q") || "");
      }
    } catch {
      // Navegadores sin URLSearchParams: arranca vacío, igual funciona.
    }
  }, []);

  // Cierra al hacer click fuera del buscador.
  useEffect(() => {
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // El panel abre al enfocar (modo exploración con campo corto) y cambia
  // a resultados al escribir ≥2 letras.
  const showPanel = open;
  const flat =
    term.length >= 2
      ? [...(items.geos || []), ...(items.properties || [])]
      : [];
  const hasResults = flat.length > 0;
  const optionId = (i) => `${id}-opt-${i}`;

  const go = (url) => {
    setOpen(false);
    setActive(-1);
    router.push(url);
  };

  const submitSearch = () => {
    go(term ? `/propiedades?q=${encodeURIComponent(term)}` : "/propiedades");
  };

  const pickFilter = ({ tipo, operacion } = {}) => {
    go(geoPageUrl("/propiedades", { tipo, operacion }));
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" && hasResults) {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp" && hasResults) {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form
      ref={rootRef}
      role="search"
      className={`relative flex items-center gap-2 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && flat[active]) go(flat[active].url);
        else submitSearch();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar propiedades
      </label>
      <input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Ciudad, estado, país, colonia o palabra clave…"
        autoFocus={autoFocus}
        className="input input-bordered text-base input-sm w-full min-h-[40px] rounded-full bg-base-100/80"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="btn btn-ghost btn-sm btn-circle shrink-0 min-w-[40px] min-h-[40px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          />
        </svg>
      </button>

      {showPanel && (
        <SuggestPanel
          id={id}
          term={term}
          items={items}
          loading={loading}
          active={active}
          onActive={setActive}
          onPick={go}
          onPickFilter={pickFilter}
          onSubmitAll={submitSearch}
        />
      )}
    </form>
  );
};

export default SearchBar;
