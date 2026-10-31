import Link from "next/link";
import PropertyImage from "./PropertyImage";

// Tarjeta de propiedad reutilizada en /propiedades y en
// /propiedades/ciudad/[slug]. Cada tarjeta enlaza a la página de detalle
// propia de la propiedad (/propiedades/[id]), que es la que realmente le
// aporta SEO al sitio (título, meta y datos estructurados únicos).
export const isCurrentlyFeatured = (property) =>
  property.featured &&
  property.featuredUntil &&
  new Date(property.featuredUntil).getTime() > Date.now();

const PropertyCard = ({ property }) => (
  <Link
    href={`/propiedades/${property.id}`}
    className={`glass-card rounded-2xl overflow-hidden flex flex-col hover:ring-2 hover:ring-primary/50 transition-shadow ${
      isCurrentlyFeatured(property) ? "ring-2 ring-warning" : ""
    }`}
  >
    <div className="relative">
      {isCurrentlyFeatured(property) && (
        <span className="absolute top-3 left-3 badge badge-warning badge-sm font-semibold z-10 gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
          >
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
          Destacado
        </span>
      )}
      {property.images?.[0] ? (
        <PropertyImage
          image={property.images[0]}
          alt={property.title}
          className="w-full aspect-[4/3] object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-base-300 flex items-center justify-center text-base-content/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-12 h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
            />
          </svg>
        </div>
      )}
    </div>
    <div className="p-5 flex flex-col gap-2 flex-1">
      <p className="font-bold text-lg leading-snug line-clamp-2">{property.title}</p>
      <p className="text-sm opacity-60 truncate">
        {property.city}
        {property.country ? `, ${property.country}` : ""}
        {property.location ? ` · ${property.location}` : ""}
      </p>
      {property.description && (
        <p className="text-sm opacity-70 line-clamp-2">{property.description}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-base-content/10">
        <span className="font-extrabold text-gradient-gold whitespace-nowrap">
          ${property.price?.toLocaleString()} {property.currency}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5 min-w-0">
          {(property.cryptoAccepted || []).map((c) => (
            <span
              key={c}
              className="badge badge-ghost border border-base-content/10 text-xs"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  </Link>
);

export default PropertyCard;
