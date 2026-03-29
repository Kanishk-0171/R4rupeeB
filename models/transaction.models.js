import mongoose from "mongoose";


const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Core transaction fields
    name: {
      type: String,
      required: [true, "Transaction name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: [true, "Transaction type is required"],
    },
    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },

    // Optional metadata
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    attachmentUrl: {
      type: String, // receipt image / document URL
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "upi", "wallet", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast dashboard queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);