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

export default function Home() {
  return (
    <>
      {/* Fondo ambiental ÚNICO para toda la landing (grid + glows dorado /
          cian / violeta — los 3 colores de marca, a la misma intensidad que
          el logo). `fixed` = no se repite ni se corta por sección, así no
          hay "costuras" entre Header, Hero y el resto de los bloques: es una
          sola imagen continua y vibrante detrás de absolutamente todo el
          contenido.

          ⚠️ A propósito SIN `z-index` negativo: con `position: fixed` +
          `z-index` negativo, Chrome pinta este div por DEBAJO del propio
          fondo de <html>/<body> (un caso límite real del "canvas
          background" del navegador) — eso es lo que causaba el fondo negro
          tapándolo todo. En vez de eso, dejamos este div sin z-index (nivel
          0) y envolvemos el resto del contenido (Header + main + Footer) en
          un wrapper `relative z-10` — así el stacking queda garantizado por
          CSS normal, sin depender de ese caso especial. */}
      <div aria-hidden="true" className="fixed inset-0 bg-base-100">
        {/* tinte base con los 3 colores de marca, para que SIEMPRE haya algo
            de color visible aunque los blobs queden fuera de un viewport
            muy ancho o muy angosto */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-secondary/12" />
        <div className="absolute inset-0 bg-grid-fade" />

        {/* oro — eco del techo/acento del logo */}
        <div className="absolute -top-20 -left-20 w-[36rem] h-[36rem] rounded-full bg-primary/45 blur-[100px] animate-float" />
        {/* cian/azul — eco de la casa hexagonal del logo */}
        <div
          className="absolute top-10 -right-24 w-[34rem] h-[34rem] rounded-full bg-secondary/40 blur-[100px] animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        {/* violeta — toque Web3/neón */}
        <div
          className="absolute top-[50%] -left-16 w-[30rem] h-[30rem] rounded-full bg-accent/35 blur-[100px] animate-float"
          style={{ animationDelay: "3s" }}
        />
        {/* oro extra a media altura, lado derecho, para que el color no se "acabe" en la mitad de la página */}
        <div
          className="absolute top-[75%] -right-20 w-[30rem] h-[30rem] rounded-full bg-primary/35 blur-[100px] animate-float"
          style={{ animationDelay: "4.5s" }}
        />
      </div>

      <div className="relative z-10">
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
      </div>
    </>
  );
}
