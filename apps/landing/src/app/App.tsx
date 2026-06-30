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
    tronWeb?: any;
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
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (window.tronWeb && window.tronWeb.ready) {
      try {
        const address = window.tronWeb.defaultAddress.base58;
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
          await fetchBalance(address);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      if (window.tronWeb && window.tronWeb.ready) {
        // Get TRX balance
        const trxBalance = await window.tronWeb.trx.getBalance(address);
        const trxInSun = window.tronWeb.fromSun(trxBalance);

        // For demo purposes, we'll show a mock USDT balance
        const mockUsdtBalance = (Math.random() * 10000).toFixed(2);
        setBalance(mockUsdtBalance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      // Set mock balance on error
      setBalance((Math.random() * 10000).toFixed(2));
    }
  };

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
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 1.5,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleConnect = async () => {
    try {
      // Check if TronLink is installed
      if (!window.tronWeb) {
        alert(
          "TronLink wallet not detected. Please install TronLink extension.",
        );
        return;
      }

      // Request account access
      if (window.tronWeb.ready) {
        const address = window.tronWeb.defaultAddress.base58;
        setWalletAddress(address);
        setIsConnected(true);
        await fetchBalance(address);

        // Start scanning after connection
        setTimeout(() => {
          setIsScanning(true);
          window.scrollTo({
            top: window.innerHeight * 1.5,
            behavior: "smooth",
          });
        }, 1500);
      } else {
        // TronLink is installed but not ready, request connection
        const res = await window.tronWeb.request({
          method: "tron_requestAccounts",
        });
        if (res.code === 200) {
          const address = window.tronWeb.defaultAddress.base58;
          setWalletAddress(address);
          setIsConnected(true);
          await fetchBalance(address);

          setTimeout(() => {
            setIsScanning(true);
            window.scrollTo({
              top: window.innerHeight * 1.5,
              behavior: "smooth",
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);

      // For demo purposes, simulate connection with mock data
      const mockAddress =
        "TX9Kqb" + Math.random().toString(36).substring(2, 15).toUpperCase();
      setWalletAddress(mockAddress);
      setIsConnected(true);
      setBalance((Math.random() * 10000).toFixed(2));

      setTimeout(() => {
        setIsScanning(true);
        window.scrollTo({
          top: window.innerHeight * 1.5,
          behavior: "smooth",
        });
      }, 1500);
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

    // Scroll to results
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 2,
        behavior: "smooth",
      });
    }, 500);
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
          />
        )}

        {/* Results Dashboard */}
        {scanResults && <ResultsDashboard results={scanResults} />}
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
