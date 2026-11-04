import config from "../config.js";

// Notificaciones por email del ciclo de deals. Plantilla compacta con la
// paleta de marca (igual que libs/resend.js). Import dinámico de resend:
// si falta RESEND_API_KEY no debe tumbar la API (el email es mejor esfuerzo).
const COLORS = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#2B3552",
  gold: "#E3BA5F",
  text: "#F2F4F8",
  muted: "#A8B0BE",
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const SUBJECTS = {
  offered: "Nueva oferta por tu propiedad",
  accepted: "¡Aceptaron tu oferta!",
  rejected: "Tu oferta fue rechazada",
  funded: "Depósito recibido en escrow",
  released: "Fondos liberados",
  refunded: "Reembolso del escrow",
  expired: "Una oferta venció",
  cancelled: "Una oferta fue cancelada",
};

function dealHtml({ title, lines, ctaUrl, ctaLabel }) {
  const homeUrl = `https://${config.domainName}`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${COLORS.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
        <tr><td style="background-color:${COLORS.gold};border-radius:12px 12px 0 0;height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="background-color:${COLORS.card};border-left:1px solid ${COLORS.border};border-right:1px solid ${COLORS.border};border-bottom:1px solid ${COLORS.border};border-radius:0 0 12px 12px;padding:32px;text-align:center;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:3px;font-weight:bold;color:${COLORS.gold};">${escapeHtml(config.appName.toUpperCase())}</div>
          <h1 style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:${COLORS.text};">${escapeHtml(title)}</h1>
          ${lines.map((l) => `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${COLORS.muted};">${l}</p>`).join("")}
          <a href="${escapeHtml(ctaUrl || homeUrl)}" style="display:inline-block;margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1A1405;background-color:${COLORS.gold};border-radius:8px;padding:12px 28px;text-decoration:none;">${escapeHtml(ctaLabel || "Ver mi panel")}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Envía (mejor esfuerzo) un aviso de deal. to puede ser null (cuentas solo
// wallet sin correo): en ese caso no hay nada que enviar.
export async function sendDealEmail({ to, type, propertyTitle, amountText }) {
  if (!to) return false;
  try {
    const { sendEmail } = await import("./resend");
    const subject = `${SUBJECTS[type] || "Actualización de tu oferta"} — ${config.appName}`;
    const detail = propertyTitle
      ? `<strong style="color:${COLORS.text};">${escapeHtml(propertyTitle)}</strong>${amountText ? ` · ${escapeHtml(amountText)}` : ""}`
      : "";
    await sendEmail({
      to,
      subject,
      text: `${SUBJECTS[type] || "Actualización"}${propertyTitle ? `: ${propertyTitle}` : ""}${amountText ? ` (${amountText})` : ""}. Revisa tu panel: https://${config.domainName}/dashboard`,
      html: dealHtml({
        title: SUBJECTS[type] || "Actualización de tu oferta",
        lines: detail ? [detail] : [],
        ctaUrl: `https://${config.domainName}/dashboard`,
      }),
    });
    return true;
  } catch (e) {
    console.error("Deal email failed:", e?.message || e);
    return false;
  }
}
