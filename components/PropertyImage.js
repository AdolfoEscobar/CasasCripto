import { normalizeImage } from "@/libs/propertyImages";

// Foto de propiedad servida DIRECTO desde el CDN (<img> plano, a propósito
// NO next/image): las variantes responsive ya salen pre-generadas del upload
// (ver app/api/uploads/route.js), así que pasarlas por el optimizador de
// Vercel solo gastaría cuota de Image Optimization sin aportar nada.
//
// Sin saltos de layout (width/height del archivo real), lazy por defecto y
// las URLs externas legadas (strings) siguen funcionando igual.
const PropertyImage = ({
  image,
  alt = "",
  sizes,
  className = "",
  // true solo para la foto principal de la página de detalle (LCP).
  eager = false,
}) => {
  const normalized = normalizeImage(image);
  if (!normalized) return null;

  return (
    <img
      src={normalized.src}
      {...(normalized.srcSet
        ? { srcSet: normalized.srcSet, sizes: sizes || "100vw" }
        : {})}
      alt={alt}
      {...(normalized.width &&
      normalized.height
        ? { width: normalized.width, height: normalized.height }
        : {})}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      {...(eager ? { fetchPriority: "high" } : {})}
    />
  );
};

export default PropertyImage;
