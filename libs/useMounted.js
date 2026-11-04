"use client";

import { useEffect, useState } from "react";

// True solo tras el mount en cliente. Úsalo para compuertas de render que
// dependen de estado solo-cliente (ej. conexión wagmi rehidratada desde
// localStorage): así el SSR y el primer render coinciden y no hay mismatch.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
