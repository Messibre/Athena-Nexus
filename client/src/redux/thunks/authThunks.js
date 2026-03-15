import { createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../config/api";

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, thunkApi) => {
  try {
    const response = await authApi.getMe();
    return response.data.user;
  } catch (error) {
    return thunkApi.rejectWithValue(
      error.response?.data?.message || "Failed to fetch user",
    );
  }
});

export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password }, thunkApi) => {
    try {
      const response = await authApi.login({ username, password });
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Login failed",
      );
    }
  },
);

export const signup = createAsyncThunk(
  "auth/signup",
  async ({ username, password, displayName, email, members }, thunkApi) => {
    try {
      const response = await authApi.signup({
        username,
        password,
        displayName,
        email,
        members,
      });
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to create account",
      );
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, thunkApi) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      return true;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to change password",
      );
    }
  },
);
