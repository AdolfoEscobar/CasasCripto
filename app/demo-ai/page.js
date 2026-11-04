import { getSEOTags } from "@/libs/seo";
import DemoAIClient from "./DemoAIClient";

// Demo pública (sin login) de la integración de Meta Model API — pensada
// para jueces del Meta Global AI Developer Hackathon y para compartir en
// redes/Discord sin pedirle a nadie que cree cuenta primero. La misma IA
// (Muse Spark, Muse Image, SAM 3.1) que usa el dueño real en /dashboard,
// pero con un límite diario mucho más estricto por IP (ver
// libs/aiRateLimit.js) para proteger el crédito compartido del hackathon.
export const metadata = getSEOTags({
  title: "Demo de Meta AI | Casas Cripto",
  description:
    "Demo en vivo: Casas Cripto usa IA de Meta para redactar, ilustrar y revisar listados inmobiliarios que aceptan cripto.",
  canonicalUrlRelative: "/demo-ai",
});

export default function DemoAIPage() {
  return <DemoAIClient />;
}
