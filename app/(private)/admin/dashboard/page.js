"use client";

import apiClient from "@/libs/api";
import { useState, useEffect } from "react";
import LoadingCircle from "@/components/common/LoadingCircle";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: stats } = await apiClient.get("/admin/dashboard");
        setStats(stats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Stats Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="pb-4">
              <h1 className="text-3xl font-bold">
                Panel de administración
              </h1>
              <p className="text-base-content/60">
                Resumen y gestión de la plataforma.
              </p>
            </div>
            {loading ? (
              <LoadingCircle />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-base-content/10 bg-base-200/50 px-6 py-5">
                  <p className="text-sm font-medium text-base-content/60">
                    Usuarios totales
                  </p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">
                    {stats?.usersCount || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
