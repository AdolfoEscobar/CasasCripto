"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { SiweMessage } from "siwe";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContracts,
  useSignMessage,
} from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import CryptoIcon from "@/components/CryptoIcon";
import MetaMaskIcon from "@/components/MetaMaskIcon";
import { useMounted } from "@/libs/useMounted";
import { MAINNET_ID, MAINNET_TOKENS, shortAddress } from "@/libs/chains";
import {
  METAMASK_DOWNLOAD_URL,
  classifyConnectError,
  hasInjectedProvider,
  resolveWalletConnector,
} from "@/libs/walletConnect";

// Tarjeta de wallet del dashboard: conectar MetaMask, vincularla a la cuenta
// (con firma SIWE) y ver saldos de ETH/USDC/USDT en mainnet (solo lectura).
// La wallet vinculada identifica al comprador/vendedor en los deals on-chain.
const WalletCard = () => {
  const { data: session, update: updateSession } = useSession();
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [busy, setBusy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const mounted = useMounted();
  // wagmi rehidrata la conexión solo en cliente: sin esta compuerta el SSR
  // pinta "Conectar" y el cliente "Vincular" → mismatch de hidratación.
  const connected = mounted && isConnected;

  const linked = session?.user?.walletAddress || null;
  const sameWallet =
    linked && address && linked.toLowerCase() === address.toLowerCase();

  // Saldos en mainnet, independientes de la red conectada (usan el transporte
  // configurado, no la wallet).
  const { data: ethBalance } = useBalance({ address, chainId: MAINNET_ID });
  const { data: tokenBalances } = useReadContracts({
    contracts: ["USDC", "USDT"].map((symbol) => ({
      address: MAINNET_TOKENS[symbol].address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
      chainId: MAINNET_ID,
    })),
    query: { enabled: !!address },
  });

  const fmt = (value, decimals) => {
    try {
      const n = Number(formatUnits(value ?? 0n, decimals));
      return n.toLocaleString("es-MX", { maximumFractionDigits: 4 });
    } catch {
      return "—";
    }
  };

  const handleConnect = async () => {
    setBusy(true);
    setShowInstall(false);
    try {
      // Sin provider inyectado no hay nada que conectar: guiar a instalar.
      if (!hasInjectedProvider()) {
        setShowInstall(true);
        toast.error("No detectamos una wallet en este navegador.");
        return;
      }
      const connector = await resolveWalletConnector(connectors);
      if (!connector) {
        setShowInstall(true);
        toast.error("No detectamos una wallet disponible.");
        return;
      }
      await connectAsync({ connector });
    } catch (e) {
      console.error("connect wallet failed:", e);
      const kind = classifyConnectError(e);
      if (kind === "no-provider") {
        setShowInstall(true);
        toast.error("No detectamos una wallet en este navegador.");
      } else if (kind === "rejected") {
        toast.error("Aprobá la conexión en tu wallet para continuar.");
      } else if (kind === "already-connected") {
        toast("La wallet ya está conectada.", { icon: "ℹ️" });
      } else {
        toast.error(
          e?.shortMessage || e?.message || "No pudimos conectar tu wallet."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  // Vincula la wallet conectada a la cuenta: firma un SIWE fresco y lo manda
  // a PATCH /api/auth/wallet, que verifica dominio + nonce + unicidad.
  const handleLink = async () => {
    if (!address) return;
    if (
      linked &&
      !confirm(
        `Tu cuenta ya tiene vinculada ${shortAddress(linked)}. ¿Reemplazarla por ${shortAddress(address)}?`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const nonceRes = await fetch("/api/auth/siwe/nonce");
      if (!nonceRes.ok) throw new Error("nonce");
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Vincular esta wallet a mi cuenta de Casas Cripto",
        uri: window.location.origin,
        version: "1",
        chainId: MAINNET_ID,
        nonce,
      });
      // Se manda el texto firmado tal cual (siwe v3 ya no acepta JSON).
      const prepared = message.prepareMessage();
      const signature = await signMessageAsync({ message: prepared });

      const res = await apiClient.patch("/auth/wallet", {
        message: prepared,
        signature,
      });
      await updateSession();
      toast.success(`Wallet ${shortAddress(res.walletAddress)} vinculada.`);
    } catch (e) {
      // apiClient ya mostró el toast con el mensaje del servidor.
      if (!e?.response && !/reject|denied|dismiss/i.test(e?.message || "")) {
        toast.error("No pudimos vincular tu wallet.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("¿Desvincular tu wallet de esta cuenta?")) return;
    setBusy(true);
    try {
      await apiClient.delete("/auth/wallet");
      await updateSession();
      toast.success("Wallet desvinculada.");
    } catch (e) {
      // apiClient already toasts the error message
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectAsync();
    } catch {
      // noop
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-lg">Wallet</h2>
          <p className="text-sm opacity-60">
            {linked
              ? `Vinculada: ${shortAddress(linked)}`
              : "Conecta MetaMask para ofertar con escrow."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!connected ? (
            <>
              <button
                className="btn btn-primary btn-sm gap-2"
                disabled={busy}
                onClick={handleConnect}
              >
                <span aria-hidden="true" className="flex">
                  <MetaMaskIcon size={16} />
                </span>
                Conectar MetaMask
              </button>
              {showInstall && (
                <a
                  href={METAMASK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Instalar MetaMask
                </a>
              )}
            </>
          ) : (
            <>
              {!sameWallet && (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={handleLink}
                >
                  {linked ? "Cambiar wallet" : "Vincular wallet"}
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDisconnect}
              >
                Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      {connected && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
          <p className="opacity-70">
            Conectada: <span className="font-mono">{shortAddress(address)}</span>
            {sameWallet && (
              <span className="badge badge-success badge-sm ml-2">
                Verificada
              </span>
            )}
          </p>
          {linked && (
            <button
              className="btn btn-ghost btn-xs text-error"
              disabled={busy}
              onClick={handleUnlink}
            >
              Desvincular
            </button>
          )}
        </div>
      )}

      {connected && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-base-200/60 p-3">
            <p className="font-bold">
              {fmt(ethBalance?.value, ethBalance?.decimals ?? 18)}
            </p>
            <p className="text-xs opacity-60 flex items-center justify-center gap-1">
              <span aria-hidden="true" className="flex">
                <CryptoIcon symbol="ETH" size={12} />
              </span>
              ETH
            </p>
          </div>
          {["USDC", "USDT"].map((symbol, i) => (
            <div key={symbol} className="rounded-xl bg-base-200/60 p-3">
              <p className="font-bold">
                {fmt(
                  tokenBalances?.[i]?.result,
                  MAINNET_TOKENS[symbol].decimals
                )}
              </p>
              <p className="text-xs opacity-60 flex items-center justify-center gap-1">
                <span aria-hidden="true" className="flex">
                  <CryptoIcon symbol={symbol} size={12} />
                </span>
                {symbol}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs opacity-50">
        Solo lectura: la app nunca mueve tus fondos sin tu firma. Los deals con
        escrow corren en la red de pruebas Sepolia (beta).
      </p>
    </div>
  );
};

export default WalletCard;
