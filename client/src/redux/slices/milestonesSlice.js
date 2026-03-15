import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMilestoneCategories,
  fetchMilestoneLevels,
  fetchMilestoneChallenges,
  fetchMilestoneChallenge,
  fetchMyMilestoneSubmissions,
  createMilestoneSubmission,
  updateMilestoneSubmission,
  fetchMilestoneProgress,
} from "../thunks/milestonesThunks";

const initialState = {
  categories: [],
  levelsByCategory: {},
  challengesByLevel: {},
  challenge: null,
  mySubmissions: [],
  progressByCategory: {},
  loading: false,
  actionLoading: false,
  error: null,
};

const milestonesSlice = createSlice({
  name: "milestones",
  initialState,
  reducers: {
    clearMilestoneChallenge(state) {
      state.challenge = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMilestoneCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilestoneCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMilestoneCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch categories";
      })
      .addCase(fetchMilestoneLevels.fulfilled, (state, action) => {
        state.levelsByCategory[action.payload.categoryId] =
          action.payload.levels || [];
      })
      .addCase(fetchMilestoneChallenges.fulfilled, (state, action) => {
        state.challengesByLevel[action.payload.levelId] =
          action.payload.challenges || [];
      })
      .addCase(fetchMilestoneChallenge.fulfilled, (state, action) => {
        state.challenge = action.payload || null;
      })
      .addCase(fetchMyMilestoneSubmissions.fulfilled, (state, action) => {
        state.mySubmissions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createMilestoneSubmission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createMilestoneSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.mySubmissions = [action.payload, ...state.mySubmissions];
        }
      })
      .addCase(createMilestoneSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create submission";
      })
      .addCase(updateMilestoneSubmission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateMilestoneSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.mySubmissions = state.mySubmissions.map((item) =>
            item._id === action.payload._id ? action.payload : item,
          );
        }
      })
      .addCase(updateMilestoneSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update submission";
      })
      .addCase(fetchMilestoneProgress.fulfilled, (state, action) => {
        const categoryId = action.payload?.params?.categoryId;
        if (categoryId) {
          state.progressByCategory[categoryId] = action.payload.data || [];
        } else if (Array.isArray(action.payload?.data)) {
          action.payload.data.forEach((entry) => {
            if (entry.categoryId) {
              state.progressByCategory[entry.categoryId] = entry.progress || [];
            }
          });
        }
      });
  },
});

export const { clearMilestoneChallenge } = milestonesSlice.actions;
export default milestonesSlice.reducer;
