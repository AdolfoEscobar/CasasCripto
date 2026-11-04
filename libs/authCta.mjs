// Decisiones puras del flujo de login con modal (sin React, testeable con
// `node --test` — ver .test.mjs). Las usan el trigger de URL
// (AuthModalContext) y el CTA compartido (ButtonAuthCta).

// Estado del trigger ?auth=signin (redirects de servidor a páginas privadas).
// `opened` es si ya se abrió con el parámetro actual. Regla clave: cuando el
// parámetro desaparece (la URL se limpia tras abrir), el trigger SE REARMA,
// para que un segundo ?auth=signin sí abra el modal en vez de ignorarse.
export function nextUrlTrigger({ authParam, opened } = {}) {
  if (authParam !== "signin") return { open: false, opened: false };
  if (opened) return { open: false, opened: true };
  return { open: true, opened: true };
}

// Cómo renderiza un CTA que requiere login según la sesión:
// logueado → link normal al destino; invitado (o aún cargando) → botón que
// abre el modal en el lugar y vuelve al destino vía callbackUrl.
export function ctaRendersLink(status) {
  return status === "authenticated";
}
