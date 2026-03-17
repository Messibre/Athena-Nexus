import jwt from "jsonwebtoken";
import Submission from "../models/Submission.js";
import Week from "../models/Week.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import { isValidGitHubUrl, isValidUrl } from "../utils/validators.js";

export const getPublicSubmissions = async (req, res) => {
  try {
    const { weekId } = req.query;
    const query = { status: "approved" };
    if (weekId) query.week_id = weekId;

    const submissions = await Submission.find(query)
      .populate("user_id", "username displayName")
      .populate("week_id", "week_number title")
      .sort({ created_at: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ user_id: req.user._id })
      .populate("week_id", "week_number title deadlineDate")
      .sort({ created_at: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Get my submissions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("user_id", "username displayName members")
      .populate("week_id", "week_number title description");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      if (submission.status !== "approved") {
        return res.status(403).json({ message: "Submission not available" });
      }
      return res.json(submission);
    }

    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        
        if (submission.status !== "approved") {
          return res.status(403).json({ message: "Submission not available" });
        }
        return res.json(submission);
      }

      
      const isOwner = submission.user_id._id.toString() === user._id.toString();
      const isAdmin = user.role === "admin";

      if (submission.status === "approved" || isOwner || isAdmin) {
        return res.json(submission);
      }

      return res
        .status(403)
        .json({ message: "Not authorized to view this submission" });
    } catch (authError) {
      
      if (submission.status !== "approved") {
        return res.status(403).json({ message: "Submission not available" });
      }
      return res.json(submission);
    }
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const createSubmission = async (req, res) => {
  try {
    const {
      week_id,
      github_repo_url,
      github_live_demo_url,
      description,
      tags,
      screenshotUrl,
    } = req.body;

    if (!week_id || !github_repo_url) {
      return res
        .status(400)
        .json({ message: "Week ID and GitHub repo URL are required" });
    }

    
    if (!isValidGitHubUrl(github_repo_url)) {
      return res.status(400).json({
        message:
          "Invalid GitHub URL. Must be in format: https://github.com/owner/repo",
      });
    }

    
    if (github_live_demo_url && !isValidUrl(github_live_demo_url)) {
      return res.status(400).json({ message: "Invalid live demo URL" });
    }

    
    const week = await Week.findById(week_id);
    if (!week) {
      return res.status(404).json({ message: "Week not found" });
    }

    
    if (week.deadlineDate && new Date() > new Date(week.deadlineDate)) {
      return res
        .status(400)
        .json({ message: "Submission deadline has passed" });
    }

    
    const existingSubmission = await Submission.findOne({
      user_id: req.user._id,
      week_id: week_id,
    });

    if (existingSubmission) {
      return res.status(400).json({
        message:
          "You have already submitted for this week. Use update endpoint to modify.",
      });
    }

    const submission = new Submission({
      week_id,
      user_id: req.user._id,
      github_repo_url,
      github_live_demo_url: github_live_demo_url || "",
      description: description || "",
      tags: tags || [],
      screenshotUrl: screenshotUrl || "",
      status: "pending",
    });

    await submission.save();

    
    await ActivityLog.create({
      user_id: req.user._id,
      action: "submit",
      detail: `Submitted for week ${week.week_number}`,
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error("Create submission error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    
    if (submission.user_id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this submission" });
    }

    
    const week = await Week.findById(submission.week_id);
    if (week.deadlineDate && new Date() > new Date(week.deadlineDate)) {
      return res
        .status(400)
        .json({ message: "Cannot update submission after deadline" });
    }

    const {
      github_repo_url,
      github_live_demo_url,
      description,
      tags,
      screenshotUrl,
    } = req.body;

    
    if (github_repo_url && !isValidGitHubUrl(github_repo_url)) {
      return res.status(400).json({
        message:
          "Invalid GitHub URL. Must be in format: https://github.com/owner/repo",
      });
    }

    
    if (github_live_demo_url && !isValidUrl(github_live_demo_url)) {
      return res.status(400).json({ message: "Invalid live demo URL" });
    }

    
    if (github_repo_url) submission.github_repo_url = github_repo_url;
    if (github_live_demo_url !== undefined)
      submission.github_live_demo_url = github_live_demo_url;
    if (description !== undefined) submission.description = description;
    if (tags !== undefined) submission.tags = tags;
    if (screenshotUrl !== undefined) submission.screenshotUrl = screenshotUrl;

    
    if (submission.status === "rejected") {
      submission.status = "pending";
    }

    await submission.save();

    
    await ActivityLog.create({
      user_id: req.user._id,
      action: "update",
      detail: `Updated submission for week ${week.week_number}`,
    });

    res.json(submission);
  } catch (error) {
    console.error("Update submission error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
