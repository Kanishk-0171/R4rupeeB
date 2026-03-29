import mongoose from "mongoose";


const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Category type is required"],
    },
    icon: {
      type: String,
      default: "💰", // emoji or icon name
    },
    color: {
      type: String,
      default: "#6366f1", // hex color for UI display
    },
    isDefault: {
      type: Boolean,
      default: false, // true for system-seeded categories
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one user can't have duplicate category names of the same type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model("Category", categorySchema);