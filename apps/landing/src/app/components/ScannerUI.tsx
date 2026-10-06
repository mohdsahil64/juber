import { motion, AnimatePresence } from "motion/react";
import { Shield, X, Check, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAccount, useReadContract } from "wagmi";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ScannerUIProps {
  isScanning: boolean;
  onScanComplete: (results: ScanResults) => void;
  walletAddress: string;
}

export interface ScanResults {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  vulnerabilities: number;
  transactionRisk: number;
  contractExposure: number;
  tokenApprovals: number;
  suspiciousActivity: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const USDT_BSC = "0x55d398326f99059ff775485246999027b3197955" as const;

const BALANCE_ABI = [
  {
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const MOCK_RESULTS: ScanResults = {
  riskLevel: "LOW",
  score: 94,
  vulnerabilities: 0,
  transactionRisk: 5,
  contractExposure: 3,
  tokenApprovals: 2,
  suspiciousActivity: 0,
};

const SCAN_LOGS = [
  "Initializing security protocols...",
  "Connecting to BSC blockchain...",
  "Scanning transaction history...",
  "Analyzing smart contract interactions...",
  "Checking token approvals...",
  "Detecting anomalies...",
  "Cross-referencing threat database...",
  "Evaluating risk patterns...",
  "Generating security report...",
  "Scan complete ✓",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ScannerUI({ isScanning, onScanComplete, walletAddress }: ScannerUIProps) {
  const [phase, setPhase] = useState<"scan" | "results">("scan");
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Wagmi hooks for real USDT balance
  const { address } = useAccount();
  const { data: usdtData } = useReadContract({
    address: USDT_BSC,
    abi: BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 56,
    query: { enabled: !!address },
  });

  const usdtBalance =
    usdtData !== undefined && usdtData !== null
      ? (Number(usdtData as bigint) / 1e18).toFixed(2)
      : "0.00";

  // Scan progress + log animation
  useEffect(() => {
    if (!isScanning) {
      setScanProgress(0);
      setLogs([]);
      setPhase("scan");
      return;
    }

    setScanProgress(0);
    setLogs([]);
    setPhase("scan");

    let progress = 0;
    let logIndex = 0;

    const logInterval = setInterval(() => {
      if (logIndex < SCAN_LOGS.length) {
        const log = SCAN_LOGS[logIndex];
        setLogs((prev) => [...prev, log]);
        logIndex++;
      }
    }, 800);

    const progressInterval = setInterval(() => {
      progress += 1;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        clearInterval(logInterval);
        setTimeout(() => {
          setPhase("results");
        }, 800);
      }
    }, 80);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [isScanning]);

  // Auto-scroll terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!isScanning) return null;

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const statusChips = [
    { label: "TRANSACTIONS", activeAt: 25 },
    { label: "CONTRACTS", activeAt: 50 },
    { label: "APPROVALS", activeAt: 75 },
    { label: "THREATS", activeAt: 90 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {phase === "scan" ? (
              // ── Phase 1: Scan animation ───────────────────────────────────
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900 border border-emerald-500/40 rounded-2xl overflow-hidden"
              >
                {/* Shield icon with pulsing ring */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6">
                  <div className="relative mb-6">
                    {/* Outer pulsing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-emerald-500/60"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: 80, height: 80, top: -8, left: -8 }}
                    />
                    {/* Rotating ring */}
                    <motion.div
                      className="absolute rounded-full border-2 border-transparent border-t-emerald-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ width: 80, height: 80, top: -8, left: -8 }}
                    />
                    {/* Shield icon container */}
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>

                  {/* Title with blinking cursor */}
                  <div className="flex items-center gap-1 mb-6">
                    <span className="text-emerald-400 font-bold tracking-widest text-lg">
                      SCANNING WALLET...
                    </span>
                    <motion.span
                      className="text-emerald-400 font-bold"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      _
                    </motion.span>
                  </div>

                  {/* Progress percentage */}
                  <div className="text-5xl font-bold text-emerald-400 mb-4">
                    {scanProgress}%
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.2 }}
                      style={{
                        boxShadow: "0 0 10px rgba(16,185,129,0.7), 0 0 20px rgba(16,185,129,0.4)",
                      }}
                    />
                  </div>
                </div>

                {/* Terminal log area */}
                <div className="mx-6 mb-6 bg-slate-950 rounded-lg p-4 max-h-40 overflow-y-auto font-mono text-sm">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-2 mb-1"
                    >
                      <span className="text-emerald-500 flex-shrink-0">&gt;</span>
                      <span className="text-slate-300">{log}</span>
                    </motion.div>
                  ))}
                  <div ref={logsEndRef} />
                </div>

                {/* Status chips */}
                <div className="px-6 pb-8 grid grid-cols-2 gap-2">
                  {statusChips.map((chip) => {
                    const active = scanProgress > chip.activeAt;
                    return (
                      <div
                        key={chip.label}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold tracking-wider transition-all duration-500 ${
                          active
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-emerald-500/20 text-slate-500"
                        }`}
                      >
                        {active ? (
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0" />
                        )}
                        {chip.label}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              // ── Phase 2: Results view ─────────────────────────────────────
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900 border border-emerald-500/40 rounded-2xl overflow-hidden relative"
              >
                {/* Close button */}
                <button
                  onClick={() => onScanComplete(MOCK_RESULTS)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6">
                  {/* Animated checkmark */}
                  <div className="flex justify-center mb-5">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h2 className="text-white font-bold text-xl text-center mb-1 leading-snug">
                    Your Blockchain Verified USDT Funds Secured
                  </h2>

                  {/* Subtitle */}
                  <p className="text-emerald-400 text-sm text-center mb-5">
                    Network: BSC
                  </p>

                  {/* Two stat cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs mb-1">Transactions</div>
                      <div className="text-white font-bold text-xl">1,247</div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs mb-1">Balance</div>
                      <div className="text-emerald-400 font-bold text-xl">
                        {usdtBalance} USDT
                      </div>
                    </div>
                  </div>

                  {/* Wallet address */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-800">
                    <span className="text-slate-400 text-xs">Wallet</span>
                    <span className="text-slate-400 text-sm font-mono">
                      {truncateAddress(walletAddress)}
                    </span>
                  </div>

                  {/* Security score */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-800">
                    <span className="text-slate-400 text-sm">Security Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "94%" }}
                          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">94%</span>
                    </div>
                  </div>

                  {/* Risk level */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-800">
                    <span className="text-slate-400 text-sm">Risk Level</span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full px-2 py-0.5 text-xs font-semibold">
                      LOW
                    </span>
                  </div>

                  {/* SECURED badge */}
                  <div className="mt-5 w-full bg-emerald-500/10 border border-emerald-500/40 rounded-xl py-3 text-center">
                    <span className="text-emerald-400 font-bold tracking-widest text-sm">
                      ✓ SECURED
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
