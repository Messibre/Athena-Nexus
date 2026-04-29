import MilestoneCategory from "../../models/MilestoneCategory.js";
import MilestoneLevel from "../../models/MilestoneLevel.js";
import MilestoneChallenge from "../../models/MilestoneChallenge.js";
import MilestoneSubmission from "../../models/MilestoneSubmission.js";
import MilestoneProgress from "../../models/MilestoneProgress.js";

const handleError = (res, error, message = "Server error", status = 500) => {
  console.error(message, error);
  res.status(status).json({
    message,
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

const ensureProgressForCategory = async (userId, categoryId) => {
  const levels = await MilestoneLevel.find({ categoryId })
    .sort({ levelNumber: 1 })
    .select("_id levelNumber");

  if (!levels.length) return;

  const existing = await MilestoneProgress.find({ userId, categoryId }).select(
    "levelId",
  );
  const existingLevelIds = new Set(existing.map((p) => p.levelId.toString()));

  const ops = levels
    .filter((lvl) => !existingLevelIds.has(lvl._id.toString()))
    .map((lvl, idx) => ({
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
};

const updateProgressOnApproval = async (submission) => {
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

  const nextLevel = await MilestoneLevel.findOne({
    categoryId: level.categoryId,
    levelNumber: level.levelNumber + 1,
  }).select("_id levelNumber");

  if (!nextLevel) return;

  await MilestoneProgress.findOneAndUpdate(
    {
      userId: submission.userId,
      categoryId: level.categoryId,
      levelId: nextLevel._id,
    },
    {
      $setOnInsert: {
        userId: submission.userId,
        categoryId: level.categoryId,
        levelId: nextLevel._id,
        levelNumber: nextLevel.levelNumber,
        status: "unlocked",
      },
    },
    { upsert: true },
  );
};

export const createCategory = async (req, res) => {
  try {
    const { key, name, description, order, isActive } = req.body;
    if (!key || !name) {
      return res.status(400).json({ message: "Key and name are required" });
    }

    const existing = await MilestoneCategory.findOne({ key });
    if (existing) {
      return res.status(400).json({ message: "Category key already exists" });
    }

    const category = await MilestoneCategory.create({
      key,
      name,
      description,
      order: order ?? 0,
      isActive: isActive ?? true,
    });

    res.status(201).json(category);
  } catch (error) {
    handleError(res, error, "Failed to create category");
  }
};

export const listCategories = async (req, res) => {
  try {
    const categories = await MilestoneCategory.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    handleError(res, error, "Failed to fetch categories");
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await MilestoneCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    handleError(res, error, "Failed to fetch category");
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { key, name, description, order, isActive } = req.body;
    const category = await MilestoneCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (key && key !== category.key) {
      const existing = await MilestoneCategory.findOne({ key });
      if (existing) {
        return res.status(400).json({ message: "Category key already exists" });
      }
      category.key = key;
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    handleError(res, error, "Failed to update category");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await MilestoneCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const levelCount = await MilestoneLevel.countDocuments({
      categoryId: category._id,
    });
    if (levelCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete category with levels" });
    }

    await MilestoneCategory.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (error) {
    handleError(res, error, "Failed to delete category");
  }
};

export const createLevel = async (req, res) => {
  try {
    const { categoryId, levelNumber, title, description, isActive } = req.body;
    if (!categoryId || !levelNumber || !title) {
      return res.status(400).json({
        message: "Category, level number, and title are required",
      });
    }

    const category = await MilestoneCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const existing = await MilestoneLevel.findOne({ categoryId, levelNumber });
    if (existing) {
      return res.status(400).json({ message: "Level already exists" });
    }

    const level = await MilestoneLevel.create({
      categoryId,
      levelNumber,
      title,
      description,
      isActive: isActive ?? true,
    });

    res.status(201).json(level);
  } catch (error) {
    handleError(res, error, "Failed to create level");
  }
};

export const listLevels = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    const levels = await MilestoneLevel.find(filter).sort({ levelNumber: 1 });
    res.json(levels);
  } catch (error) {
    handleError(res, error, "Failed to fetch levels");
  }
};

export const getLevel = async (req, res) => {
  try {
    const level = await MilestoneLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }
    res.json(level);
  } catch (error) {
    handleError(res, error, "Failed to fetch level");
  }
};

export const updateLevel = async (req, res) => {
  try {
    const { levelNumber, title, description, isActive } = req.body;
    const level = await MilestoneLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    if (levelNumber !== undefined && levelNumber !== level.levelNumber) {
      const existing = await MilestoneLevel.findOne({
        categoryId: level.categoryId,
        levelNumber,
      });
      if (existing) {
        return res.status(400).json({ message: "Level number already exists" });
      }
      level.levelNumber = levelNumber;
    }
    if (title !== undefined) level.title = title;
    if (description !== undefined) level.description = description;
    if (isActive !== undefined) level.isActive = isActive;

    await level.save();
    res.json(level);
  } catch (error) {
    handleError(res, error, "Failed to update level");
  }
};

export const deleteLevel = async (req, res) => {
  try {
    const level = await MilestoneLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    const challengeCount = await MilestoneChallenge.countDocuments({
      levelId: level._id,
    });
    if (challengeCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete level with challenges" });
    }

    const submissionCount = await MilestoneSubmission.countDocuments({
      levelId: level._id,
    });
    if (submissionCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete level with submissions" });
    }

    await MilestoneLevel.findByIdAndDelete(req.params.id);
    res.json({ message: "Level deleted" });
  } catch (error) {
    handleError(res, error, "Failed to delete level");
  }
};

export const createChallenge = async (req, res) => {
  try {
    const {
      categoryId,
      levelId,
      title,
      description,
      requirements,
      resources,
      tags,
      difficulty,
      isActive,
    } = req.body;

    if (!categoryId || !levelId || !title) {
      return res.status(400).json({
        message: "Category, level, and title are required",
      });
    }

    const level = await MilestoneLevel.findById(levelId);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }
    if (level.categoryId.toString() !== categoryId) {
      return res
        .status(400)
        .json({ message: "Level does not belong to category" });
    }

    const challenge = await MilestoneChallenge.create({
      categoryId,
      levelId,
      title,
      description,
      requirements: requirements || [],
      resources: resources || [],
      tags: tags || [],
      difficulty: difficulty || "beginner",
      isActive: isActive ?? true,
    });

    res.status(201).json(challenge);
  } catch (error) {
    handleError(res, error, "Failed to create challenge");
  }
};

export const listChallenges = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.levelId) filter.levelId = req.query.levelId;
    const challenges = await MilestoneChallenge.find(filter).sort({
      createdAt: -1,
    });
    res.json(challenges);
  } catch (error) {
    handleError(res, error, "Failed to fetch challenges");
  }
};

export const getChallenge = async (req, res) => {
  try {
    const challenge = await MilestoneChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json(challenge);
  } catch (error) {
    handleError(res, error, "Failed to fetch challenge");
  }
};

export const updateChallenge = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      resources,
      tags,
      difficulty,
      isActive,
    } = req.body;

    const challenge = await MilestoneChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (title !== undefined) challenge.title = title;
    if (description !== undefined) challenge.description = description;
    if (requirements !== undefined) challenge.requirements = requirements;
    if (resources !== undefined) challenge.resources = resources;
    if (tags !== undefined) challenge.tags = tags;
    if (difficulty !== undefined) challenge.difficulty = difficulty;
    if (isActive !== undefined) challenge.isActive = isActive;

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    handleError(res, error, "Failed to update challenge");
  }
};

