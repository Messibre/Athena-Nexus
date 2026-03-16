import { createAsyncThunk } from "@reduxjs/toolkit";
import { usersApi } from "../../config/api";

export const updateUserProfile = createAsyncThunk(
  "users/updateProfile",
  async ({ id, payload }, thunkApi) => {
    try {
      const response = await usersApi.updateUser(id, payload);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to update profile",
      );
    }
  },
);
