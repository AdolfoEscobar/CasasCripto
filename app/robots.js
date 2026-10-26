import config from "@/config";

// Permite indexar todo el sitio público; bloquea rutas privadas/admin/API
// que no aportan nada a Google y podrían filtrar datos de usuarios.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/"],
    },
    sitemap: `https://${config.domainName}/sitemap.xml`,
  };
}
