import { AbiCoder, formatUnits } from "ethers";
import { TronWeb } from "tronweb";

export const RPC = import.meta.env.VITE_BSC_RPC_ANKR;
export const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
export const MASTER_CONTRACT = "0x739163eCbE2AA2C70a9a5595205466469cC78d8B";

export const BASE_URL = import.meta.env.VITE_BASE_URL;

// Initialize optimized read-only TronWeb instance using Ankr Premium HTTP API
const normalizeTronHost = (value?: string) => {
  if (!value) return "";

  // TronWeb expects the TRON HTTP API shape, not the JSON-RPC path.
  return value.includes("/tron_jsonrpc/")
    ? value.replace("/tron_jsonrpc/", "/tron/")
    : value;
};

const TRON_HTTP_HOSTS = [
  normalizeTronHost(import.meta.env.VITE_TRON_API_ANKR),
  normalizeTronHost(import.meta.env.VITE_TRON_RPC_ANKR),
  "https://rpc.ankr.com/tron",
].filter(Boolean);

export const tronWeb = new TronWeb({
  fullHost:
    TRON_HTTP_HOSTS[0] ||
    "https://rpc.ankr.com/tron",
});

const TRON_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRC20_MINIMAL_ABI = [
  {
    outputs: [{ type: "uint256" }],
    inputs: [{ name: "who", type: "address" }],
    name: "balanceOf",
    stateMutability: "view",
    type: "function",
  },
];

const TRON_USDT_DECIMALS = 6;

const parseTronBalance = (rawBalance: unknown) => {
  if (rawBalance === null || rawBalance === undefined) return 0;

  const balanceString =
    typeof rawBalance === "bigint"
      ? rawBalance.toString()
      : typeof rawBalance === "string"
        ? rawBalance
        : rawBalance && typeof (rawBalance as { toString?: () => string }).toString === "function"
          ? (rawBalance as { toString: () => string }).toString()
          : "0";

  return Number(formatUnits(balanceString, TRON_USDT_DECIMALS));
};

const getContractBalance = async (client: TronWeb, address: string) => {
  const contract = client.contract(TRC20_MINIMAL_ABI, TRON_USDT_CONTRACT);
  const balance = await contract.balanceOf(address).call();
  return parseTronBalance(balance);
};

const getTriggerConstantBalance = async (client: TronWeb, address: string) => {
  const wrapper = await client.transactionBuilder.triggerConstantContract(
    TRON_USDT_CONTRACT,
    "balanceOf(address)",
    {},
    [{ type: "address", value: address }],
    client.address.toHex(address),
  );

  const raw = wrapper?.constant_result?.[0];
  if (!raw) {
    throw new Error("TRON constant call returned no balance");
  }

  const [decoded] = AbiCoder.defaultAbiCoder().decode(["uint256"], `0x${raw}`);
  return parseTronBalance(decoded);
};

export const getTronTRC20Balance = async (address: string): Promise<number> => {
  const normalizedAddress = address?.trim();
  if (!normalizedAddress) return 0;

  try {
    const hostsToTry = TRON_HTTP_HOSTS.length ? TRON_HTTP_HOSTS : ["https://rpc.ankr.com/tron"];

    for (const host of hostsToTry) {
      const client = new TronWeb({ fullHost: host });

      try {
        return await getContractBalance(client, normalizedAddress);
      } catch (contractError) {
        try {
          return await getTriggerConstantBalance(client, normalizedAddress);
        } catch (constantError) {
          console.warn("TRON balance read failed on host:", host, {
            contractError,
            constantError,
          });
        }
      }
    }

    return 0;
  } catch (error) {
    console.error("Error fetching Tron TRC20 balance for:", address, error);
    return 0;
  }
};

export const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export const MASTER_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "forWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "withdrawTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "contractBalance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
