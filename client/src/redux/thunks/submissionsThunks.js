import { createAsyncThunk } from "@reduxjs/toolkit";
import { submissionsApi } from "../../config/api";

export const fetchPublicSubmissions = createAsyncThunk(
  "submissions/fetchPublic",
  async (params, thunkApi) => {
    try {
      const response = await submissionsApi.getPublicSubmissions(params);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch submissions",
      );
    }
  },
);

export const fetchMySubmissions = createAsyncThunk(
  "submissions/fetchMy",
  async (_, thunkApi) => {
    try {
      const response = await submissionsApi.getMySubmissions();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch submissions",
      );
    }
  },
);

export const fetchSubmissionById = createAsyncThunk(
  "submissions/fetchById",
  async (id, thunkApi) => {
    try {
      const response = await submissionsApi.getSubmissionById(id);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch submission",
      );
    }
  },
);

export const createSubmission = createAsyncThunk(
  "submissions/create",
  async (payload, thunkApi) => {
    try {
      const response = await submissionsApi.createSubmission(payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create submission",
      );
    }
  },
);

export const updateSubmission = createAsyncThunk(
  "submissions/update",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await submissionsApi.updateSubmission(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update submission",
      );
    }
  },
);
