import mongoose from "mongoose";

const milestoneLevelSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilestoneCategory",
      required: true,
      index: true,
    },
    levelNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

milestoneLevelSchema.index({ categoryId: 1, levelNumber: 1 }, { unique: true });

export default mongoose.model("MilestoneLevel", milestoneLevelSchema);
