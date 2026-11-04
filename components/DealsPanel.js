"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import CryptoIcon from "@/components/CryptoIcon";
import LoadingCircle from "@/components/common/LoadingCircle";
import { DEAL_STATUS } from "@/libs/deals";
import { explorerTxUrl, shortAddress } from "@/libs/chains";
import DealActions from "./DealActions";

const TABS = [
  { id: "received", label: "Recibidas" },
  { id: "made", label: "Enviadas" },
];

const TxLink = ({ chainId, hash, label }) => {
  const url = explorerTxUrl(chainId, hash);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link link-primary text-xs"
    >
      {label || shortAddress(hash)}
    </a>
  );
};

const DealCard = ({ deal, isSellerView, onUpdate }) => {
  const [busy, setBusy] = useState(false);
  const badge = DEAL_STATUS[deal.status] || {};
  const other = isSellerView ? deal.buyer : deal.seller;

  const act = async (action, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await apiClient.patch(`/deals/${deal.id}`, { action });
      onUpdate(res.data);
      toast.success(
        action === "accept"
          ? "Oferta aceptada. El comprador ya puede depositar."
          : action === "reject"
            ? "Oferta rechazada."
            : "Oferta cancelada."
      );
    } catch (e) {
      // apiClient already toasts the error message
    } finally {
      setBusy(false);
    }
  };

  const expiry =
    deal.status === "offered" && deal.offerExpiresAt
      ? `Vence: ${new Date(deal.offerExpiresAt).toLocaleDateString("es-MX")}`
      : deal.status === "accepted" && deal.depositDeadline
        ? `Depósito antes del: ${new Date(deal.depositDeadline).toLocaleDateString("es-MX")}`
        : null;

  return (
    <li className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold">
            {deal.property?.title || "Propiedad"} ·{" "}
            <span className="text-primary inline-flex items-center gap-1">
              {deal.amountDisplay}
              <span aria-hidden="true" className="flex">
                <CryptoIcon symbol={deal.token} size={14} />
              </span>
              {deal.token}
            </span>
          </p>
          <p className="text-sm opacity-60">
            {isSellerView ? "Comprador" : "Vendedor"}:{" "}
            {other?.name || shortAddress(other?.walletAddress) || "—"}
            {deal.property?.city ? ` · ${deal.property.city}` : ""}
          </p>
          {expiry && <p className="text-xs opacity-60 mt-1">{expiry}</p>}
        </div>
        <span className={`badge badge-sm ${badge.className || ""}`}>
          {badge.text || deal.status}
        </span>
      </div>

      {(deal.createTx || deal.fundTx || deal.releaseTx || deal.refundTx) && (
        <div className="flex gap-3 flex-wrap">
          <TxLink chainId={deal.chainId} hash={deal.createTx} label="Creación" />
          <TxLink chainId={deal.chainId} hash={deal.fundTx} label="Depósito" />
          <TxLink chainId={deal.chainId} hash={deal.releaseTx} label="Liberación" />
          <TxLink chainId={deal.chainId} hash={deal.refundTx} label="Reembolso" />
        </div>
      )}

      {deal.onchainError && (
        <p
          className="text-xs text-warning break-words"
          title={deal.onchainError}
        >
          Aviso on-chain:{" "}
          {deal.onchainError.length > 160
            ? `${deal.onchainError.slice(0, 160)}…`
            : deal.onchainError}{" "}
          Se reintenta solo al sincronizar.
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {isSellerView && deal.status === "offered" && (
          <>
            <button
              className="btn btn-primary btn-xs"
              disabled={busy}
              onClick={() => act("accept")}
            >
              Aceptar
            </button>
            <button
              className="btn btn-ghost btn-xs"
              disabled={busy}
              onClick={() => act("reject", "¿Rechazar esta oferta?")}
            >
              Rechazar
            </button>
          </>
        )}
        {!isSellerView &&
          ["offered", "accepted"].includes(deal.status) &&
          !deal.fundTx && (
            <button
              className="btn btn-ghost btn-xs text-error"
              disabled={busy}
              onClick={() => act("cancel", "¿Cancelar esta oferta?")}
            >
              Cancelar
            </button>
          )}
      </div>

      <DealActions deal={deal} isBuyer={!isSellerView} onUpdate={onUpdate} />
    </li>
  );
};

// Panel de ofertas del dashboard: recibidas (como vendedor) y enviadas (como
// comprador), con acciones off-chain y botones on-chain (DealActions).
const DealsPanel = () => {
  const { status } = useSession();
  const [tab, setTab] = useState("received");
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  // Guardia anti-carrera: solo la última respuesta pinta (ver admin/deals).
  const reqId = useRef(0);

  const fetchDeals = useCallback(async (role) => {
    const my = ++reqId.current;
    try {
      setLoading(true);
      const res = await apiClient.get(`/deals?role=${role}`);
      if (reqId.current === my) setDeals(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (reqId.current === my) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDeals(tab);
    }
  }, [tab, status, fetchDeals]);

  const handleUpdate = (updated) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  if (status !== "authenticated") return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-lg">Ofertas con escrow</h2>
        <div role="tablist" className="tabs tabs-boxed tabs-sm w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              className={`tab ${tab === t.id ? "tab-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingCircle />
      ) : deals.length === 0 ? (
        <p className="opacity-60 text-sm">
          {tab === "received"
            ? "Nadie ha ofertado por tus propiedades todavía."
            : "Aún no has hecho ninguna oferta."}
        </p>
      ) : (
        <ul className="space-y-3">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isSellerView={tab === "received"}
              onUpdate={handleUpdate}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default DealsPanel;
