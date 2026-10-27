import Link from "next/link";
import Image from "next/image";

// Avatar del autor en el artículo y en <CardArticle />. Si el autor no tiene
// foto (`avatar: null`, caso del autor editorial), muestra sus iniciales en
// un círculo con los colores de marca en vez de una imagen rota.
const Avatar = ({ article }) => {
  const { author } = article;

  return (
    <Link
      href={`/blog/author/${author.slug}`}
      title={`Artículos de ${author.name}`}
      className="inline-flex items-center gap-2 group"
      rel="author"
    >
      <span itemProp="author">
        {author.avatar ? (
          <Image
            src={author.avatar}
            alt=""
            className="w-7 h-7 rounded-full object-cover object-center"
            width={28}
            height={28}
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-content text-[11px] font-bold"
          >
            {author.initials || author.name.charAt(0)}
          </span>
        )}
      </span>
      <span className="group-hover:underline">{author.name}</span>
    </Link>
  );
};

export default Avatar;
