import { Inter, Sora } from "next/font/google";
import { getSEOTags, renderSchemaTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import AmbientBackground from "@/components/AmbientBackground";
import AppShell from "@/components/AppShell";
import config from "@/config";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });
// Tipografía display para titulares (h1/h2) vía clase `font-display` —
// Sora le da al homepage una identidad fintech propia en vez de Inter en
// todos lados. El cuerpo sigue en Inter para legibilidad.
const displayFont = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }) {
	return (
		<html
			lang="es"
			data-theme={config.colors.theme}
			data-scroll-behavior="smooth"
			className={`${font.className} ${displayFont.variable}`}
		>
			<body>
				{/* Organization + WebSite structured data — una sola vez, para todo el sitio */}
				{renderSchemaTags()}
				{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
				{/* AppShell renders the global left sidebar navigation (replaces the
				    old floating Header) on every single page of the site. */}
				{/* AmbientBackground is the single site-wide backdrop (grid + brand
				    glows): it paints behind AppShell on every page automatically. */}
				<AmbientBackground />
				<ClientLayout>
					<AppShell>{children}</AppShell>
				</ClientLayout>
			</body>
		</html>
	);
}
