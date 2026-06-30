import { useState, useCallback, useEffect } from "react";
import walletConnector from "../utils/walletConnector";

export interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
  network: string;
  error: string | null;
  loading: boolean;
}

const initialState: WalletState = {
  isConnected: false,
  address: "",
  balance: "0",
  network: "TRON MAINNET",
  error: null,
  loading: false,
};

/**
 * Hook for managing TRON wallet connection and state
 * Supports TronLink and WalletConnect
 */
export function useTronWallet() {
  const [walletState, setWalletState] = useState<WalletState>(initialState);

  // Connect wallet with auto-detection
  const connect = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const providers = walletConnector.detectProviders();

      // Try TronLink first
      if (providers.tronLink) {
        try {
          const wallet = await walletConnector.connectTronLink();
          if (wallet) {
            setWalletState({
              isConnected: true,
              address: wallet.address,
              balance: wallet.balance,
              network: wallet.network,
              error: null,
              loading: false,
            });
            return;
          }
        } catch (err) {
          console.error("TronLink connection failed:", err);
        }
      }

      // Try WalletConnect
      if (providers.walletConnect) {
        try {
          const wallet = await walletConnector.connectWalletConnect();
          if (wallet) {
            setWalletState({
              isConnected: true,
              address: wallet.address,
              balance: wallet.balance,
              network: wallet.network,
              error: null,
              loading: false,
            });
            return;
          }
        } catch (err) {
          console.error("WalletConnect connection failed:", err);
        }
      }

      throw new Error(
        "No TRON wallet detected. Please install TronLink or use WalletConnect.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";
      setWalletState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, []);

  // Connect with specific provider
  const connectWithProvider = useCallback(
    async (provider: "tronlink" | "walletconnect") => {
      setWalletState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        let wallet;
        if (provider === "tronlink") {
          wallet = await walletConnector.connectTronLink();
        } else {
          wallet = await walletConnector.connectWalletConnect();
        }

        if (wallet) {
          setWalletState({
            isConnected: true,
            address: wallet.address,
            balance: wallet.balance,
            network: wallet.network,
            error: null,
            loading: false,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to connect with ${provider}`;
        setWalletState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    },
    [],
  );

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await walletConnector.disconnect();
      setWalletState(initialState);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, []);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      const address = await walletConnector.getCurrentAddress();
      if (address) {
        const isValid = walletConnector.isValidTronAddress(address);
        if (isValid) {
          // Try to get balance
          try {
            const wallet = await walletConnector.connectTronLink();
            if (wallet) {
              setWalletState({
                isConnected: true,
                address: wallet.address,
                balance: wallet.balance,
                network: wallet.network,
                error: null,
                loading: false,
              });
            }
          } catch (err) {
            console.error("Error checking wallet status:", err);
          }
        }
      }
    };

    checkConnection();
  }, []);

  return {
    ...walletState,
    connect,
    connectWithProvider,
    disconnect,
  };
}
