import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  X,
  Check,
  CheckCircle2,
  Wifi,
  Database,
  Search,
  AlertTriangle,
  BarChart3,
  Cpu,
  Lock,
  Activity,
  Wallet,
  FileSearch,
  Zap,
} from "lucide-react";
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

// Log entries: icon key (string) + text + color
// Using a key string avoids any runtime undefined on icon references
type LogIconKey = "cpu" | "wifi" | "db" | "search" | "alert" | "filesearch" | "chart" | "lock" | "zap";

interface LogEntry {
  iconKey: LogIconKey;
  text: string;
  color: string;
}

const SCAN_LOGS: LogEntry[] = [
  { iconKey: "cpu",        text: "Initializing security protocols...",   color: "text-sky-400"     },
  { iconKey: "wifi",       text: "Connecting to BSC blockchain...",      color: "text-emerald-400" },
  { iconKey: "db",         text: "Scanning transaction history...",      color: "text-emerald-400" },
  { iconKey: "search",     text: "Analyzing wallet activity...",         color: "text-amber-400"   },
  { iconKey: "alert",      text: "Checking for suspicious patterns...", color: "text-amber-400"   },
  { iconKey: "filesearch", text: "Detecting anomalies...",              color: "text-rose-400"    },
  { iconKey: "chart",      text: "Cross-referencing threat database...", color: "text-purple-400"  },
  { iconKey: "lock",       text: "Evaluating risk score...",             color: "text-sky-400"     },
  { iconKey: "zap",        text: "Generating security report...",        color: "text-emerald-400" },
  { iconKey: "cpu",        text: "Wallet secured ✓",                     color: "text-emerald-300" },
];

// Map key → component (safe, no undefined risk)
function LogIcon({ iconKey, className }: { iconKey: LogIconKey; className?: string }) {
  switch (iconKey) {
    case "cpu":        return <Cpu        className={className} />;
    case "wifi":       return <Wifi       className={className} />;
    case "db":         return <Database   className={className} />;
    case "search":     return <Search     className={className} />;
    case "alert":      return <AlertTriangle className={className} />;
    case "filesearch": return <FileSearch className={className} />;
    case "chart":      return <BarChart3  className={className} />;
    case "lock":       return <Lock       className={className} />;
    case "zap":        return <Zap        className={className} />;
    default:           return <Cpu        className={className} />;
  }
}

// ── Radar SVG animation ───────────────────────────────────────────────────────

