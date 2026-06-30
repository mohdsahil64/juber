import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc, tron } from "@reown/appkit/networks"; // BSC Mainnet
import { createAppKit } from "@reown/appkit/react";
import App from "./app/App.tsx";
import "./styles/index.css";

const projectId = "0ce8aee287b84db4976604d12ad15af9";

// 'as const' lagane se TypeScript ko pata chalta hai ki ye array empty nahi hai
const networks = [bsc, tron] as const;

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks], // Spread operator use karein compatibility ke liye
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any, // Agar fir bhi error de, to 'as any' ya direct type casting karein
  projectId,
  features: {
    analytics: true
  }
});

const queryClient = new QueryClient();

// '!' operator ensure karta hai ki element null nahi hai
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiAdapter.wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);