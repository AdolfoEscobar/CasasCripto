import { categories, articles } from "./_assets/content";
import CardArticle from "./_assets/components/CardArticle";
import CardCategory from "./_assets/components/CardCategory";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `Blog de ${config.appName} | Real estate y criptomonedas`,
  description:
    "Noticias, guías y actualizaciones sobre el mercado inmobiliario cripto, el roadmap de producto y la ronda de inversión de Casas Cripto.",
  canonicalUrlRelative: "/blog",
});

export default async function Blog() {
  const articlesToDisplay = articles
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 6);
  return (
    <>
      <section className="text-center max-w-xl mx-auto mt-12 mb-24 md:mb-32">
        <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6">
          El Blog de {config.appName}
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          Noticias del mercado inmobiliario cripto, avances de producto y
          actualizaciones de nuestra ronda de inversión.
        </p>
        {/* ⚠️ Nota para dev: los artículos de app/blog/_assets/content.js
            siguen siendo contenido de ejemplo de ShipFast — reemplázalos por
            contenido real de Casas Cripto antes de publicar el blog. */}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 mb-24 md:mb-32 gap-8">
        {articlesToDisplay.map((article, i) => (
          <CardArticle
            article={article}
            key={article.slug}
            isImagePriority={i <= 2}
          />
        ))}
      </section>

      <section>
        <p className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Browse articles by category
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CardCategory key={category.slug} category={category} tag="div" />
          ))}
        </div>
      </section>
    </>
  );
}
