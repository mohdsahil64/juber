import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { bsc } from "@reown/appkit/networks";
import { ReactNode } from "react";

const projectId = "6555f61cbd82b5bdd122264991a4d84a";

const networks = [bsc];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: bsc,
  metadata: {
    name: "BSC Security Scan",
    description: "Detect vulnerabilities. Identify risks. Secure your USDT.",
    url: "https://bscchain.app",
    icons: ["https://bscchain.app/favicon.ico"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    emailShowWallets: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#10b981",
    "--w3m-border-radius-master": "4px",
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
