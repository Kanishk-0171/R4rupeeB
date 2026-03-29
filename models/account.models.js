import mongoose from "mongoose";


const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["cash", "bank", "credit_card", "wallet", "investment", "savings"],
      required: [true, "Account type is required"],
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    icon: {
      type: String,
      default: "🏦",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For credit cards
    creditLimit: {
      type: Number,
      default: null,
    },
    // For bank/savings accounts
    bankName: {
      type: String,
      default: null,
    },
    lastFourDigits: {
      type: String,
      maxlength: 4,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ user: 1, isActive: 1 });

export const Account = mongoose.model("Account", accountSchema);