import ActivityLog from "../models/ActivityLog.js";

export const getActivityLogs = async (req, res) => {
  try {
    const { limit = 100, action } = req.query;
    const query = action ? { action } : {};

    const logs = await ActivityLog.find(query)
      .populate("user_id", "username")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyActivityLogs = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const logs = await ActivityLog.find({ user_id: req.user._id })
      .populate("user_id", "username displayName")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json(logs);
  } catch (error) {
    console.error("Get my activity logs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
