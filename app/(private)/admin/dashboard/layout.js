import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";

// This is a server-side component to ensure the user is logged in and is an admin
// If not, it will redirect to the login page.
// It's applied to all subpages of /admin/dashboard in /app/dashboard/*** pages
//
// La navegación (incluyendo los links de Admin: Dashboard/Usuarios/
// Propiedades) ahora vive en el sidebar global (ver components/Sidebar.js),
// que ya los muestra automáticamente cuando la ruta empieza con "/admin" —
// por eso este layout ya no monta su propio drawer/Sidebar/MobileHeader.
export default async function LayoutAdminPrivate({ children }) {
  const session = await auth();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  if (session.user.role !== "admin") {
    redirect(config.auth.callbackUrl);
  }

  return <div className="p-4 sm:p-6 lg:p-8">{children}</div>;
}
