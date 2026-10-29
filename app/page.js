import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import MarketplacePreview from "@/components/MarketplacePreview";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import StatsSection from "@/components/StatsSection";
import Pricing from "@/components/Pricing";
import TokenRoadmap from "@/components/TokenRoadmap";
import InvestAndDonate from "@/components/InvestAndDonate";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { getSEOTags } from "@/libs/seo";

// Canonical del home: era la única página sin él. Evita que Google vea
// https://casascripto.com y https://www.casascripto.com (o con slash
// final distinto) como contenido duplicado y diluya autoridad.
export const metadata = getSEOTags({
  title: "Casas Cripto | El directorio de propiedades que aceptan cripto",
  canonicalUrlRelative: "/",
});

export default function Home() {
  // El fondo ambiental ahora es global (<AmbientBackground/> en
  // app/layout.js): esta página solo aporta su contenido.
  return (
    <>
      <main>
        <Hero />
        <Problem />
        <MarketplacePreview />
        <FeaturesAccordion />
        <StatsSection />
        <Pricing />
        <TokenRoadmap />
        <InvestAndDonate />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
