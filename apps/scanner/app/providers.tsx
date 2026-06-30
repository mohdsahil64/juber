"use client";

import { useMemo, type ReactNode } from "react";
import { WalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks";
import { WalletConnectAdapter } from "@tronweb3/tronwallet-adapter-walletconnect";

export default function Providers({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const adapters = useMemo(() => {
    const walletConnectAdapter = new WalletConnectAdapter({
      network: "Mainnet",
      options: {
        relayUrl: "wss://relay.walletconnect.com",
        projectId: "0ce8aee287b84db4976604d12ad15af9",
        metadata: {
          name: "Tron Trust Wallet App",
          description: "Trust Wallet only TRON connection",
          url: "https://6df9-47-15-78-154.ngrok-free.app",
          icons: ["https://trustwallet.com/favicon.ico"],
        },
      },
      themeMode: "dark",
      allWallets: "HIDE",
      includeWalletIds: [
        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
      ],
      featuredWalletIds: [
        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
      ],
    });

    return [walletConnectAdapter];
  }, []);

  return (
    <WalletProvider adapters={adapters} disableAutoConnectOnLoad={true}>
      {children}
    </WalletProvider>
  );
}
