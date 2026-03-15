import mongoose from "mongoose";

const milestoneCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

milestoneCategorySchema.index({ order: 1 });

export default mongoose.model("MilestoneCategory", milestoneCategorySchema);
