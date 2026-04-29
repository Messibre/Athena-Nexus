import MilestoneCategory from "../../models/MilestoneCategory.js";
import MilestoneLevel from "../../models/MilestoneLevel.js";
import MilestoneChallenge from "../../models/MilestoneChallenge.js";
import MilestoneSubmission from "../../models/MilestoneSubmission.js";
import MilestoneProgress from "../../models/MilestoneProgress.js";
import {
  isValidGitHubUrl,
  isValidUrl,
  normalizeGitHubUrl,
} from "../../utils/validators.js";

const handleError = (res, error, message = "Server error", status = 500) => {
  console.error(message, error);
  res.status(status).json({
    message,
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

const ensureProgressForCategory = async (userId, categoryId) => {
  const levels = await MilestoneLevel.find({ categoryId, isActive: true })
    .sort({ levelNumber: 1 })
    .select("_id levelNumber");

  if (!levels.length) return [];

  const existing = await MilestoneProgress.find({ userId, categoryId }).select(
    "levelId",
  );
  const existingLevelIds = new Set(existing.map((p) => p.levelId.toString()));

  const ops = levels
    .filter((lvl) => !existingLevelIds.has(lvl._id.toString()))
    .map((lvl) => ({
      updateOne: {
        filter: { userId, categoryId, levelId: lvl._id },
        update: {
          $setOnInsert: {
            userId,
            categoryId,
            levelId: lvl._id,
            levelNumber: lvl.levelNumber,
            status: lvl.levelNumber === 1 ? "unlocked" : "locked",
          },
        },
        upsert: true,
      },
    }));

  if (ops.length) {
    await MilestoneProgress.bulkWrite(ops);
  }

  return levels;
};

const getLevelProgressStatus = async (userId, categoryId, levelId) => {
  const progress = await MilestoneProgress.findOne({
    userId,
    categoryId,
    levelId,
  });
  return progress?.status || "locked";
};

const updateProgressOnSubmission = async (submission) => {
  const level = await MilestoneLevel.findById(submission.levelId).select(
    "levelNumber categoryId",
  );
  if (!level) return;

  await ensureProgressForCategory(submission.userId, level.categoryId);

  await MilestoneProgress.findOneAndUpdate(
    {
      userId: submission.userId,
      categoryId: level.categoryId,
      levelId: submission.levelId,
    },
    {
      $set: { status: "completed", completedAt: new Date() },
    },
    { upsert: true },
  );

  const nextChallenge = await MilestoneChallenge.findOne({
    categoryId: level.categoryId,
    levelId: submission.levelId,
    isActive: true,
    _id: { $ne: submission.challengeId },
  })
    .sort({ createdAt: 1 })
    .select("_id levelId levelNumber");

  if (nextChallenge) {
    await MilestoneProgress.findOneAndUpdate(
      {
        userId: submission.userId,
        categoryId: level.categoryId,
        levelId: nextChallenge.levelId,
      },
      {
        $setOnInsert: {
          userId: submission.userId,
          categoryId: level.categoryId,
          levelId: nextChallenge.levelId,
          levelNumber: nextChallenge.levelNumber,
          status: "unlocked",
        },
      },
      { upsert: true },
    );
  }
};

export const listCategories = async (req, res) => {
  try {
    const categories = await MilestoneCategory.find({ isActive: true }).sort({
      order: 1,
    });
    res.json(categories);
  } catch (error) {
    handleError(res, error, "Failed to fetch categories");
  }
};

export const listLevelsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const levels = await MilestoneLevel.find({
      categoryId,
      isActive: true,
    }).sort({ levelNumber: 1 });
    res.json(levels);
  } catch (error) {
    handleError(res, error, "Failed to fetch levels");
  }
};

export const listChallengesByLevel = async (req, res) => {
  try {
    const levelId = req.params.levelId;
    const challenges = await MilestoneChallenge.find({
      levelId,
      isActive: true,
    }).sort({ createdAt: 1 });
    res.json(challenges);
  } catch (error) {
    handleError(res, error, "Failed to fetch challenges");
  }
};

export const getChallenge = async (req, res) => {
  try {
    const challenge = await MilestoneChallenge.findOne({
      _id: req.params.id,
      isActive: true,
    });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json(challenge);
  } catch (error) {
    handleError(res, error, "Failed to fetch challenge");
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await MilestoneSubmission.find({
      userId: req.user._id,
    })
      .populate("categoryId", "key name")
      .populate("levelId", "levelNumber title")
      .populate("challengeId", "title")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    handleError(res, error, "Failed to fetch submissions");
  }
};

export const listPublicSubmissions = async (req, res) => {
  try {
    const submissions = await MilestoneSubmission.find({
      status: "approved",
    })
      .populate("userId", "username displayName")
      .populate("categoryId", "key name")
      .populate("levelId", "levelNumber title")
      .populate("challengeId", "title")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    handleError(res, error, "Failed to fetch submissions");
  }
};

export const createSubmission = async (req, res) => {
  try {
    const { challengeId, repoUrl, demoUrl, notes } = req.body;
    const normalizedRepoUrl = normalizeGitHubUrl(repoUrl);

    if (!challengeId || !normalizedRepoUrl) {
      return res
        .status(400)
        .json({ message: "Challenge and repo URL are required" });
    }

    if (!isValidGitHubUrl(normalizedRepoUrl)) {
      return res.status(400).json({ message: "Invalid GitHub repo URL" });
    }

    if (demoUrl && !isValidUrl(demoUrl)) {
      return res.status(400).json({ message: "Invalid demo URL" });
    }

    const challenge = await MilestoneChallenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const levelChallenges = await MilestoneChallenge.find({
      levelId: challenge.levelId,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .select("_id");

    const challengeIds = levelChallenges.map((item) => item._id.toString());
    const targetIndex = challengeIds.indexOf(challengeId.toString());
    if (targetIndex === -1) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const priorIds = challengeIds.slice(0, targetIndex);
    if (priorIds.length > 0) {
      const submittedCount = await MilestoneSubmission.countDocuments({
        userId: req.user._id,
        challengeId: { $in: priorIds },
      });
      if (submittedCount !== priorIds.length) {
        return res.status(403).json({
          message: "Complete previous challenges in this level first",
        });
      }
    }

    await ensureProgressForCategory(req.user._id, challenge.categoryId);

    const existing = await MilestoneSubmission.findOne({
      userId: req.user._id,
      challengeId,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Submission already exists for this challenge" });
    }

    const submission = await MilestoneSubmission.create({
      userId: req.user._id,
      categoryId: challenge.categoryId,
      levelId: challenge.levelId,
      challengeId: challenge._id,
      repoUrl: normalizedRepoUrl,
      demoUrl: demoUrl || "",
      notes: notes || "",
      status: "pending",
    });

    await updateProgressOnSubmission(submission);

    res.status(201).json(submission);
  } catch (error) {
    handleError(res, error, "Failed to create submission");
  }
};

export const updateSubmission = async (req, res) => {
  try {
    const { repoUrl, demoUrl, notes } = req.body;
    const normalizedRepoUrl =
      repoUrl !== undefined ? normalizeGitHubUrl(repoUrl) : undefined;
    const submission = await MilestoneSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (submission.status === "approved") {
      return res
        .status(400)
        .json({ message: "Approved submissions cannot be updated" });
    }

    if (normalizedRepoUrl && !isValidGitHubUrl(normalizedRepoUrl)) {
      return res.status(400).json({ message: "Invalid GitHub repo URL" });
    }

    if (demoUrl && !isValidUrl(demoUrl)) {
      return res.status(400).json({ message: "Invalid demo URL" });
    }

    if (normalizedRepoUrl !== undefined) submission.repoUrl = normalizedRepoUrl;
    if (demoUrl !== undefined) submission.demoUrl = demoUrl;
    if (notes !== undefined) submission.notes = notes;

    await submission.save();
    res.json(submission);
  } catch (error) {
    handleError(res, error, "Failed to update submission");
  }
};

export const getProgress = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (categoryId) {
      await ensureProgressForCategory(req.user._id, categoryId);
      const progress = await MilestoneProgress.find({
        userId: req.user._id,
        categoryId,
      }).sort({ levelNumber: 1 });
      return res.json(progress);
    }

    const categories = await MilestoneCategory.find({ isActive: true }).select(
      "_id",
    );
    const allProgress = [];
    for (const category of categories) {
      await ensureProgressForCategory(req.user._id, category._id);
      const progress = await MilestoneProgress.find({
        userId: req.user._id,
        categoryId: category._id,
      }).sort({ levelNumber: 1 });
      allProgress.push({
        categoryId: category._id,
        progress,
      });
    }

    res.json(allProgress);
  } catch (error) {
    handleError(res, error, "Failed to fetch progress");
  }
};
