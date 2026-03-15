import mongoose from "mongoose";

const milestoneChallengeSchema = new mongoose.Schema(
  {
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
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    requirements: [{ type: String, trim: true }],
    resources: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

milestoneChallengeSchema.index({ levelId: 1 });

export default mongoose.model("MilestoneChallenge", milestoneChallengeSchema);
