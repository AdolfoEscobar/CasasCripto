import { formatUnits } from "viem";
import config from "../config.js";
import { leanToJSON } from "./leanToJSON.js";
import { tokenDecimals } from "./escrow.js";

export const DEAL_STATUS = {
  offered: { text: "Oferta enviada", className: "badge-info" },
  accepted: { text: "Aceptada · esperando depósito", className: "badge-warning" },
  rejected: { text: "Rechazada", className: "badge-error" },
  expired: { text: "Vencida", className: "badge-ghost" },
  cancelled: { text: "Cancelada", className: "badge-ghost" },
  funded: { text: "En escrow", className: "badge-warning" },
  released: { text: "Liberada al vendedor", className: "badge-success" },
  refunded: { text: "Reembolsada", className: "badge-ghost" },
};

// Estados con posible movimiento futuro (para filtros "activos").
export const ACTIVE_DEAL_STATUS = ["offered", "accepted", "funded"];

export function formatDealAmount(deal) {
  try {
    const n = Number(formatUnits(BigInt(deal.amount), tokenDecimals(deal.token)));
    return n.toLocaleString("es-MX", { maximumFractionDigits: 6 });
  } catch {
    return deal.amount;
  }
}

// Comisión 1.5 % al vendedor, calculada igual que el contrato (FEE_BPS=150).
export function dealFee(deal) {
  try {
    const amount = BigInt(deal.amount);
    const fee = (amount * BigInt(config.escrow.feeBps)) / 10000n;
    return {
      fee: fee.toString(),
      net: (amount - fee).toString(),
      feeDisplay: Number(formatUnits(fee, tokenDecimals(deal.token))),
    };
  } catch {
    return { fee: "0", net: deal.amount, feeDisplay: 0 };
  }
}

// Serializa un deal (lean, con populates) a JSON plano con `id` también en
// las referencias pobladas. No muta.
export function serializeDeal(doc) {
  if (!doc) return doc;
  const deal = leanToJSON(doc);
  for (const key of ["property", "buyer", "seller"]) {
    const ref = deal[key];
    if (ref && typeof ref === "object" && ref._id) {
      deal[key] = leanToJSON(ref);
    }
  }
  deal.amountDisplay = formatDealAmount(deal);
  deal.statusLabel = DEAL_STATUS[deal.status]?.text || deal.status;
  return deal;
}

// Aplica vencimientos perezosos sobre un documento Mongoose (no lean):
// oferta sin aceptar en 7 días → expired; aceptada sin fondear tras el
// depositDeadline → expired. Devuelve true si cambió (llamar save()).
export function applyDealExpiry(deal) {
  const now = new Date();
  if (
    deal.status === "offered" &&
    deal.offerExpiresAt &&
    deal.offerExpiresAt <= now
  ) {
    deal.status = "expired";
    return true;
  }
  if (
    deal.status === "accepted" &&
    deal.depositDeadline &&
    deal.depositDeadline <= now
  ) {
    deal.status = "expired";
    return true;
  }
  return false;
}
