import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";

// This is a server-side component to ensure the user is logged in.
// If not, it redirects home with ?auth=signin so the global login modal
// opens on landing (there is no login page anymore).
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
//
// Private pages are never indexed (also disallowed in robots.js).
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function LayoutPrivate({ children }) {
  const session = await auth();

  if (!session) {
    // Pass callbackUrl so the user lands back on the dashboard (and can
    // keep going straight to creating their listing) right after login,
    // instead of being dropped on the homepage.
    redirect(`/?auth=signin&callbackUrl=${encodeURIComponent(config.auth.callbackUrl)}`);
  }

  return <>{children}</>;
}