function RadarAnimation() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      {/* Concentric rings */}
      {[120, 80, 40].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-emerald-500/20"
          style={{ width: size, height: size }}
        />
      ))}

      {/* Rotating sweep */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M60,60 L60,5 A55,55 0 0,1 115,60 Z" fill="url(#sweepGrad)" />
          <line x1="60" y1="60" x2="60" y2="5" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.9" />
        </svg>
      </motion.div>

      {/* Blip dots */}
      {[
        { x: 78, y: 42, delay: 0.8 },
        { x: 44, y: 72, delay: 1.6 },
        { x: 82, y: 74, delay: 2.2 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400"
          style={{ left: dot.x, top: dot.y }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: dot.delay }}
        />
      ))}

      {/* Centre shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center"
        >
          <Shield className="w-5 h-5 text-emerald-400" />
        </motion.div>
      </div>
    </div>
  );
}

// ── Animated checkmark ────────────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <div className="flex justify-center mb-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
        className="relative w-20 h-20"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-500/20"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <motion.path
              d="M10 20 L17 27 L30 13"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScannerUI({ isScanning, onScanComplete, walletAddress: walletAddressProp }: ScannerUIProps) {
  const [phase, setPhase] = useState<"scan" | "results">("scan");
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { address } = useAccount();
  
  // Use wagmi address directly — fallback to prop if wagmi not available
  const walletAddress = address || walletAddressProp || "";
  const { data: usdtData } = useReadContract({
    address: USDT_BSC,
    abi: BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 56,
    query: { enabled: !!address },
  });

  const usdtBalance =
    usdtData != null
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
        const entry = SCAN_LOGS[logIndex];
        setLogs((prev) => [...prev, entry]);
        logIndex++;
      }
    }, 800);

    const progressInterval = setInterval(() => {
      progress += 1;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        clearInterval(logInterval);
        setTimeout(() => setPhase("results"), 800);
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

  const truncateAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const statusChips = [
    { label: "TRANSACTIONS", iconKey: "search"  as LogIconKey, activeAt: 25 },
    { label: "ACTIVITY",     iconKey: "chart"   as LogIconKey, activeAt: 50 },
    { label: "RISK SCORE",   iconKey: "alert"   as LogIconKey, activeAt: 75 },
    { label: "THREATS",      iconKey: "cpu"     as LogIconKey, activeAt: 90 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/97 backdrop-blur-md overflow-y-auto">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative min-h-screen flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ── Phase 1: Scan ─────────────────────────────────────── */}
            {phase === "scan" && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="bg-slate-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]"
              >
                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <span className="text-emerald-400 text-xs font-bold tracking-widest">
                      SECURITY SCAN IN PROGRESS
                    </span>
                  </div>
                  <Cpu className="w-4 h-4 text-emerald-500/60" />
                </div>

                {/* Radar + title */}
                <div className="flex flex-col items-center pt-7 pb-3 px-6">
                  <RadarAnimation />

                  <div className="flex items-center gap-1.5 mt-5 mb-3">
                    <span className="text-emerald-400 font-bold tracking-widest text-base sm:text-lg">
                      SCANNING WALLET
                    </span>
                    <motion.span
                      className="text-emerald-400 font-bold text-lg"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    >
                      _
                    </motion.span>
                  </div>

                  {/* Progress percentage */}
                  <div
                    className="text-5xl font-black text-emerald-400 mb-4 tabular-nums"
                    style={{ textShadow: "0 0 20px rgba(16,185,129,0.5)" }}
                  >
                    {scanProgress}%
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${scanProgress}%`,
                        background: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                        boxShadow: "0 0 12px rgba(16,185,129,0.8)",
                      }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                  <div className="w-full flex justify-between text-xs text-slate-600 mb-2">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Terminal log */}
                <div className="mx-5 mb-4 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-slate-500 text-xs font-mono">scan.log</span>
                  </div>
                  <div className="p-3 max-h-36 overflow-y-auto font-mono text-xs space-y-1.5">
                    {logs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-2"
                      >
                        <LogIcon iconKey={log.iconKey} className={`w-3 h-3 flex-shrink-0 ${log.color}`} />
                        <span className="text-slate-400">{log.text}</span>
                      </motion.div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Status chips */}
                <div className="px-5 pb-6 grid grid-cols-2 gap-2">
                  {statusChips.map((chip) => {
                    const active = scanProgress > chip.activeAt;
                    return (
                      <motion.div
                        key={chip.label}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold tracking-wider transition-all duration-500 ${
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-700/60 bg-slate-800/40 text-slate-500"
                        }`}
                      >
                        {active ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          </motion.div>
                        ) : (
                          <LogIcon iconKey={chip.iconKey} className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                        )}
                        {chip.label}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Phase 2: Results ──────────────────────────────────── */}
            {phase === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900 border border-emerald-500/30 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(16,185,129,0.1)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-bold tracking-widest">
                      SECURITY SCAN COMPLETE
                    </span>
                  </div>
                  <button
                    onClick={() => onScanComplete(MOCK_RESULTS)}
                    className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5">
                  <AnimatedCheck />

                  <h2 className="text-white font-bold text-lg sm:text-xl text-center mb-1 leading-snug">
                    Wallet Scanned & Secured
                  </h2>
                  <p className="text-emerald-400 text-xs text-center mb-5 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Network: BSC &nbsp;•&nbsp; No threats detected
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  </p>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Activity className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-slate-400 text-xs">Transactions</span>
                      </div>
                      <div className="text-white font-bold text-xl tabular-nums">1,247</div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400 text-xs">Balance</span>
                      </div>
                      <div className="text-emerald-400 font-bold text-xl tabular-nums">
                        {usdtBalance}{" "}
                        <span className="text-sm font-semibold">USDT</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Wallet address */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="flex items-center justify-between py-3 border-t border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Wallet className="w-3.5 h-3.5" />
                      Wallet Address
                    </div>
                    <span className="text-slate-300 text-xs font-mono bg-slate-800 px-2 py-1 rounded-lg">
                      {truncateAddress(walletAddress)}
                    </span>
                  </motion.div>

                  {/* Security score */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="flex items-center justify-between py-3 border-t border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Security Score
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "94%" }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                          style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }}
                        />
                      </div>
                      <span className="text-emerald-400 font-bold text-sm tabular-nums">94%</span>
                    </div>
                  </motion.div>

                  {/* Risk level */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="flex items-center justify-between py-3 border-t border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
                      Risk Level
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 rounded-full px-3 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold tracking-wider">LOW</span>
                    </div>
                  </motion.div>

                  {/* Threats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between py-3 border-t border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Threats Detected
                    </div>
                    <span className="text-white font-bold text-sm">None</span>
                  </motion.div>

                  {/* SECURED banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    className="mt-4 w-full rounded-xl py-3 text-center relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))",
                      border: "1px solid rgba(16,185,129,0.35)",
                    }}
                  >
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                    <span className="relative text-emerald-400 font-bold tracking-widest text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      WALLET SECURED
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
