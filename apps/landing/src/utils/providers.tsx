"use client";

import { WalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks";
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import { WalletConnectAdapter } from "@tronweb3/tronwallet-adapter-walletconnect";
import { TrustAdapter } from "@tronweb3/tronwallet-adapter-trust";

const walletConnectAdapter = new WalletConnectAdapter({
  network: "Mainnet",
  options: {
    relayUrl: "wss://relay.walletconnect.com",
    projectId: "0ce8aee287b84db4976604d12ad15af9",
    metadata: {
      name: "TRON DApp",
      description: "TRON WalletConnect Integration",
      url: typeof window !== "undefined" ? window.location.origin : "",
      icons: ["https://trustwallet.com/favicon.ico"],
    },
  },
  web3ModalConfig: {
    themeMode: "dark",
    themeVariables: {
      "--wcm-z-index": "1000",
    },
    explorerRecommendedWalletIds: [
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
      "a761af5ebcd8544c20531853d9e4a34b2f6ef57b85e0541703668be510808233", // TronLink
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    ],
  },
});

const trustAdapter = new TrustAdapter({
  openUrlWhenWalletNotFound: true,
});

const adapters = [walletConnectAdapter, new TronLinkAdapter(), trustAdapter];

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider adapters={adapters} autoConnect={false} disableAutoConnectOnLoad={true}>
      {children}
    </WalletProvider>
  );
}