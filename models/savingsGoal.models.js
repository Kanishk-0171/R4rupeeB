import mongoose from "mongoose";


const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: 1,
    },
    savedAmount: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    icon: {
      type: String,
      default: "🎯",
    },
    color: {
      type: String,
      default: "#22c55e",
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

savingsGoalSchema.virtual("percentAchieved").get(function () {
  return this.targetAmount > 0
    ? Math.min(Math.round((this.savedAmount / this.targetAmount) * 100), 100)
    : 0;
});

savingsGoalSchema.virtual("remaining").get(function () {
  return Math.max(this.targetAmount - this.savedAmount, 0);
});

savingsGoalSchema.index({ user: 1, status: 1 });

export const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);