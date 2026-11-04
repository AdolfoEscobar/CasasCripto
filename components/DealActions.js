"use client";

import { useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { erc20Abi } from "viem";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import CryptoIcon from "@/components/CryptoIcon";
import { useMounted } from "@/libs/useMounted";
import { web3Config } from "@/libs/web3config";
import { classifyConnectError, resolveWalletConnector } from "@/libs/walletConnect";
import { escrowAbi } from "@/libs/escrowAbi";
import { NATIVE_TOKEN, tokenAddress } from "@/libs/escrow";
import { SEPOLIA_ID, escrowAddress, shortAddress } from "@/libs/chains";

// Botones on-chain de un deal: depositar (comprador), aprobar liberación
// (ambos) y reembolsar tras el deadline. Cada firma se confirma on-chain y
// luego se sincroniza con POST sync, que avanza el estado off-chain.
// No renderiza nada fuera de los estados accepted/funded.
const DealActions = ({ deal, isBuyer, onUpdate }) => {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(null);
  // Estado wagmi solo-cliente: compuerta anti-mismatch (ver WalletCard).
  const mounted = useMounted();

  if (!["accepted", "funded"].includes(deal.status)) return null;

  const escrow = escrowAddress(deal.chainId);
  if (!escrow) {
    return (
      <p className="text-xs text-warning">
        Escrow no desplegado en esta cadena todavía.
      </p>
    );
  }

  const myWallet = (isBuyer ? deal.buyerWallet : deal.sellerWallet) || "";
  const wrongWallet =
    mounted &&
    isConnected &&
    address?.toLowerCase() !== myWallet.toLowerCase();
  const wrongChain =
    mounted && isConnected && connectedChainId !== deal.chainId;
  const chainName = deal.chainId === SEPOLIA_ID ? "Sepolia" : "Ethereum";
  const tokenAddr =
    deal.token === "ETH" ? NATIVE_TOKEN : tokenAddress(deal.chainId, deal.token);
  const expired =
    deal.status === "funded" &&
    deal.depositDeadline &&
    new Date(deal.depositDeadline) <= new Date();
  const iApproved = isBuyer ? deal.buyerApproved : deal.sellerApproved;

  const ensureWallet = async () => {
    if (!isConnected) {
      const connector = await resolveWalletConnector(connectors);
      if (!connector) {
        toast.error("Instala MetaMask para continuar.");
        return false;
      }
      try {
        await connectAsync({ connector });
      } catch (e) {
        console.error("connect wallet failed:", e);
        const kind = classifyConnectError(e);
        if (kind === "rejected") {
          toast.error("Aprobá la conexión en tu wallet para continuar.");
        } else {
          toast.error(
            e?.shortMessage || e?.message || "No pudimos conectar tu wallet."
          );
        }
        return false;
      }
    }
    return true;
  };

  const sync = async (hash) => {
    const receipt = await waitForTransactionReceipt(web3Config, { hash });
    if (receipt.status !== "success") {
      throw new Error("La transacción falló on-chain.");
    }
    const res = await apiClient.post(`/deals/${deal.id}/sync`, { txHash: hash });
    onUpdate(res.data);
  };

  const run = async (key, fn, successMsg, opts = {}) => {
    setBusy(key);
    try {
      if (opts.wallet !== false && !(await ensureWallet())) return;
      await fn();
      toast.success(successMsg);
    } catch (e) {
      if (!/reject|denied|dismiss/i.test(e?.message || "") && !e?.response) {
        toast.error(e?.message || "La transacción falló.");
      }
      // Los errores del API ya traen su toast vía apiClient.
    } finally {
      setBusy(null);
    }
  };

  // Reintenta la creación on-chain cuando el accept la dejó pendiente (ej.
  // escrow aún no desplegado o árbitro sin fondos). No firma nada.
  const doRetry = () =>
    run(
      "retry",
      async () => {
        const res = await apiClient.get(`/deals/${deal.id}/sync`);
        onUpdate(res.data);
      },
      "Sincronizado con el escrow.",
      { wallet: false }
    );

  const doDepositETH = () =>
    run("deposit", async () => {
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "depositETH",
        args: [deal.onchainId],
        value: BigInt(deal.amount),
        chainId: deal.chainId,
      });
      await sync(hash);
    }, "Depósito confirmado en el escrow.");

  const doDepositToken = () =>
    run("deposit", async () => {
      if (!tokenAddr || tokenAddr === NATIVE_TOKEN) {
        throw new Error(`Token ${deal.token} no desplegado en esta red.`);
      }
      const approveHash = await writeContractAsync({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: "approve",
        args: [escrow, BigInt(deal.amount)],
        chainId: deal.chainId,
      });
      await waitForTransactionReceipt(web3Config, { hash: approveHash });
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "depositToken",
        args: [deal.onchainId],
        chainId: deal.chainId,
      });
      await sync(hash);
    }, "Depósito confirmado en el escrow.");

  const doApprove = () =>
    run("approve", async () => {
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "approveRelease",
        args: [deal.onchainId],
        chainId: deal.chainId,
      });
      await sync(hash);
    }, "Aprobación registrada.");

  const doRefund = () =>
    run("refund", async () => {
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "refund",
        args: [deal.onchainId],
        chainId: deal.chainId,
      });
      await sync(hash);
    }, "Reembolso ejecutado.");

  const doSwitchChain = async () => {
    try {
      await switchChainAsync({ chainId: deal.chainId });
    } catch {
      toast.error(`Cambia manualmente a la red ${chainName} en tu wallet.`);
    }
  };

  return (
    <div className="rounded-xl bg-base-200/60 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
        Escrow on-chain · {chainName} (beta)
      </p>

      {wrongWallet && (
        <p className="text-xs text-warning">
          Conecta la wallet del deal ({shortAddress(myWallet)}) para firmar.
        </p>
      )}
      {wrongChain && !wrongWallet && (
        <button className="btn btn-warning btn-xs" onClick={doSwitchChain}>
          Cambiar a {chainName}
        </button>
      )}

      <div className="flex gap-2 flex-wrap">
        {deal.status === "accepted" && !deal.createTx && (
          <button
            className="btn btn-warning btn-xs"
            disabled={busy === "retry"}
            onClick={doRetry}
          >
            {busy === "retry" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Conectar con escrow"
            )}
          </button>
        )}

        {isBuyer && deal.status === "accepted" && deal.createTx && (
          <button
            className="btn btn-primary btn-xs"
            disabled={busy === "deposit" || wrongWallet || wrongChain}
            onClick={deal.token === "ETH" ? doDepositETH : doDepositToken}
          >
            {busy === "deposit" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <span className="inline-flex items-center gap-1">
                Depositar {deal.amountDisplay}
                <span aria-hidden="true" className="flex">
                  <CryptoIcon symbol={deal.token} size={12} />
                </span>
                {deal.token}
              </span>
            )}
          </button>
        )}

        {deal.status === "funded" && !iApproved && (
          <button
            className="btn btn-primary btn-xs"
            disabled={busy === "approve" || wrongWallet || wrongChain}
            onClick={doApprove}
          >
            {busy === "approve" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Aprobar liberación"
            )}
          </button>
        )}

        {deal.status === "funded" && expired && (
          <button
            className="btn btn-warning btn-xs"
            disabled={busy === "refund" || wrongChain}
            onClick={doRefund}
          >
            {busy === "refund" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Reembolsar (venció)"
            )}
          </button>
        )}
      </div>

      {deal.status === "funded" && (
        <p className="text-xs opacity-60">
          Aprobaciones: comprador {deal.buyerApproved ? "✓" : "·"} · vendedor{" "}
          {deal.sellerApproved ? "✓" : "·"}. Con las dos se libera solo (1.5 %
          comisión).
        </p>
      )}
    </div>
  );
};

export default DealActions;
