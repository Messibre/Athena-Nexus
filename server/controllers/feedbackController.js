import Feedback from "../models/Feedback.js";

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export const createFeedback = async (req, res) => {
  try {
    const { category, message, email } = req.body;

    if (!category || !message) {
      return res
        .status(400)
        .json({ message: "Category and message are required" });
    }

    if (!["bug", "suggestion", "praise"].includes(category)) {
      return res.status(400).json({ message: "Invalid feedback category" });
    }

    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (trimmedMessage.length > 1000) {
      return res
        .status(400)
        .json({ message: "Message must be 1000 characters or less" });
    }

    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const feedback = await Feedback.create({
      category,
      message: trimmedMessage,
      email: trimmedEmail,
      pageUrl: String(req.get("referer") || ""),
      userAgent: String(req.get("user-agent") || ""),
    });

    console.log("📩 Anonymous feedback received", {
      id: feedback._id.toString(),
      category: feedback.category,
      hasEmail: Boolean(feedback.email),
    });

    res.status(201).json({
      message: "Thanks for the feedback. It has been sent anonymously.",
    });
  } catch (error) {
    console.error("Create feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listFeedback = async (req, res) => {
  try {
    const { category, status, sortBy = "createdAt", order = "desc" } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;

    const sortDirection = order === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortDirection };

    const feedback = await Feedback.find(query).sort(sort);
    res.json(feedback);
  } catch (error) {
    console.error("List feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "read", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid feedback status" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.status = status;
    await feedback.save();

    res.json(feedback);
  } catch (error) {
    console.error("Update feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
};