import Footer from "@/components/Footer";

// La navegación del blog ahora vive en el sidebar global (ver
// components/Sidebar.js / AppShell.js), montado una sola vez en
// app/layout.js — por eso este layout ya no renderiza su propio HeaderBlog.
export default async function LayoutBlog({ children }) {
  return (
    <div>
      <main className="min-h-screen max-w-6xl mx-auto p-8">{children}</main>

      <div className="h-24" />

      <Footer />
    </div>
  );
}
