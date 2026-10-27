import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "../_assets/content";
import BadgeCategory from "../_assets/components/BadgeCategory";
import Avatar from "../_assets/components/Avatar";
import { getSEOTags, renderBreadcrumbSchema } from "@/libs/seo";
import config from "@/config";

export async function generateStaticParams() {
  return articles.map((article) => ({ articleId: article.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const article = articles.find(
    (article) => article.slug === resolvedParams.articleId
  );

  if (!article) {
    return getSEOTags({
      title: `Artículo no encontrado | Blog de ${config.appName}`,
      description: `El artículo que buscas no existe. Explora el blog de ${config.appName} sobre real estate y criptomonedas.`,
      canonicalUrlRelative: "/blog",
    });
  }

  return getSEOTags({
    title: `${article.title} | Blog de ${config.appName}`,
    description: article.description,
    keywords: article.keywords,
    // openGraph aquí alimenta la tarjeta de Twitter; el objeto Open Graph
    // completo (type article, fechas) va en extraTags y lo reemplaza.
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}`,
    },
    canonicalUrlRelative: `/blog/${article.slug}`,
    extraTags: {
      openGraph: {
        title: article.title,
        description: article.description,
        url: `https://${config.domainName}/blog/${article.slug}`,
        siteName: config.appName,
        images: [
          {
            url: article.image.urlRelative,
            width: 1200,
            height: 660,
            alt: article.image.alt,
          },
        ],
        locale: "es_ES",
        type: "article",
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt || article.publishedAt,
        authors: [`https://${config.domainName}/blog/author/${article.author.slug}`],
      },
    },
  });
}

export default async function Article({ params }) {
  const resolvedParams = await params;
  const article = articles.find(
    (article) => article.slug === resolvedParams.articleId
  );

  if (!article) {
    notFound();
  }

  const articlesRelated = articles
    .filter(
      (a) =>
        a.slug !== resolvedParams.articleId &&
        a.categories.some((c) =>
          article.categories.map((c) => c.slug).includes(c.slug)
        )
    )
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);

  const baseUrl = `https://${config.domainName}`;
  const articleUrl = `${baseUrl}/blog/${article.slug}`;
  const dateModified = article.updatedAt || article.publishedAt;

  // BlogPosting + FAQPage: el primero habilita resultados enriquecidos de
  // artículo (imagen, fecha, autor); el segundo, preguntas frecuentes en el
  // snippet. Solo se emite FAQPage cuando el artículo define `faqs` visibles
  // en el contenido (requisito de Google para este rich result).
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    headline: article.title,
    description: article.description,
    image: `${baseUrl}${article.image.urlRelative}`,
    datePublished: article.publishedAt,
    dateModified,
    inLanguage: "es",
    author: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: article.author.name,
      url: `${baseUrl}/blog/author/${article.author.slug}`,
    },
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  const faqSchema =
    article.faqs?.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        id={`json-ld-article-${article.slug}`}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          id={`json-ld-faq-${article.slug}`}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {renderBreadcrumbSchema([
        { name: "Inicio", url: `${baseUrl}/` },
        { name: "Blog", url: `${baseUrl}/blog` },
        { name: article.title, url: articleUrl },
      ])}

      {/* VOLVER AL BLOG */}
      <div>
        <Link
          href="/blog"
          className="link !no-underline text-base-content/80 hover:text-base-content inline-flex items-center gap-1"
          title="Volver al blog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Volver al blog
        </Link>
      </div>

      <article>
        {/* HEADER CON CATEGORÍAS, FECHA Y TÍTULO */}
        <section className="my-12 md:my-20 max-w-[800px]">
          <div className="flex items-center gap-4 mb-6">
            {article.categories.map((category) => (
              <BadgeCategory
                category={category}
                key={category.slug}
                extraStyle="!badge-lg"
              />
            ))}
            <span className="text-base-content/80" itemProp="datePublished">
              {new Date(`${article.publishedAt}T12:00:00`).toLocaleDateString(
                "es-ES",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 md:mb-8">
            {article.title}
          </h1>

          <p className="text-base-content/80 md:text-lg max-w-[700px]">
            {article.description}
          </p>
        </section>

        <div className="flex flex-col md:flex-row">
          {/* SIDEBAR CON AUTOR Y ARTÍCULOS RELACIONADOS */}
          <section className="max-md:pb-4 md:pl-12 max-md:border-b md:border-l md:order-last md:w-72 shrink-0 border-base-content/10">
            <p className="text-base-content/80 text-sm mb-2 md:mb-3">
              Publicado por
            </p>
            <Avatar article={article} />

            {articlesRelated.length > 0 && (
              <div className="hidden md:block mt-12">
                <p className=" text-base-content/80 text-sm  mb-2 md:mb-3">
                  Lectura relacionada
                </p>
                <div className="space-y-2 md:space-y-5">
                  {articlesRelated.map((article) => (
                    <div className="" key={article.slug}>
                      <p className="mb-0.5">
                        <Link
                          href={`/blog/${article.slug}`}
                          className="link link-hover hover:link-primary font-medium"
                          title={article.title}
                          rel="bookmark"
                        >
                          {article.title}
                        </Link>
                      </p>
                      <p className="text-base-content/80 max-w-full text-sm">
                        {article.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* CONTENIDO DEL ARTÍCULO */}
          <section className="w-full max-md:pt-4 md:pr-20 space-y-12 md:space-y-20">
            {article.content}
          </section>
        </div>
      </article>
    </>
  );
}
