import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMe,
  login,
  signup,
  changePassword,
  logoutSession,
} from "../thunks/authThunks";

const initialState = {
  user: null,
  token: null,
  loading: true,
  actionLoading: false,
  error: null,
};

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
      })
      .addCase(logoutSession.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.actionLoading = false;
        state.error = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
