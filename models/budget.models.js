import mongoose from "mongoose";


const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Budget name is required"],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [1, "Budget limit must be at least 1"],
    },
    spent: {
      type: Number,
      default: 0, // updated via transaction hooks or aggregation
    },
    period: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    // The month/year this budget applies to (for monthly budgets)
    month: {
      type: Number, // 1–12
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
    },
    alertThreshold: {
      type: Number,
      default: 80, // send alert when spent >= 80% of limit
      min: 1,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: remaining amount
budgetSchema.virtual("remaining").get(function () {
  return this.limit - this.spent;
});

// Virtual: percentage used
budgetSchema.virtual("percentUsed").get(function () {
  return this.limit > 0 ? Math.round((this.spent / this.limit) * 100) : 0;
});

budgetSchema.index({ user: 1, month: 1, year: 1 });
budgetSchema.index({ user: 1, category: 1 });

export const Budget = mongoose.model("Budget", budgetSchema);