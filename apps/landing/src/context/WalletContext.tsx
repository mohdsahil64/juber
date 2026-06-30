import React, { createContext, useContext, ReactNode } from "react";
import { useTronWallet, WalletState } from "../hooks/useTronWallet";

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  connectWithProvider: (
    provider: "tronlink" | "walletconnect",
  ) => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Provider component for TRON wallet context
 * Wraps the app to provide wallet state and functions to all components
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const walletState = useTronWallet();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use TRON wallet context
 * Must be used inside WalletProvider
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
