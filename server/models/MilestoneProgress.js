import mongoose from "mongoose";

const milestoneProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilestoneCategory",
      required: true,
      index: true,
    },
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilestoneLevel",
      required: true,
      index: true,
    },
    levelNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["locked", "unlocked", "completed"],
      default: "locked",
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

milestoneProgressSchema.index(
  { userId: 1, categoryId: 1, levelNumber: 1 },
  { unique: true },
);

export default mongoose.model("MilestoneProgress", milestoneProgressSchema);
