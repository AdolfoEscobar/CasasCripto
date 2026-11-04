"use client";

import { useEffect, useRef, useState } from "react";
import apiClient from "@/libs/api";
import { toast } from "react-hot-toast";
import LoadingCircle from "@/components/common/LoadingCircle";
import { DEAL_STATUS } from "@/libs/deals";
import { explorerTxUrl, shortAddress } from "@/libs/chains";

const STATUS_FILTERS = [
  { id: "", label: "Todos" },
  { id: "offered", label: "Ofertas" },
  { id: "accepted", label: "Aceptados" },
  { id: "funded", label: "Fondeados" },
  { id: "released", label: "Liberados" },
  { id: "refunded", label: "Reembolsados" },
];

// Panel del árbitro: lista deals, resuelve disputas (liberar al vendedor o
// reembolsar al comprador, firmado con la llave del servidor) y pausa el
// escrow en emergencias. Tras resolver, sondea GET sync hasta que el estado
// avanza on-chain.
export default function AdminDealsPage() {
  const [filter, setFilter] = useState("funded");
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [escrow, setEscrow] = useState(null);
  const [busy, setBusy] = useState(null);
  // Guardia anti-carrera: si el usuario cambia de tab rápido, solo la última
  // respuesta pinta (una lenta no debe sobrescribir con datos del tab viejo).
  const reqId = useRef(0);

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get("/escrow/status");
      setEscrow(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeals = async (status) => {
    const my = ++reqId.current;
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/admin/deals?limit=50${status ? `&status=${status}` : ""}`
      );
      if (reqId.current === my) setDeals(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (reqId.current === my) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDeals(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const waitForSync = async (dealId, tries = 10) => {
    for (let i = 0; i < tries; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const res = await apiClient.get(`/deals/${dealId}/sync`);
        if (["released", "refunded"].includes(res.data?.status)) return res.data;
      } catch {
        // sigue intentando
      }
    }
    return null;
  };

  const resolve = async (deal, decision) => {
    const label =
      decision === "release" ? "LIBERAR al vendedor" : "REEMBOLSAR al comprador";
    if (
      !confirm(
        `¿${label} ${deal.amountDisplay} ${deal.token} del deal de "${deal.property?.title}"? Esta acción es on-chain e irreversible.`
      )
    ) {
      return;
    }
    setBusy(deal.id);
    try {
      const res = await apiClient.post(`/admin/deals/${deal.id}/resolve`, {
        decision,
      });
      toast.success(`Transacción enviada (${shortAddress(res.hash)}). Esperando confirmación…`);
      const updated = await waitForSync(deal.id);
      if (updated) {
        setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        toast.success(`Deal ${updated.status}.`);
      } else {
        toast("Aún sin confirmar. Recarga en unos segundos.", { icon: "⏳" });
        fetchDeals(filter);
      }
    } catch (e) {
      // apiClient already toasts the error message
    } finally {
      setBusy(null);
    }
  };

  const togglePause = async () => {
    const to = !escrow?.paused;
    if (
      !confirm(
        to
          ? "¿PAUSAR el escrow? Se congelan depósitos y liberaciones (los reembolsos siguen funcionando)."
          : "¿Reanudar el escrow?"
      )
    ) {
      return;
    }
    setBusy("pause");
    try {
      await apiClient.post("/admin/escrow/pause", { paused: to });
      toast.success(to ? "Escrow pausado." : "Escrow reanudado.");
      setTimeout(fetchStatus, 5000);
    } catch (e) {
      // apiClient already toasts the error message
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deals con escrow</h1>

      <div className="glass-card rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm space-y-1">
          <p>
            Red:{" "}
            <span className="font-semibold">
              {escrow?.chainName || "—"}
              {escrow?.testnet ? " (pruebas)" : ""}
            </span>{" "}
            {escrow?.paused && (
              <span className="badge badge-warning badge-sm ml-1">Pausado</span>
            )}
          </p>
          <p className="opacity-70">
            Contrato:{" "}
            {escrow?.address ? (
              <a
                href={explorerTxUrl(escrow.chainId, escrow.address)?.replace("/tx/", "/address/")}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary font-mono"
              >
                {shortAddress(escrow.address)}
              </a>
            ) : (
              "no desplegado"
            )}
            {" · "}Comisión: {(escrow?.feeBps ?? 150) / 100} %
          </p>
        </div>
        <button
          className={`btn btn-sm ${escrow?.paused ? "btn-success" : "btn-warning"}`}
          disabled={busy === "pause" || !escrow?.address}
          onClick={togglePause}
        >
          {escrow?.paused ? "Reanudar" : "Pausar"}
        </button>
      </div>

      <div role="tablist" className="tabs tabs-boxed w-fit flex-wrap">
        {STATUS_FILTERS.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={`tab ${filter === t.id ? "tab-active" : ""}`}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingCircle />
      ) : deals.length === 0 ? (
        <p className="opacity-60 text-sm">No hay deals en este estado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Monto</th>
                <th>Partes</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.property?.title || "—"}</td>
                  <td>
                    {d.amountDisplay} {d.token}
                  </td>
                  <td className="text-sm opacity-70">
                    {shortAddress(d.buyerWallet)} → {shortAddress(d.sellerWallet)}
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${DEAL_STATUS[d.status]?.className || ""}`}
                    >
                      {DEAL_STATUS[d.status]?.text || d.status}
                    </span>
                  </td>
                  <td>
                    {d.status === "funded" ? (
                      <div className="flex gap-2">
                        <button
                          className="btn btn-xs btn-success"
                          disabled={busy === d.id}
                          onClick={() => resolve(d, "release")}
                        >
                          Liberar
                        </button>
                        <button
                          className="btn btn-xs btn-warning"
                          disabled={busy === d.id}
                          onClick={() => resolve(d, "refund")}
                        >
                          Reembolsar
                        </button>
                      </div>
                    ) : (
                      <span className="opacity-40 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
