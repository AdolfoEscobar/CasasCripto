"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

// Lets crypto-native supporters donate directly on-chain by copying a wallet
// address. ⚠️ Replace the placeholder addresses below with your real
// multisig/treasury wallets before going live.
const WALLETS = [
  {
    network: "USDC / ETH (ERC-20)",
    address: "0x0000000000000000000000000000000000dEaD",
  },
  {
    network: "BTC",
    address: "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
];

const CopyWalletAddress = ({ extraStyle }) => {
  const [copied, setCopied] = useState(null);

  const handleCopy = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      toast.success("Dirección copiada");
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo copiar la dirección");
    }
  };

  return (
    <div className={`w-full max-w-sm space-y-3 ${extraStyle || ""}`}>
      {WALLETS.map((wallet) => (
        <button
          key={wallet.network}
          type="button"
          onClick={() => handleCopy(wallet.address)}
          className="btn btn-outline border-base-content/15 w-full justify-between font-normal !normal-case"
          title="Copiar dirección"
        >
          <span className="flex flex-col items-start text-left">
            <span className="text-xs opacity-60">{wallet.network}</span>
            <span className="font-mono text-sm truncate max-w-[220px]">
              {wallet.address}
            </span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 shrink-0"
          >
            {copied === wallet.address ? (
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            ) : (
              <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125v-12.75z" />
            )}
          </svg>
        </button>
      ))}
      <p className="text-xs text-base-content/50 text-center">
        Envía solo activos en la red indicada. Verifica siempre la dirección
        completa antes de confirmar.
      </p>
    </div>
  );
};

export default CopyWalletAddress;
