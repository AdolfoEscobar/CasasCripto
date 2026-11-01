import { permanentRedirect, redirect } from "next/navigation";
import { getPropertyByCitySlugAny } from "@/libs/propertyGeo";
import { cityUrl } from "@/libs/propertyUrls.mjs";

export const dynamic = "force-dynamic";

// Redirect 301 de la estructura vieja /propiedades/ciudad/[slug] (formato
// "ciudad-pais", ej. /propiedades/ciudad/delicias-mexico) a la nueva
// /propiedades/[estado]/[ciudad]. Existe para no romper backlinks ni perder
// la indexación que esas URLs ya hayan ganado.
// - Si hay al menos una propiedad publicada de esa ciudad (buscada por slug
//   legacy o nuevo) → 301 a su URL nueva.
// - Si no → redirect TEMPORAL al hub: la ciudad puede tener listados mañana,
//   así que un 301 aquí sería mentirle a Google.
export default async function CiudadLegacyRedirect({ params }) {
  const { slug } = await params;
  const match = await getPropertyByCitySlugAny(slug);

  if (match?.stateSlug && match?.citySlug) {
    permanentRedirect(cityUrl(match.stateSlug, match.citySlug));
  }

  redirect("/propiedades");
}
