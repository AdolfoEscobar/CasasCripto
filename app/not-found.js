import Link from "next/link";
import Footer from "@/components/Footer";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Página no encontrada | Casas Cripto",
});

// 404 consistente con el diseño del sitio: tema oscuro `casascripto`, Sora
// en titulares (font-display), dorado primario y misma tarjeta/mensajería
// que los estados vacíos del marketplace. Se renderiza dentro del layout
// global (sidebar + fondo ambiental), igual que el resto de las páginas.
export default function Custom404() {
  return (
    <>
      <main className="min-h-screen">
        <div className="max-w-xl mx-auto px-5 sm:px-8 py-16 md:py-24">
          <div className="glass-card rounded-2xl p-10 text-center flex flex-col items-center gap-4">
            <p className="font-display font-extrabold text-7xl sm:text-8xl tracking-tight text-gradient-gold">
              404
            </p>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
              Página no encontrada
            </h1>
            <p className="opacity-70 leading-relaxed">
              La dirección que buscas no existe o cambió de lugar. Vuelve al
              inicio o explora las propiedades disponibles.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Link href="/" className="btn btn-primary">
                Volver al inicio
              </Link>
              <Link
                href="/propiedades"
                className="btn btn-ghost border border-base-content/20"
              >
                Ver propiedades
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
