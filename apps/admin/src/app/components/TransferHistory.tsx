import { useEffect, useState } from "react";
import { ExternalLink, Trash2, History, CheckCircle2, Clock } from "lucide-react";
import { useOutletContext } from "react-router";

interface OutletContextType {
  isSidebarOpen: boolean;
}

export interface TransferRecord {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  txHash: string;
  network: string;
  timestamp: string; // ISO string
  status: "success" | "failed";
}

export const HISTORY_KEY = "transfer_history";

export function saveTransferToHistory(record: Omit<TransferRecord, "id">) {
  const existing: TransferRecord[] = JSON.parse(
    localStorage.getItem(HISTORY_KEY) || "[]"
  );
  const newRecord: TransferRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([newRecord, ...existing]));
}

export default function TransferHistory() {
  const { isSidebarOpen } = useOutletContext<OutletContextType>();
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const load = () => {
    const data: TransferRecord[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
    setHistory(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to delete all history?")) {
      localStorage.removeItem(HISTORY_KEY);
      setHistory([]);
    }
  };

  const handleDeleteOne = (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const filtered = history.filter(
    (r) =>
      r.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.amount.includes(searchTerm)
  );

  const truncate = (str: string, start = 8, end = 6) =>
    str ? `${str.slice(0, start)}...${str.slice(-end)}` : "";

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-7 h-7 text-green-600" />
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Transfer History
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by address, txHash, or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {searchTerm ? "No results found" : "No transfers yet"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm
              ? "Try a different search term"
              : "Transfer history will appear here after a successful transfer"}
          </p>
        </div>
      )}

      {/* ── MOBILE CARDS ── */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-4">
          {filtered.map((record, index) => (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">
                    #{index + 1}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      record.status === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {record.status === "success" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {record.status === "success" ? "Success" : "Failed"}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteOne(record.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">From</span>
                  <span className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                    {truncate(record.fromAddress)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Amount</span>
                  <span className="text-sm font-bold text-green-600">
                    {record.amount} USDT
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">TxHash</span>
                  <span className="text-xs font-mono text-gray-500">
                    {truncate(record.txHash, 10, 6)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Network</span>
                  <span className="text-xs text-gray-600 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {record.network}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Time</span>
                  <span className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Verify Button */}
                <a
                  href={`https://bscscan.com/tx/${record.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify on BSCScan
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DESKTOP TABLE ── */}
      {filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    No
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    From Address
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    TxHash
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    Network
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    Time
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    Verify
                  </th>
                  <th className="px-4 py-3 text-xs text-left text-gray-500 uppercase tracking-wider font-semibold">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((record, index) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          record.status === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {record.status === "success" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {record.status === "success" ? "Success" : "Failed"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {truncate(record.fromAddress)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-green-600">
                        {record.amount} USDT
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">
                        {truncate(record.txHash, 10, 6)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {record.network}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <a
                        href={`https://bscscan.com/tx/${record.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Verify
                      </a>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteOne(record.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
