import { createAsyncThunk } from "@reduxjs/toolkit";
import { weeksApi } from "../../config/api";

export const fetchWeeks = createAsyncThunk(
  "weeks/fetchWeeks",
  async (_, thunkApi) => {
    const cachedWeeks = thunkApi.getState()?.weeks?.items;
    if (Array.isArray(cachedWeeks) && cachedWeeks.length > 0) {
      return cachedWeeks;
    }

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

export const fetchActiveWeek = createAsyncThunk(
  "weeks/fetchActiveWeek",
  async (_, thunkApi) => {
    const cachedActiveWeek = thunkApi.getState()?.weeks?.activeWeek;
    if (cachedActiveWeek) {
      return cachedActiveWeek;
    }

    try {
      const response = await weeksApi.getActiveWeek();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch active week",
      );
    }
  },
);

export const fetchWeekById = createAsyncThunk(
  "weeks/fetchWeekById",
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

export const fetchWeekSubmissions = createAsyncThunk(
  "weeks/fetchWeekSubmissions",
  async (id, thunkApi) => {
    try {
      const response = await weeksApi.getWeekSubmissions(id);
      return { weekId: id, submissions: response.data };
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch week submissions",
      );
    }
  },
);

export const fetchPublicStats = createAsyncThunk(
  "weeks/fetchPublicStats",
  async (_, thunkApi) => {
    const cachedStats = thunkApi.getState()?.weeks?.publicStats;
    if (cachedStats) {
      return cachedStats;
    }

    try {
      const response = await weeksApi.getPublicStats();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats",
      );
    }
  },
);

export const fetchLeaderboard = createAsyncThunk(
  "weeks/fetchLeaderboard",
  async (_, thunkApi) => {
    const cachedLeaderboard = thunkApi.getState()?.weeks?.leaderboard;
    if (Array.isArray(cachedLeaderboard) && cachedLeaderboard.length > 0) {
      return cachedLeaderboard;
    }

    try {
      const response = await weeksApi.getLeaderboard();
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to fetch leaderboard",
      );
    }
  },
);
