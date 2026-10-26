import { Inter } from "next/font/google";
import { getSEOTags, renderSchemaTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import AppShell from "@/components/AppShell";
import config from "@/config";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });

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
			className={font.className}
		>
			<body>
				{/* Organization + WebSite structured data — una sola vez, para todo el sitio */}
				{renderSchemaTags()}
				{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
				{/* AppShell renders the global left sidebar navigation (replaces the
				    old floating Header) on every single page of the site. */}
				<ClientLayout>
					<AppShell>{children}</AppShell>
				</ClientLayout>
			</body>
		</html>
	);
}
