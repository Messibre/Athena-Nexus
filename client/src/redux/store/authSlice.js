import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../config/api";

const initialState = {
  user: null,
  token: null,
  loading: true,
  actionLoading: false,
  error: null,
};

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, thunkApi) => {
  try {
    const response = await api.get("/api/auth/me");
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
      const response = await api.post("/api/auth/login", {
        username,
        password,
      });
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
      const response = await api.post("/api/auth/signup", {
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
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return true;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to change password",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.actionLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.token = "cookie";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(login.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.token = "cookie";
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Login failed";
      })
      .addCase(signup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.token = "cookie";
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create account";
      })
      .addCase(changePassword.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.actionLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to change password";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
