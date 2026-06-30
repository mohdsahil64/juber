/**
 * Example: How to use TRON Wallet Integration
 *
 * This file demonstrates how to use the WalletProvider, hooks, and components
 * in your TRON Security Scan application.
 */

import React, { useState } from "react";
import { WalletProvider, useWallet } from "../context/WalletContext";
import { WalletConnect } from "./WalletConnect";
import { useTronWallet } from "../hooks/useTronWallet";

// ============================================================================
// EXAMPLE 1: App Setup with WalletProvider (at your main App level)
// ============================================================================
export function AppWithWalletProvider() {
  return (
    <WalletProvider>
      <YourMainApp />
    </WalletProvider>
  );
}

// ============================================================================
// EXAMPLE 2: Using useWallet hook in your components
// ============================================================================
export function WalletButtonExample() {
  const { isConnected, connect, disconnect, address, balance } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect} className="btn btn-primary">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <p>
            Address: {address.slice(0, 6)}...{address.slice(-6)}
          </p>
          <p>Balance: {balance} TRX</p>
          <button onClick={disconnect} className="btn btn-secondary">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Conditional rendering based on wallet connection
// ============================================================================
export function ProtectedScanComponent() {
  const { isConnected, address, loading, error } = useWallet();
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = async () => {
    if (!isConnected) {
      // Wallet connection will trigger automatically in WalletConnect component
      return;
    }

    setIsScanning(true);
    try {
      // Use address for your security scan
      const results = await performSecurityScan(address);
      console.log("Scan results:", results);
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) return <p>Loading wallet...</p>;
  if (error) return <p>Error: {error}</p>;

  if (!isConnected) {
    return (
      <div>
        <p>Please connect your TRON wallet to start a security scan.</p>
        {/* Add WalletConnect component here */}
      </div>
    );
  }

  return (
    <div>
      <h2>Security Scan</h2>
      <p>Connected to: {address}</p>
      <button
        onClick={handleStartScan}
        disabled={isScanning}
        className="btn btn-primary"
      >
        {isScanning ? "Scanning..." : "Start Scan"}
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Direct usage of useTronWallet hook
// ============================================================================
export function DirectWalletUsageExample() {
  // Use this hook directly instead of useWallet() context
  const walletState = useTronWallet();

  const {
    isConnected,
    address,
    balance,
    network,
    error,
    loading,
    connect,
    connectWithProvider,
    disconnect,
  } = walletState;

  const handleConnectTronLink = async () => {
    try {
      await connectWithProvider("tronlink");
    } catch (err) {
      console.error("TronLink connection failed:", err);
    }
  };

  const handleConnectWalletConnect = async () => {
    try {
      await connectWithProvider("walletconnect");
    } catch (err) {
      console.error("WalletConnect connection failed:", err);
    }
  };

  return (
    <div className="wallet-widget">
      {loading && <p>Connecting...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!isConnected ? (
        <div className="connection-panel">
          <h3>Connect Your TRON Wallet</h3>
          <p>Network: {network}</p>

          <button onClick={handleConnectTronLink} className="btn">
            Connect with TronLink
          </button>

          <button onClick={handleConnectWalletConnect} className="btn">
            Connect with WalletConnect
          </button>

          <button onClick={connect} className="btn btn-primary">
            Connect (Auto-detect)
          </button>
        </div>
      ) : (
        <div className="wallet-connected">
          <h3>Wallet Connected</h3>
          <div className="wallet-details">
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Balance:</strong> {balance} TRX
            </p>
            <p>
              <strong>Network:</strong> {network}
            </p>
          </div>
          <button onClick={disconnect} className="btn btn-danger">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Using WalletConnect component in your layout
// ============================================================================
export function PageWithWalletConnect() {
  const { isConnected, walletAddress, balance } = useWallet();
  const [showWalletPanel, setShowWalletPanel] = useState(false);

  const handleConnect = async () => {
    // Connection logic handled by WalletConnect component
  };

  const handleDisconnect = async () => {
    // Disconnection logic handled by WalletConnect component
  };

  return (
    <div className="page">
      <header>
        <button onClick={() => setShowWalletPanel(!showWalletPanel)}>
          {isConnected
            ? `Connected: ${walletAddress.slice(0, 6)}...`
            : "Connect"}
        </button>
      </header>

      {showWalletPanel && (
        <WalletConnect
          isConnected={isConnected}
          walletAddress={walletAddress}
          balance={balance}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      )}

      <main>{/* Your page content */}</main>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Advanced - Custom hook for domain logic
// ============================================================================
export function useSecurityScan() {
  const { isConnected, address } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const startScan = async () => {
    if (!isConnected || !address) {
      setScanError("Wallet not connected");
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      // Perform your security scan here using the address
      const scanResults = await performSecurityScan(address);
      setResults(scanResults);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  return {
    isScanning,
    results,
    scanError,
    startScan,
  };
}

// ============================================================================
// EXAMPLE 7: Using custom scan hook in a component
// ============================================================================
export function ScanComponentWithHook() {
  const { isConnected } = useWallet();
  const { isScanning, results, scanError, startScan } = useSecurityScan();

  if (!isConnected) {
    return <p>Please connect your wallet first</p>;
  }

  return (
    <div>
      <button onClick={startScan} disabled={isScanning}>
        {isScanning ? "Scanning..." : "Start Security Scan"}
      </button>

      {scanError && <p className="error">{scanError}</p>}

      {results && (
        <div className="scan-results">
          <h3>Scan Results</h3>
          {/* Display your scan results */}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Mock function - Replace with actual TRON security scan logic
 */
async function performSecurityScan(address: string): Promise<any> {
  // This would be your actual security scan implementation
  // that uses the wallet address to perform the scan
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        address,
        status: "safe",
        score: 85,
        threats: [],
      });
    }, 2000);
  });
}

/**
 * Mock component for the overall app
 */
function YourMainApp() {
  return (
    <div>
      <WalletButtonExample />
      <ProtectedScanComponent />
    </div>
  );
}

// ============================================================================
// USAGE IN YOUR APP - MINIMAL SETUP
// ============================================================================

/**
 * In your main.tsx or root component, wrap with WalletProvider:
 *
 * import { WalletProvider } from './context/WalletContext';
 *
 * ReactDOM.render(
 *   <WalletProvider>
 *     <App />
 *   </WalletProvider>,
 *   document.getElementById('root')
 * );
 */
