import mongoose from "mongoose";


/**
 * MonthlySummary
 * ──────────────
 * A pre-aggregated snapshot stored per user per month.
 * Drives the dashboard metrics:
 *   - This Month Income
 *   - This Month Expenses
 *   - This Month Savings
 *   - Total Balance (stored on Account, derived here for convenience)
 *
 * Update strategy: re-calculate and upsert whenever a Transaction
 * is created / updated / deleted in that month.
 */

const monthlySummarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number, // 1–12
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },

    // Aggregated figures
    totalIncome: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    totalSavings: {
      type: Number,
      default: 0, // = totalIncome - totalExpenses
    },

    // Snapshot of total balance across all accounts at end of month
    totalBalance: {
      type: Number,
      default: 0,
    },

    // Per-category breakdown (for charts)
    expenseByCategory: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        amount: Number,
      },
    ],
    incomeByCategory: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        amount: Number,
      },
    ],

    transactionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one summary doc per user per month/year
monthlySummarySchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export const MonthlySummary = mongoose.model("MonthlySummary", monthlySummarySchema);