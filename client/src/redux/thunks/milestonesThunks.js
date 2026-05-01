import { createAsyncThunk } from "@reduxjs/toolkit";
import { milestonesApi } from "../../config/api";

export const fetchMilestoneCategories = createAsyncThunk(
  "milestones/fetchCategories",
  async (_, thunkApi) => {
    const cachedCategories = thunkApi.getState()?.milestones?.categories;
    if (Array.isArray(cachedCategories) && cachedCategories.length > 0) {
      return cachedCategories;
    }

    try {
      const response = await milestonesApi.getMilestoneCategories();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
);

export const fetchMilestoneLevels = createAsyncThunk(
  "milestones/fetchLevels",
  async (categoryId, thunkApi) => {
    const cachedLevels = thunkApi.getState()?.milestones?.levelsByCategory?.[categoryId];
    if (Array.isArray(cachedLevels) && cachedLevels.length > 0) {
      return { categoryId, levels: cachedLevels };
    }

    try {
      const response = await milestonesApi.getMilestoneLevels(categoryId);
      return { categoryId, levels: response.data };
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch levels",
      );
    }
  },
);

export const fetchMilestoneChallenges = createAsyncThunk(
  "milestones/fetchChallenges",
  async (levelId, thunkApi) => {
    const cachedChallenges = thunkApi.getState()?.milestones?.challengesByLevel?.[levelId];
    if (Array.isArray(cachedChallenges) && cachedChallenges.length > 0) {
      return { levelId, challenges: cachedChallenges };
    }

    try {
      const response = await milestonesApi.getMilestoneChallenges(levelId);
      return { levelId, challenges: response.data };
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch challenges",
      );
    }
  },
);

export const fetchMilestoneChallenge = createAsyncThunk(
  "milestones/fetchChallenge",
  async (id, thunkApi) => {
    try {
      const response = await milestonesApi.getMilestoneChallenge(id);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch challenge",
      );
    }
  },
);

export const fetchMyMilestoneSubmissions = createAsyncThunk(
  "milestones/fetchMySubmissions",
  async (_, thunkApi) => {
    try {
      const response = await milestonesApi.getMyMilestoneSubmissions();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch submissions",
      );
    }
  },
);

export const fetchPublicMilestoneSubmissions = createAsyncThunk(
  "milestones/fetchPublicSubmissions",
  async (_, thunkApi) => {
    try {
      const response = await milestonesApi.getPublicMilestoneSubmissions();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch submissions",
      );
    }
  },
);

export const createMilestoneSubmission = createAsyncThunk(
  "milestones/createSubmission",
  async (payload, thunkApi) => {
    try {
      const response = await milestonesApi.createMilestoneSubmission(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create submission",
      );
    }
  },
);

export const updateMilestoneSubmission = createAsyncThunk(
  "milestones/updateSubmission",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await milestonesApi.updateMilestoneSubmission(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update submission",
      );
    }
  },
);

export const fetchMilestoneProgress = createAsyncThunk(
  "milestones/fetchProgress",
  async (params, thunkApi) => {
    const categoryId = params?.categoryId;
    const cachedProgress =
      categoryId &&
      thunkApi.getState()?.milestones?.progressByCategory?.[categoryId];

    if (Array.isArray(cachedProgress) && cachedProgress.length > 0) {
      return { params, data: cachedProgress };
    }

    try {
      const response = await milestonesApi.getMilestoneProgress(params);
      return { params, data: response.data };
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch progress",
      );
    }
  },
);