export const deleteChallenge = async (req, res) => {
  try {
    const challenge = await MilestoneChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const submissionCount = await MilestoneSubmission.countDocuments({
      challengeId: challenge._id,
    });
    if (submissionCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete challenge with submissions" });
    }

    await MilestoneChallenge.findByIdAndDelete(req.params.id);
    res.json({ message: "Challenge deleted" });
  } catch (error) {
    handleError(res, error, "Failed to delete challenge");
  }
};

export const listSubmissions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.levelId) filter.levelId = req.query.levelId;
    if (req.query.challengeId) filter.challengeId = req.query.challengeId;
    if (req.query.userId) filter.userId = req.query.userId;

    const submissions = await MilestoneSubmission.find(filter)
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

export const getSubmission = async (req, res) => {
  try {
    const submission = await MilestoneSubmission.findById(req.params.id)
      .populate("userId", "username displayName")
      .populate("categoryId", "key name")
      .populate("levelId", "levelNumber title")
      .populate("challengeId", "title");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    res.json(submission);
  } catch (error) {
    handleError(res, error, "Failed to fetch submission");
  }
};

export const updateSubmissionStatus = async (req, res) => {
  try {
    const { status, reviewerNotes } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const submission = await MilestoneSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.status = status;
    if (reviewerNotes !== undefined) submission.reviewerNotes = reviewerNotes;
    await submission.save();

    res.json(submission);
  } catch (error) {
    handleError(res, error, "Failed to update submission status");
  }
};
