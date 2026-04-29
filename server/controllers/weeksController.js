import Week from "../models/Week.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import MilestoneSubmission from "../models/MilestoneSubmission.js";

export const getWeeks = async (req, res) => {
  try {
    const weeks = await Week.find().sort({ week_number: -1 });
    res.json(weeks);
  } catch (error) {
    console.error("Get weeks error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getActiveWeek = async (req, res) => {
  try {
    const week = await Week.findOne({ isActive: true });
    if (!week) {
      return res.status(404).json({ message: "No active week found" });
    }
    res.json(week);
  } catch (error) {
    console.error("Get active week error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getWeekById = async (req, res) => {
  try {
    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ message: "Week not found" });
    }
    res.json(week);
  } catch (error) {
    console.error("Get week error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getWeekSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      week_id: req.params.id,
      status: "approved",
    })
      .populate("user_id", "username displayName members")
      .sort({ created_at: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Get week submissions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "member" });
    const totalWeeks = await Week.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    res.json({
      totalUsers,
      totalWeeks,
      totalSubmissions,
    });
  } catch (error) {
    console.error("Get public stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const [weeklySubmissions, milestoneSubmissions] = await Promise.all([
      Submission.find({ status: "approved" })
        .populate("user_id", "username displayName profileImageUrl members")
        .select("user_id"),
      MilestoneSubmission.find({ status: "approved" })
        .populate("userId", "username displayName profileImageUrl members")
        .select("userId"),
    ]);

    const leaderboardMap = new Map();

    const upsertScore = (userDoc, source) => {
      if (!userDoc) return;

      const userId = userDoc._id.toString();
      const existing = leaderboardMap.get(userId) || {
        userId,
        username: userDoc.username || "",
        displayName: userDoc.displayName || userDoc.username || "Team",
        profileImageUrl: userDoc.profileImageUrl || "",
        members: Array.isArray(userDoc.members) ? userDoc.members : [],
        projectCount: 0,
        weeklyProjects: 0,
        milestoneProjects: 0,
        points: 0,
      };

      existing.projectCount += 1;
      existing.points += 10;
      if (source === "weekly") {
        existing.weeklyProjects += 1;
      } else {
        existing.milestoneProjects += 1;
      }

      leaderboardMap.set(userId, existing);
    };

    weeklySubmissions.forEach((submission) => {
      upsertScore(submission.user_id, "weekly");
    });

    milestoneSubmissions.forEach((submission) => {
      upsertScore(submission.userId, "milestone");
    });

    const leaderboard = [...leaderboardMap.values()]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.projectCount !== a.projectCount)
          return b.projectCount - a.projectCount;
        return a.displayName.localeCompare(b.displayName);
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        badge:
          index === 0
            ? "gold"
            : index === 1
              ? "silver"
              : index === 2
                ? "bronze"
                : "",
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
