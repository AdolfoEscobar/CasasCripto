"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import CryptoIcon from "@/components/CryptoIcon";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { DEAL_TOKENS } from "@/libs/chains";

// Botón "Hacer oferta" de la página de propiedad. Abre un diálogo simple
// (overlay propio, sin blur por iPhones viejos como AuthModal): token +
// monto. Exige sesión y wallet vinculada; el resto lo valida el API.
const MakeOfferButton = ({ property }) => {
  const { data: session, status } = useSession();
  const { openAuthModal } = useAuthModal();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(DEAL_TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const listed = Array.isArray(property?.cryptoAccepted)
    ? property.cryptoAccepted
    : [];
  // Opciones = intersección con lo que acepta el listado; si el listado no
  // declara nada (o solo BTC legacy), se ofrecen los 3 y el vendedor decide.
  const options =
    listed.length > 0
      ? DEAL_TOKENS.filter((t) => listed.includes(t))
      : DEAL_TOKENS;
  const effectiveOptions = options.length > 0 ? options : DEAL_TOKENS;

  const openDialog = () => {
    if (status !== "authenticated") {
      openAuthModal(window.location.href);
      return;
    }
    if (!session?.user?.walletAddress) {
      toast.error("Vincula tu wallet de MetaMask en tu panel antes de ofertar.");
      return;
    }
    setToken(effectiveOptions[0]);
    setAmount("");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Ingresa un monto válido mayor a cero.");
      return;
    }
    setSending(true);
    try {
      await apiClient.post("/deals", {
        propertyId: property.id,
        token,
        amount: String(amount).trim(),
      });
      toast.success("¡Oferta enviada! El vendedor tiene 7 días para responder.");
      setOpen(false);
    } catch (e) {
      // apiClient already toasts the error message
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary btn-block" onClick={openDialog}>
        Hacer oferta con escrow
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] overflow-y-auto">
            <div
              aria-hidden="true"
              className="fixed inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
          <div className="flex min-h-full p-4">
            <form
              onSubmit={submit}
              className="relative m-auto w-full max-w-md rounded-2xl bg-base-200 border border-base-content/15 p-6 space-y-4"
            >
              <div>
                <h3 className="font-bold text-lg">Ofertar por esta propiedad</h3>
                <p className="text-sm opacity-60 mt-1">
                  {property.title} ·{" "}
                  {listed.length > 0 ? (
                    <span className="inline-flex items-center gap-1 flex-wrap">
                      Acepta:
                      {listed.map((symbol) => (
                        <span
                          key={symbol}
                          className="inline-flex items-center gap-0.5"
                        >
                          <span aria-hidden="true" className="flex">
                            <CryptoIcon symbol={symbol} size={12} />
                          </span>
                          {symbol}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "Escrow en Ethereum (beta, red Sepolia)"
                  )}
                </p>
              </div>

              <label className="form-control w-full">
                <span className="label-text text-sm font-medium mb-1 block">
                  Token
                </span>
                <select
                  aria-label="Token de la oferta"
                  className="select select-bordered w-full text-base"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                >
                  {effectiveOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control w-full">
                <span className="label-text text-sm font-medium mb-1 flex items-center gap-1">
                  Monto en
                  <span aria-hidden="true" className="flex">
                    <CryptoIcon symbol={token} size={14} />
                  </span>
                  {token}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="0.00"
                  className="input input-bordered w-full text-base"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>

              <p className="text-xs opacity-60">
                Si el vendedor acepta, depositas en el contrato escrow (1.5 % de
                comisión al liberar). Puedes cancelar mientras no esté fondeado.
              </p>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending}
                >
                  {sending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Enviar oferta"
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default MakeOfferButton;
