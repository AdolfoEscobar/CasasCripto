"use client";

import { useEffect, useState } from "react";
import apiClient from "@/libs/api";
import { toast } from "react-hot-toast";
import LoadingCircle from "@/components/common/LoadingCircle";

const TABS = [
  { id: "pending", label: "Pendientes" },
  { id: "published", label: "Publicadas" },
  { id: "rejected", label: "Rechazadas" },
];

// Panel de revisión de propiedades: el equipo de Casas Cripto aprueba o
// rechaza lo que los propietarios/agentes envían desde su dashboard
// (app/(private)/(user)/dashboard/PropertyManager.js) antes de que aparezca
// públicamente en /propiedades.
export default function AdminPropertiesPage() {
  const [tab, setTab] = useState("pending");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (status) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/properties?status=${status}&limit=100`);
      setProperties(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const updateStatus = async (id, status) => {
    let rejectionReason;
    if (status === "rejected") {
      rejectionReason = prompt("Motivo del rechazo (opcional):") || "";
    }
    try {
      await apiClient.patch(`/properties/${id}`, { status, rejectionReason });
      toast.success(
        status === "published" ? "Propiedad publicada" : "Propiedad rechazada"
      );
      fetchData(tab);
    } catch (e) {
      // apiClient already toasts the error
    }
  };

  const deleteProperty = async (id) => {
    if (!confirm("¿Eliminar esta propiedad definitivamente?")) return;
    try {
      await apiClient.delete(`/properties/${id}`);
      toast.success("Propiedad eliminada");
      fetchData(tab);
    } catch (e) {
      // apiClient already toasts the error
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Propiedades</h1>

      <div role="tablist" className="tabs tabs-boxed w-fit">
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

      {loading ? (
        <LoadingCircle />
      ) : properties.length === 0 ? (
        <p className="opacity-60 text-sm">No hay propiedades en este estado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Dueño</th>
                <th>Ciudad</th>
                <th>Precio</th>
                <th>Cripto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.title}</td>
                  <td className="text-sm opacity-70">
                    {p.owner?.name || p.owner?.email || "—"}
                  </td>
                  <td>
                    {p.city}
                    {p.country ? `, ${p.country}` : ""}
                  </td>
                  <td>
                    ${p.price?.toLocaleString()} {p.currency}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(p.cryptoAccepted || []).map((c) => (
                        <span key={c} className="badge badge-ghost badge-sm">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {tab !== "published" && (
                        <button
                          className="btn btn-success btn-xs"
                          onClick={() => updateStatus(p.id, "published")}
                        >
                          Aprobar
                        </button>
                      )}
                      {tab !== "rejected" && (
                        <button
                          className="btn btn-error btn-xs"
                          onClick={() => updateStatus(p.id, "rejected")}
                        >
                          Rechazar
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => deleteProperty(p.id)}
                      >
                        Eliminar
                      </button>
                    </div>
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
