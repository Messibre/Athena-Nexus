import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi, milestonesApi, weeksApi } from "../../config/api";

export const fetchAdminWeeks = createAsyncThunk(
  "admin/fetchWeeks",
  async (_, thunkApi) => {
    try {
      const response = await weeksApi.getWeeks();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch weeks",
      );
    }
  },
);

export const fetchAdminWeekById = createAsyncThunk(
  "admin/fetchWeekById",
  async (id, thunkApi) => {
    try {
      const response = await weeksApi.getWeekById(id);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch week",
      );
    }
  },
);

export const createAdminWeek = createAsyncThunk(
  "admin/createWeek",
  async (payload, thunkApi) => {
    try {
      const response = await adminApi.createWeek(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create week",
      );
    }
  },
);

export const updateAdminWeek = createAsyncThunk(
  "admin/updateWeek",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await adminApi.updateWeek(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update week",
      );
    }
  },
);

export const deleteAdminWeek = createAsyncThunk(
  "admin/deleteWeek",
  async (id, thunkApi) => {
    try {
      await adminApi.deleteWeek(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to delete week",
      );
    }
  },
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, thunkApi) => {
    try {
      const response = await adminApi.getUsers();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const createAdminUser = createAsyncThunk(
  "admin/createUser",
  async (payload, thunkApi) => {
    try {
      const response = await adminApi.createUser(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create user",
      );
    }
  },
);

export const updateAdminUser = createAsyncThunk(
  "admin/updateUser",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await adminApi.updateUser(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

export const resetAdminUserPassword = createAsyncThunk(
  "admin/resetUserPassword",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await adminApi.resetUserPassword(id, payload);
      return { id, data: response.data };
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to reset password",
      );
    }
  },
);

export const deleteAdminUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, thunkApi) => {
    try {
      await adminApi.deleteUser(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

export const fetchAdminSubmissions = createAsyncThunk(
  "admin/fetchSubmissions",
  async (params, thunkApi) => {
    try {
      const response = await adminApi.getSubmissions(params);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch submissions",
      );
    }
  },
);

export const updateAdminSubmissionStatus = createAsyncThunk(
  "admin/updateSubmissionStatus",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await adminApi.updateSubmissionStatus(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update submission",
      );
    }
  },
);

export const exportAdminSubmissions = createAsyncThunk(
  "admin/exportSubmissions",
  async (_, thunkApi) => {
    try {
      const response = await adminApi.exportSubmissions();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to export submissions",
      );
    }
  },
);

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, thunkApi) => {
    try {
      const response = await adminApi.getStats();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats",
      );
    }
  },
);

export const fetchAdminMilestoneCategories = createAsyncThunk(
  "admin/fetchMilestoneCategories",
  async (_, thunkApi) => {
    try {
      const response = await milestonesApi.adminGetMilestoneCategories();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch milestone categories",
      );
    }
  },
);

export const createAdminMilestoneCategory = createAsyncThunk(
  "admin/createMilestoneCategory",
  async (payload, thunkApi) => {
    try {
      const response = await milestonesApi.adminCreateMilestoneCategory(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create milestone category",
      );
    }
  },
);

export const updateAdminMilestoneCategory = createAsyncThunk(
  "admin/updateMilestoneCategory",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await milestonesApi.adminUpdateMilestoneCategory(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update milestone category",
      );
    }
  },
);

export const deleteAdminMilestoneCategory = createAsyncThunk(
  "admin/deleteMilestoneCategory",
  async (id, thunkApi) => {
    try {
      await milestonesApi.adminDeleteMilestoneCategory(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to delete milestone category",
      );
    }
  },
);

export const fetchAdminMilestoneLevels = createAsyncThunk(
  "admin/fetchMilestoneLevels",
  async (params, thunkApi) => {
    try {
      const response = await milestonesApi.adminGetMilestoneLevels(params);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch milestone levels",
      );
    }
  },
);

export const createAdminMilestoneLevel = createAsyncThunk(
  "admin/createMilestoneLevel",
  async (payload, thunkApi) => {
    try {
      const response = await milestonesApi.adminCreateMilestoneLevel(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create milestone level",
      );
    }
  },
);

export const updateAdminMilestoneLevel = createAsyncThunk(
  "admin/updateMilestoneLevel",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await milestonesApi.adminUpdateMilestoneLevel(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update milestone level",
      );
    }
  },
);

export const deleteAdminMilestoneLevel = createAsyncThunk(
  "admin/deleteMilestoneLevel",
  async (id, thunkApi) => {
    try {
      await milestonesApi.adminDeleteMilestoneLevel(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to delete milestone level",
      );
    }
  },
);

export const fetchAdminMilestoneChallenges = createAsyncThunk(
  "admin/fetchMilestoneChallenges",
  async (params, thunkApi) => {
    try {
      const response = await milestonesApi.adminGetMilestoneChallenges(params);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch milestone challenges",
      );
    }
  },
);

export const createAdminMilestoneChallenge = createAsyncThunk(
  "admin/createMilestoneChallenge",
  async (payload, thunkApi) => {
    try {
      const response = await milestonesApi.adminCreateMilestoneChallenge(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create milestone challenge",
      );
    }
  },
);

export const updateAdminMilestoneChallenge = createAsyncThunk(
  "admin/updateMilestoneChallenge",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await milestonesApi.adminUpdateMilestoneChallenge(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update milestone challenge",
      );
    }
  },
);

export const deleteAdminMilestoneChallenge = createAsyncThunk(
  "admin/deleteMilestoneChallenge",
  async (id, thunkApi) => {
    try {
      await milestonesApi.adminDeleteMilestoneChallenge(id);
      return id;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to delete milestone challenge",
      );
    }
  },
);

export const fetchAdminMilestoneSubmissions = createAsyncThunk(
  "admin/fetchMilestoneSubmissions",
  async (params, thunkApi) => {
    try {
      const response = await milestonesApi.adminGetMilestoneSubmissions(params);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch milestone submissions",
      );
    }
  },
);

export const updateAdminMilestoneSubmissionStatus = createAsyncThunk(
  "admin/updateMilestoneSubmissionStatus",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await milestonesApi.adminUpdateMilestoneSubmissionStatus(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update milestone submission",
      );
    }
  },
);
