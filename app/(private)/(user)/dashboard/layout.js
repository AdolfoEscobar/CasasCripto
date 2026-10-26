import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default async function LayoutPrivate({ children }) {
  const session = await auth();

  if (!session) {
    // Pass callbackUrl so the user lands back on the dashboard (and can
    // keep going straight to creating their listing) right after login,
    // instead of being dropped on the homepage.
    redirect(`${config.auth.loginUrl}?callbackUrl=${encodeURIComponent(config.auth.callbackUrl)}`);
  }

  return <>{children}</>;
}
