import config from "@/config";

// Iconos de marca (heroicons no trae logos). Instagram dibujado con trazos,
// X y Telegram con sus glyphs oficiales en fill — todos heredan
// `currentColor` para adaptarse al tema.
const paths = {
  instagram: (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.2" cy="6.8" r="1.4" fill="currentColor" />
    </>
  ),
  x: (
    <path
      fill="currentColor"
      d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"
    />
  ),
  telegram: (
    <path
      fill="currentColor"
      d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
    />
  ),
};

export function SocialIcon({ name, className = "w-5 h-5" }) {
  if (!paths[name]) return null;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// Fila de iconos sociales (sidebar). Los links viven en config.socials.
const SocialIcons = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {config.socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${s.label} de ${config.appName}`}
          aria-label={`${s.label} de ${config.appName}`}
          className="p-2 rounded-lg text-base-content/55 hover:text-primary hover:bg-base-content/5 transition-colors duration-200"
        >
          <SocialIcon name={s.icon} />
        </a>
      ))}
    </div>
  );
};

export default SocialIcons;
