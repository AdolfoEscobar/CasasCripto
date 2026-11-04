"use client";

import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { web3Config } from "@/libs/web3config";

// Providers de wallet para toda la app. Se monta en <ClientLayout/> por
// fuera del SessionProvider para que el modal de login también pueda usar
// los hooks de wagmi (conectar MetaMask + firmar SIWE).
const Web3Provider = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={web3Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
