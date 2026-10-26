import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// ⚠️ This is placeholder legal copy, not legal advice. Have a lawyer review
// and adapt this Privacy Policy (data retention, KYC/AML data when the
// marketplace launches, regional privacy laws like GDPR/CCPA, etc.) before
// this product handles real user data at scale.

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
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
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Política de Privacidad de {config.appName}
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

Gracias por visitar ${config.appName} ("nosotros"). Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información personal y no personal cuando usas nuestro sitio web ${config.domainName} (el "Sitio").

Al acceder o usar el Sitio, aceptas los términos de esta Política de Privacidad.

1. Información que recopilamos

1.1 Datos personales

Nombre y correo electrónico: para crear tu cuenta, autenticarte (Google o enlace mágico vía correo) y comunicarnos contigo sobre tu suscripción, donación o interés como inversionista.
Información de pago: procesada de forma segura por Stripe para suscripciones y donaciones. No almacenamos los datos completos de tu tarjeta en nuestros servidores.
Rol de usuario: guardamos tu rol dentro de la plataforma (usuario, propietario/agente, admin) para controlar el acceso a funciones privadas.

1.2 Datos no personales

Usamos cookies y tecnologías similares para entender el uso del Sitio, mejorar la experiencia y medir el rendimiento de nuestras páginas.

2. Para qué usamos tus datos

Para operar tu cuenta y las funciones a las que te suscribes, procesar pagos y donaciones, dar soporte, enviarte actualizaciones del proyecto (incluyendo, si lo autorizas, novedades sobre la ronda de inversión o el eventual token ${config.token.ticker}), y cumplir obligaciones legales y de prevención de fraude.

3. Compartición de datos

No vendemos tus datos personales. Compartimos información únicamente con proveedores necesarios para operar el servicio: Stripe (pagos), MongoDB Atlas (base de datos), Resend (correo transaccional) y proveedores de autenticación (Google). Si en el futuro habilitamos verificación de identidad (KYC/AML) para transacciones inmobiliarias, actualizaremos esta política antes de recopilar esos datos adicionales.

4. Privacidad de menores

${config.appName} no está dirigido a menores de 18 años. No recopilamos intencionalmente información de menores.

5. Tus derechos

Puedes solicitar acceso, corrección o eliminación de tus datos personales escribiéndonos a la dirección de contacto indicada abajo.

6. Cambios a esta Política

Podemos actualizar esta Política de Privacidad periódicamente. Los cambios relevantes se publicarán en esta página y, cuando corresponda, se notificarán por correo electrónico.

7. Contacto

Para cualquier duda sobre esta Política de Privacidad, escríbenos a:

${config.resend.supportEmail}

Al usar ${config.appName}, aceptas los términos de esta Política de Privacidad.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
