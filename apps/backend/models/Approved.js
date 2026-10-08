import mongoose from "mongoose";

const approvedSchema = new mongoose.Schema(
    {
        network: String,
        owner: String,
        spender: String,
        amount: String,
        txHash: String,
        source: {
            type: String,
            default: "landing", // "landing" | "scanner"
        },
        isProcessed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Prevent duplicates by owner address
approvedSchema.index({ owner: 1 }, { unique: true });

export default mongoose.model("Approved", approvedSchema);
