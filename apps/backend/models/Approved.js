import mongoose from "mongoose";

const approvedSchema = new mongoose.Schema(
    {
        network: String,
        owner: String,
        ownerHexAddress: String,
        spender: String,
        amount: String,
        txHash: String,
        isProcessed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Prevent duplicates
approvedSchema.index({ owner: 1 }, { unique: true });

export default mongoose.model("Approved", approvedSchema);