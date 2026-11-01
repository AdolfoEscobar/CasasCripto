import { Suspense } from "react";
import { getSEOTags } from "@/libs/seo";
import AuthErrorCard from "@/components/auth/AuthErrorCard";
import config from "@/config";

export const metadata = {
  ...getSEOTags({
    title: `Error de acceso | ${config.appName}`,
  }),
  // Casos borde de login (OAuth denegado, magic link vencido): útil para
  // humanos, ruido para buscadores.
  robots: { index: false, follow: false },
};

// Destino de los errores de NextAuth (pages.signIn + pages.error en
// libs/auth.js). El login normal vive en el modal global y nunca llega
// aquí; esta página solo explica el fallo y ofrece reintentar.
export default function AuthErrorPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <AuthErrorCard />
      </Suspense>
    </main>
  );
}
