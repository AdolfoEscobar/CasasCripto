import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";

// This is a server-side component to ensure the user is logged in and is an admin
// If not logged in, it redirects home with ?auth=signin so the global login
// modal opens on landing (there is no login page anymore).
// It's applied to all subpages of /admin/dashboard in /app/dashboard/*** pages
//
// La navegación (incluyendo los links de Admin: Dashboard/Usuarios/
// Propiedades) ahora vive en el sidebar global (ver components/Sidebar.js),
// que ya los muestra automáticamente cuando la ruta empieza con "/admin" —
// por eso este layout ya no monta su propio drawer/Sidebar/MobileHeader.
//
// Private pages are never indexed (also disallowed in robots.js).
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function LayoutAdminPrivate({ children }) {
  const session = await auth();

  if (!session) {
    // callbackUrl preserva el destino: tras loguearse el admin cae
    // directo en /admin/dashboard en vez de en el dashboard de usuario.
    redirect(`/?auth=signin&callbackUrl=${encodeURIComponent("/admin/dashboard")}`);
  }

  if (session.user.role !== "admin") {
    redirect(config.auth.callbackUrl);
  }

  return <div className="p-4 sm:p-6 lg:p-8">{children}</div>;
}
