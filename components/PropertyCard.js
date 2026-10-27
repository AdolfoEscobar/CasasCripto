import Link from "next/link";
import Image from "next/image";

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
        <span className="absolute top-3 left-3 badge badge-warning badge-sm font-semibold z-10">
          ⭐ Destacado
        </span>
      )}
      {property.images?.[0] ? (
        <Image
          src={property.images[0]}
          alt={property.title}
          className="w-full aspect-[4/3] object-cover"
          width={600}
          height={450}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-base-300 flex items-center justify-center text-4xl">
          🏠
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
