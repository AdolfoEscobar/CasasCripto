import { useEffect, useState } from "react";

// Hook compartido del autocompletado (header + héroe de búsqueda): con ≥2
// letras consulta /api/search/suggest con debounce de 250ms y aborta la
// petición anterior. Devuelve { properties, geos } + loading.
export function useSearchSuggest(term) {
  const [items, setItems] = useState({ properties: [], geos: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (term.length < 2) {
      setItems({ properties: [], geos: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(term)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) throw new Error(`suggest ${res.status}`);
        setItems(await res.json());
      } catch (e) {
        if (e?.name !== "AbortError") {
          setItems({ properties: [], geos: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  return { items, loading };
}
