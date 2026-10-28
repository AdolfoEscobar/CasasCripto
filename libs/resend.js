import { Resend } from "resend";
import config from "@/config";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using the provided parameters.
 *
 * @async
 * @param {Object} params - The parameters for sending the email.
 * @param {string | string[]} params.to - The recipient's email address or an array of email addresses.
 * @param {string} params.subject - The subject of the email.
 * @param {string} params.text - The plain text content of the email.
 * @param {string} params.html - The HTML content of the email.
 * @param {string} [params.replyTo] - The email address to set as the "Reply-To" address.
 * @returns {Promise<Object>} A Promise that resolves with the email sending result data.
 */
export const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  const { data, error } = await resend.emails.send({
    from: config.resend.fromAdmin,
    to,
    subject,
    text,
    html,
    ...(replyTo && { replyTo }),
  });

  if (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }

  return data;
};

// ---------------------------------------------------------------------------
// Correo de acceso (Magic Link) del login — usado por NextAuth vía
// sendVerificationRequest en libs/auth.js. Paleta "elite fintech" de la app
// (ver app/globals.css) convertida a HEX: los clientes de correo no
// entienden oklch() ni DaisyUI.
// ---------------------------------------------------------------------------

const BRAND = {
  bg: "#0B0F1A", // base-100 obsidiana
  card: "#141B2E", // base-200
  border: "#2B3552",
  gold: "#E3BA5F", // primary (== config.colors.main)
  cyan: "#5BC8E8", // secondary
  text: "#F2F4F8", // base-content
  muted: "#A8B0BE",
  faint: "#7C8598",
  buttonText: "#1A1405", // primary-content
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const getMagicLinkSubject = () =>
  `Tu enlace de acceso a ${config.appName}`;

export const getMagicLinkText = ({ url, email }) =>
  [
    `Hola${email ? ` ${email}` : ""},`,
    "",
    `Usa este enlace para entrar a ${config.appName}:`,
    url,
    "",
    "El enlace caduca en 24 horas y solo puede usarse una vez.",
    "Si no solicitaste este correo, puedes ignorarlo con total seguridad.",
    "",
    `— El equipo de ${config.appName}`,
    `https://${config.domainName}`,
  ].join("\n");

// Layout con tablas y estilos 100 % inline: compatible con Gmail, Outlook y
// Apple Mail. Sin dependencias externas salvo el logo.
export const getMagicLinkHtml = ({ url, email }) => {
  const safeUrl = escapeHtml(url);
  const safeEmail = escapeHtml(email || "");
  const year = new Date().getFullYear();
  const homeUrl = `https://${config.domainName}`;
  const logoUrl = `${homeUrl}/icon.png`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escapeHtml(getMagicLinkSubject())}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Tu enlace seguro para entrar a ${escapeHtml(config.appName)}. Caduca en 24 horas.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:${BRAND.gold};border-radius:12px 12px 0 0;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.card};border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};padding:32px 32px 8px 32px;text-align:center;">
              <img src="${logoUrl}" alt="${escapeHtml(config.appName)}" width="52" height="52" style="display:inline-block;width:52px;height:52px;border-radius:14px;" />
              <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:3px;font-weight:bold;color:${BRAND.gold};">
                ${escapeHtml(config.appName.toUpperCase())}
              </div>
              <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.faint};">
                ${escapeHtml(config.tagline)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.card};border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};padding:24px 32px 32px 32px;text-align:center;">
              <div style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:${BRAND.cyan};border:1px solid ${BRAND.cyan};border-radius:999px;padding:6px 16px;">
                ACCESO SEGURO
              </div>
              <h1 style="margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:32px;font-weight:bold;color:${BRAND.text};">
                Entra a tu cuenta
              </h1>
              <p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:${BRAND.muted};">
                Hola${safeEmail ? ` <span style="color:${BRAND.text};">${safeEmail}</span>` : ""},
                pulsa el bot&oacute;n para iniciar sesi&oacute;n en
                <span style="color:${BRAND.text};font-weight:bold;"> ${escapeHtml(config.appName)}</span>.
                Sin contrase&ntilde;as, sin esperas.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}" style="display:inline-block;background-color:${BRAND.gold};color:${BRAND.buttonText};font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;border-radius:10px;padding:15px 40px;">
                      Acceder a ${escapeHtml(config.appName)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.faint};">
                Este enlace caduca en 24 horas y solo puede usarse una vez.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;text-align:left;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.faint};margin-bottom:6px;">
                      Si el bot&oacute;n no funciona, copia y pega este enlace en tu navegador:
                    </div>
                    <a href="${safeUrl}" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.cyan};word-break:break-all;text-decoration:underline;">
                      ${safeUrl}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.faint};">
                Si no solicitaste este correo, puedes ignorarlo con total seguridad.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:${BRAND.faint};">
                &copy; ${year} ${escapeHtml(config.appName)} &middot;
                <a href="${homeUrl}" style="color:${BRAND.gold};text-decoration:none;">${escapeHtml(config.domainName)}</a>
              </p>
              <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:${BRAND.faint};">
                <a href="${homeUrl}/tos" style="color:${BRAND.muted};text-decoration:underline;">T&eacute;rminos</a>
                &nbsp;&middot;&nbsp;
                <a href="${homeUrl}/privacy-policy" style="color:${BRAND.muted};text-decoration:underline;">Privacidad</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${escapeHtml(config.resend.supportEmail)}" style="color:${BRAND.muted};text-decoration:underline;">Soporte</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Envía el correo de acceso (Magic Link) del login con la plantilla
 * corporativa. Lo llama NextAuth desde libs/auth.js.
 */
export const sendMagicLinkEmail = async ({ to, url }) => {
  const { data, error } = await resend.emails.send({
    from: config.resend.fromNoReply,
    to,
    subject: getMagicLinkSubject(),
    text: getMagicLinkText({ url, email: to }),
    html: getMagicLinkHtml({ url, email: to }),
  });

  if (error) {
    console.error("Error sending magic link email:", error.message);
    throw error;
  }

  return data;
};
