import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["bug", "suggestion", "praise"],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
      index: true,
    },
    pageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

feedbackSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
