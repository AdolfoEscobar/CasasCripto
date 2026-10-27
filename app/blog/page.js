import { categories, articles } from "./_assets/content";
import CardArticle from "./_assets/components/CardArticle";
import CardCategory from "./_assets/components/CardCategory";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `Blog de ${config.appName} | Comprar y vender casas con cripto`,
  description:
    "Guías para comprar y vender casas con Bitcoin y stablecoins, impuestos, inversión en LatAm y tutoriales del marketplace crypto-friendly.",
  keywords: [
    "blog casas cripto",
    "comprar casa con criptomonedas",
    "vender propiedad bitcoin",
    "real estate cripto",
    "inmuebles crypto-friendly",
  ],
  canonicalUrlRelative: "/blog",
});

export default async function Blog() {
  const baseUrl = `https://${config.domainName}`;
  const articlesToDisplay = [...articles].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  // Blog + ItemList: le dice a Google que /blog es un blog y cuáles son sus
  // artículos, con posición y URL de cada uno.
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${baseUrl}/blog#blog`,
    name: `Blog de ${config.appName}`,
    description:
      "Guías sobre comprar y vender inmuebles con criptomonedas, legalidad, impuestos e inversión crypto-inmobiliaria.",
    url: `${baseUrl}/blog`,
    inLanguage: "es",
    publisher: { "@id": `${baseUrl}/#organization` },
    blogPost: articlesToDisplay.map((article, i) => ({
      "@type": "BlogPosting",
      position: i + 1,
      headline: article.title,
      description: article.description,
      url: `${baseUrl}/blog/${article.slug}`,
      datePublished: article.publishedAt,
      image: `${baseUrl}${article.image.urlRelative}`,
      author: {
        "@type": "Organization",
        name: article.author.name,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        id="json-ld-blog"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <section className="text-center max-w-2xl mx-auto mt-12 mb-16 md:mb-20">
        <p className="font-medium text-primary mb-3">Blog</p>
        <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6">
          Aprende a comprar y vender casas con cripto
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          Guías paso a paso para operar inmuebles con Bitcoin, USDC y USDT:
          compra, venta, impuestos, inversión en Latinoamérica y tutoriales
          del marketplace de {config.appName}.
        </p>
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
          Explora por categoría
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <CardCategory key={category.slug} category={category} tag="div" />
          ))}
        </div>
      </section>
    </>
  );
}
