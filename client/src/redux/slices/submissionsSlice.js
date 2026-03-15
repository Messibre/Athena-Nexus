import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPublicSubmissions,
  fetchMySubmissions,
  fetchSubmissionById,
  createSubmission,
  updateSubmission,
} from "../thunks/submissionsThunks";

const initialState = {
  publicItems: [],
  myItems: [],
  current: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    clearCurrentSubmission(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.publicItems = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPublicSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch submissions";
      })
      .addCase(fetchMySubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.myItems = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMySubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch submissions";
      })
      .addCase(fetchSubmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload || null;
      })
      .addCase(fetchSubmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch submission";
      })
      .addCase(createSubmission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.myItems = [action.payload, ...state.myItems];
        }
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create submission";
      })
      .addCase(updateSubmission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.myItems = state.myItems.map((item) =>
            item._id === action.payload._id ? action.payload : item,
          );
          if (state.current?._id === action.payload._id) {
            state.current = action.payload;
          }
        }
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update submission";
      });
  },
});

export const { clearCurrentSubmission } = submissionsSlice.actions;
export default submissionsSlice.reducer;
