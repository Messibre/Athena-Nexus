import mongoose from "mongoose";

const milestoneSubmissionSchema = new mongoose.Schema(
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
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilestoneChallenge",
      required: true,
      index: true,
    },
    repoUrl: { type: String, required: true, trim: true },
    demoUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewerNotes: { type: String, trim: true },
  },
  { timestamps: true },
);

milestoneSubmissionSchema.index(
  { userId: 1, challengeId: 1 },
  { unique: true },
);

export default mongoose.model("MilestoneSubmission", milestoneSubmissionSchema);
