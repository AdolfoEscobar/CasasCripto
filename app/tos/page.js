import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// ⚠️ This is placeholder legal copy, not legal advice. Have a lawyer review
// and adapt these Terms (especially the donation / future-token / investor
// sections) before this product handles real money or real users.

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Términos y Condiciones de {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Última actualización: ${new Date().toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}

Bienvenido a ${config.appName}.

Estos Términos y Condiciones ("Términos") rigen tu uso del sitio web ${config.domainName} ("el Sitio") y los servicios ofrecidos por ${config.appName}. Al usar el Sitio, aceptas estos Términos.

1. Descripción del servicio

${config.appName} es una plataforma inmobiliaria en etapa de desarrollo (MVP) que busca conectar propietarios y agentes crypto-friendly con compradores interesados en adquirir propiedades usando criptomonedas. Algunas funciones descritas en el Sitio (marketplace completo de propiedades, custodia on-chain, token ${config.token.ticker}) se encuentran en construcción o en fase de diseño y pueden no estar disponibles todavía.

2. Suscripciones de propietarios/agentes

Los planes "Básico" y "Premium" son suscripciones de producto que dan acceso a funciones de listado de propiedades según lo descrito en la página de precios. Puedes cancelar tu suscripción en cualquier momento desde tu panel de cuenta; no se garantizan resultados de venta ni volumen de leads.

3. Donaciones

Las donaciones realizadas a través del Sitio (en USD vía Stripe o directamente en criptomonedas a las direcciones publicadas) son aportes voluntarios para apoyar el desarrollo del producto. No constituyen una compra de bienes o servicios, no son reembolsables salvo error de procesamiento, y no otorgan participación societaria, derechos de inversión ni expectativa de retorno.

4. Ronda de inversión y token ${config.token.ticker}

Ninguna información publicada en este Sitio constituye una oferta de venta de valores, participaciones societarias o instrumentos financieros. Cualquier ronda de inversión formal con inversionistas ángeles o fondos se documentará por separado conforme a la regulación aplicable. El token ${config.token.ticker} es un concepto de producto en diseño: su existencia final, características y lanzamiento dependen de validación legal y regulatoria, y no se vende, pre-vende ni se promete en este Sitio.

5. Datos del usuario y privacidad

Recopilamos y almacenamos datos de usuario (nombre, correo, información de pago procesada por Stripe) según lo necesario para operar el servicio. Consulta nuestra Política de Privacidad en ${config.domainName}/privacy-policy para más detalles.

6. Recopilación de datos no personales

Usamos cookies y tecnologías similares para mejorar el servicio y la experiencia de usuario.

7. Ley aplicable

Estos Términos se rigen por las leyes aplicables en la jurisdicción donde ${config.appName} esté formalmente constituida, la cual se especificará antes del lanzamiento comercial completo.

8. Cambios a estos Términos

Podemos actualizar estos Términos en cualquier momento. Notificaremos cambios relevantes por correo electrónico o mediante un aviso visible en el Sitio.

Para preguntas sobre estos Términos, contáctanos en ${config.resend.supportEmail}.

Gracias por confiar en ${config.appName}.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
