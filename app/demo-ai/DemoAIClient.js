"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Footer from "@/components/Footer";

// Cliente ligero — a propósito NO usa libs/api.js (su interceptor redirige
// a /signin en cualquier 401, lo cual no aplica aquí: esta página es
// pública por diseño). Usa `fetch` directo. Consciente de sesión: si hay
// usuario autenticado llama a /api/ai/* (cuota generosa por usuario); si
// no, a /api/ai/public/* (cuota estricta por IP). Sin esto, un logueado
// agotaría la mini-cuota pública y encima le diría "crea una cuenta".
async function callAi(base, path, body) {
  const res = await fetch(`/api/${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Algo salió mal");
  }
  return json.data;
}

const SectionBadge = ({ children, color = "secondary" }) => (
  <span className={`badge badge-sm badge-${color} badge-outline`}>
    {children}
  </span>
);

export default function DemoAIClient() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const base = authed ? "ai" : "ai/public";

  // --- Muse Spark: redactar título + descripción ---
  const [copyForm, setCopyForm] = useState({
    city: "Tulum",
    country: "México",
    price: "480000",
    rawNotes: "3 recámaras, alberca privada, a 2 cuadras de la playa",
  });
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyResult, setCopyResult] = useState(null);

  const handleCopy = async () => {
    setCopyLoading(true);
    setCopyResult(null);
    try {
      const data = await callAi(base, "listing-copy", {
        ...copyForm,
        cryptoAccepted: ["USDC", "BTC"],
      });
      setCopyResult(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCopyLoading(false);
    }
  };

  // --- Muse Image: generar imagen ---
  const [imagePrompt, setImagePrompt] = useState(
    "villa frente al mar en Tulum, estilo moderno, atardecer"
  );
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState(null);

  const handleImage = async () => {
    setImageLoading(true);
    setImageResult(null);
    try {
      const data = await callAi(base, "listing-image", { prompt: imagePrompt });
      setImageResult(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImageLoading(false);
    }
  };

  // --- SAM 3.1: revisión de privacidad ---
  const [scanUrl, setScanUrl] = useState(
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
  );
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = async () => {
    setScanLoading(true);
    setScanResult(null);
    try {
      const data = await callAi(base, "privacy-scan", { imageUrl: scanUrl });
      setScanResult(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 md:py-20 space-y-12">
        {/* Encabezado */}
        <div className="text-center space-y-4">
          <p className="text-sm font-semibold text-primary">
            Meta Global AI Developer Hackathon
          </p>
          <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Meta AI dentro de <span className="text-primary">Casas Cripto</span>
          </h1>
          <p className="opacity-70 leading-relaxed max-w-2xl mx-auto">
            Prueba en vivo cómo usamos <strong>Muse Spark</strong>,{" "}
            <strong>Muse Image</strong> y <strong>SAM 3.1</strong> (Meta Model
            API) dentro del flujo real de publicar una propiedad.{" "}
            {authed
              ? "Tienes sesión iniciada, así que esta demo usa los límites generosos de tu cuenta."
              : "Sin cuenta tienes unos pocos usos por día para cuidar el crédito compartido del hackathon — crea una cuenta gratis para límites más altos."}
          </p>
        </div>

        {/* 1. Muse Spark */}
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            Redactar listado
            <SectionBadge color="secondary">Muse Spark</SectionBadge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="input input-bordered input-sm w-full"
              placeholder="Ciudad"
              value={copyForm.city}
              onChange={(e) => setCopyForm({ ...copyForm, city: e.target.value })}
            />
            <input
              className="input input-bordered input-sm w-full"
              placeholder="País"
              value={copyForm.country}
              onChange={(e) =>
                setCopyForm({ ...copyForm, country: e.target.value })
              }
            />
            <input
              type="number"
              className="input input-bordered input-sm w-full"
              placeholder="Precio (USD)"
              value={copyForm.price}
              onChange={(e) => setCopyForm({ ...copyForm, price: e.target.value })}
            />
          </div>
          <textarea
            className="textarea textarea-bordered textarea-sm w-full"
            rows={2}
            placeholder="Notas rápidas (ej. 3 recámaras, alberca, acepta cripto)"
            value={copyForm.rawNotes}
            onChange={(e) =>
              setCopyForm({ ...copyForm, rawNotes: e.target.value })
            }
          />
          <button
            className="btn btn-secondary btn-sm"
            disabled={copyLoading}
            onClick={handleCopy}
          >
            {copyLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Generar título y descripción"
            )}
          </button>
          {copyResult && (
            <div className="rounded-xl bg-base-200/60 p-4 space-y-1">
              <p className="font-semibold">{copyResult.title}</p>
              <p className="text-sm opacity-80">{copyResult.description}</p>
              {copyResult.mock && (
                <p className="text-xs opacity-50 pt-1">
                  Vista previa — conecta MODEL_API_KEY para usar Muse Spark real.
                </p>
              )}
            </div>
          )}
        </section>

        {/* 2. Muse Image */}
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            Generar imagen
            <SectionBadge color="accent">Muse Image</SectionBadge>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input input-bordered input-sm w-full"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
            />
            <button
              className="btn btn-accent btn-sm whitespace-nowrap"
              disabled={imageLoading}
              onClick={handleImage}
            >
              {imageLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Generar imagen"
              )}
            </button>
          </div>
          {imageResult && (
            <div className="space-y-2">
              {/* Imagen de un modelo de IA externo (URL o data URL dinámica)
                  — next/image exige configurar cada dominio remoto por
                  adelantado, así que usamos <img> nativo aquí a propósito. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageResult.imageUrl}
                alt="Imagen generada con Meta Muse Image"
                className="rounded-xl w-full max-h-80 object-cover"
              />
              {imageResult.mock && (
                <p className="text-xs opacity-50">
                  Vista previa — conecta MODEL_API_KEY para usar Muse Image real.
                </p>
              )}
            </div>
          )}
        </section>

        {/* 3. SAM 3.1 */}
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            Revisar privacidad
            <SectionBadge color="accent">SAM 3.1</SectionBadge>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input input-bordered input-sm w-full"
              placeholder="https://…/foto.jpg (URL pública directa)"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
            />
            <button
              className="btn btn-outline btn-accent btn-sm whitespace-nowrap"
              disabled={scanLoading}
              onClick={handleScan}
            >
              {scanLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Escanear imagen"
              )}
            </button>
          </div>
          {scanResult && (
            <p
              className={`text-sm ${
                scanResult.mock
                  ? "opacity-60"
                  : scanResult.hasSensitiveContent
                    ? "text-error"
                    : "text-success"
              }`}
            >
              {scanResult.mock
                ? scanResult.note
                : scanResult.hasSensitiveContent
                  ? `Se detectó: ${scanResult.findings.map((f) => f.label).join(", ")}`
                  : "Sin contenido sensible visible"}
            </p>
          )}
        </section>

        {/* CTA final */}
        <div className="text-center space-y-3 pt-4">
          <p className="opacity-70">
            ¿Te gustó? Crea una cuenta gratis y publica tu propiedad usando
            esta misma IA, sin límite diario tan estricto.
          </p>
          <Link href="/signin" className="btn btn-primary btn-sm rounded-full">
            Crear cuenta gratis
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
