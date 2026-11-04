import { createConfig, http } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";
import { CHAINS, MAINNET_ID, SEPOLIA_ID } from "./chains.js";

// Configuración wagmi global: mainnet + Sepolia. Conectores (ver
// libs/walletConnect.js para la prioridad de selección):
// - injected({ target: "metaMask" }): extensión MetaMask con detección
//   anti-lookalikes (id "metaMask").
// - injected(): cualquier otra wallet inyectada (id "injected").
// - metaMask(): SDK de MetaMask (id "metaMaskSDK", último recurso móvil/QR).
// Sin `http(url)` explícito viem usa RPC público; en producción define
// NEXT_PUBLIC_ETH_RPC_URL (y SEPOLIA) con un proveedor autenticado.
export const web3Config = createConfig({
  chains: [CHAINS.mainnet, CHAINS.sepolia],
  connectors: [injected({ target: "metaMask" }), injected(), metaMask()],
  transports: {
    [MAINNET_ID]: http(process.env.NEXT_PUBLIC_ETH_RPC_URL || undefined),
    [SEPOLIA_ID]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined),
  },
});
