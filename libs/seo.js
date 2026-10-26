import config from "@/config";

// These are all the SEO tags you can add to your pages.
// It prefills data with default title/description/OG, etc.. and you can cusotmize it for each page.
// It's already added in the root layout.js so you don't have to add it to every pages
// But I recommend to set the canonical URL for each page (export const metadata = getSEOTags({canonicalUrlRelative: "/"});)
// See https://shipfa.st/docs/features/seo
export const getSEOTags = ({
  title,
  description,
  keywords,
  openGraph,
  canonicalUrlRelative,
  extraTags,
} = {}) => {
  return {
    // up to 50 characters (what does your app do for the user?) > your main should be here
    title: title || config.appName,
    // up to 160 characters (how does your app help the user?)
    description: description || config.appDescription,
    // some keywords separated by commas. by default it will be your app name
    keywords: keywords || [config.appName],
    applicationName: config.appName,
    // set a base URL prefix for other fields that require a fully qualified URL (.e.g og:image: og:image: 'https://yourdomain.com/share.png' => '/share.png')
    metadataBase: new URL(
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/"
        : `https://${config.domainName}/`
    ),

    openGraph: {
      title: openGraph?.title || config.appName,
      description: openGraph?.description || config.appDescription,
      url: openGraph?.url || `https://${config.domainName}/`,
      siteName: openGraph?.title || config.appName,
      // If you add an opengraph-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [
      //   {
      //     url: `https://${config.domainName}/share.png`,
      //     width: 1200,
      //     height: 660,
      //   },
      // ],
      locale: "es_ES",
      type: "website",
    },

    twitter: {
      title: openGraph?.title || config.appName,
      description: openGraph?.description || config.appDescription,
      // If you add an twitter-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [openGraph?.image || defaults.og.image],
      card: "summary_large_image",
    },

    // If a canonical URL is given, we add it. The metadataBase will turn the relative URL into a fully qualified URL
    ...(canonicalUrlRelative && {
      alternates: { canonical: canonicalUrlRelative },
    }),

    // If you want to add extra tags, you can pass them here
    ...extraTags,
  };
};

// Structured Data (JSON-LD) para resultados enriquecidos en Google. Se
// renderiza una sola vez, en el <head> global (app/layout.js), no por
// página — es la entidad de marca del sitio completo, no de una página en
// particular. Usa Organization + WebSite (no "SoftwareApplication": Casas
// Cripto es un marketplace inmobiliario, no una app de software) para que
// Google entienda qué es la marca y, con tráfico, pueda mostrar un sitelinks
// search box. Deliberadamente SIN `sameAs` (redes sociales): los links del
// Footer son placeholders ("#") hoy — publicar URLs falsas en structured
// data es peor que no incluir el campo. Agrégalo en cuanto existan cuentas
// reales. Learn more: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
export const renderSchemaTags = () => {
  const baseUrl = `https://${config.domainName}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: config.appName,
        url: baseUrl,
        logo: `${baseUrl}/icon.png`,
        description: config.appDescription,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: config.appName,
        description: config.appDescription,
        publisher: { "@id": `${baseUrl}/#organization` },
        inLanguage: "es",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      id="json-ld-organization"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    ></script>
  );
};

// BreadcrumbList JSON-LD reutilizable — usado en /propiedades/[id] y
// /propiedades/ciudad/[slug] para que Google pueda mostrar la ruta de
// navegación (breadcrumbs) directamente en el resultado de búsqueda.
// `items` es un array de { name, url } en orden, del más general al actual.
export const renderBreadcrumbSchema = (items) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      id="json-ld-breadcrumb"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    ></script>
  );
};
