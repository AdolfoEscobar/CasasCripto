"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import config from "@/config";

// Lets any visitor donate a one-time amount (fiat, via Stripe Checkout) to
// support the development of Casas Cripto. Uses /api/stripe/create-donation,
// which builds the Stripe price on the fly — no pre-created priceId needed.
const DonateButton = ({ extraStyle }) => {
  const suggested = config.donations?.suggestedAmounts || [50, 100, 200, 500];
  const [selected, setSelected] = useState(suggested[1] ?? suggested[0]);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const amount = customAmount ? Number(customAmount) : selected;

  const handleDonate = async () => {
    if (!amount || amount < (config.donations?.minAmount || 1)) {
      toast.error(
        `El monto mínimo es $${config.donations?.minAmount || 1} MXN`
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post("/stripe/create-donation", {
        amount,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      });

      window.location.href = res.url;
    } catch (e) {
      console.error(e);
      toast.error("No pudimos iniciar el pago. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-sm space-y-4 ${extraStyle || ""}`}>
      <div className="flex flex-wrap gap-2">
        {suggested.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              setSelected(val);
              setCustomAmount("");
            }}
            className={`btn btn-sm ${
              amount === val && !customAmount
                ? "btn-primary"
                : "btn-outline border-base-content/20"
            }`}
          >
            ${val}
          </button>
        ))}
      </div>

      <label className="input input-bordered flex items-center gap-2">
        <span className="opacity-60">$</span>
        <input
          type="number"
          min={config.donations?.minAmount || 1}
          placeholder="Otro monto (MXN)"
          className="grow"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
        />
      </label>

      <button
        className="btn btn-primary btn-block"
        onClick={handleDonate}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <>Donar ${amount || 0} MXN</>
        )}
      </button>

      <p className="text-xs text-base-content/50 text-center">
        Pago seguro con Stripe. Las donaciones no son una inversión ni generan
        rendimientos.
      </p>
    </div>
  );
};

export default DonateButton;
