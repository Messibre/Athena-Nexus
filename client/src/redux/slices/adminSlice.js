import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAdminWeeks,
  fetchAdminWeekById,
  createAdminWeek,
  updateAdminWeek,
  deleteAdminWeek,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
  fetchAdminSubmissions,
  updateAdminSubmissionStatus,
  exportAdminSubmissions,
  fetchAdminStats,
  fetchAdminMilestoneCategories,
  createAdminMilestoneCategory,
  updateAdminMilestoneCategory,
  deleteAdminMilestoneCategory,
  fetchAdminMilestoneLevels,
  createAdminMilestoneLevel,
  updateAdminMilestoneLevel,
  deleteAdminMilestoneLevel,
  fetchAdminMilestoneChallenges,
  createAdminMilestoneChallenge,
  updateAdminMilestoneChallenge,
  deleteAdminMilestoneChallenge,
  fetchAdminMilestoneSubmissions,
  updateAdminMilestoneSubmissionStatus,
} from "../thunks/adminThunks";

const initialState = {
  weeks: [],
  weekById: {},
  users: [],
  submissions: [],
  stats: null,
  milestoneCategories: [],
  milestoneLevels: [],
  milestoneChallenges: [],
  milestoneSubmissions: [],
  loading: false,
  actionLoading: false,
  error: null,
  exportBlob: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    clearExportBlob(state) {
      state.exportBlob = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminWeeks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminWeeks.fulfilled, (state, action) => {
        state.loading = false;
        state.weeks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminWeeks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch weeks";
      })
      .addCase(fetchAdminWeekById.fulfilled, (state, action) => {
        if (action.payload && action.payload._id) {
          state.weekById[action.payload._id] = action.payload;
        }
      })
      .addCase(createAdminWeek.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAdminWeek.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.weeks = [action.payload, ...state.weeks];
        }
      })
      .addCase(createAdminWeek.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create week";
      })
      .addCase(updateAdminWeek.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminWeek.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.weeks = state.weeks.map((week) =>
            week._id === action.payload._id ? action.payload : week,
          );
        }
      })
      .addCase(updateAdminWeek.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update week";
      })
      .addCase(deleteAdminWeek.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAdminWeek.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.weeks = state.weeks.filter((week) => week._id !== action.payload);
      })
      .addCase(deleteAdminWeek.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete week";
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch users";
      })
      .addCase(createAdminUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAdminUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.users = [action.payload, ...state.users];
        }
      })
      .addCase(createAdminUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create user";
      })
      .addCase(updateAdminUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload.id) {
          state.users = state.users.map((user) =>
            user._id === action.payload.id ? { ...user, ...action.payload } : user,
          );
        }
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update user";
      })
      .addCase(resetAdminUserPassword.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(resetAdminUserPassword.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(resetAdminUserPassword.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to reset password";
      })
      .addCase(deleteAdminUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete user";
      })
      .addCase(fetchAdminSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch submissions";
      })
      .addCase(updateAdminSubmissionStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminSubmissionStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.submissions = state.submissions.map((sub) =>
            sub._id === action.payload._id ? action.payload : sub,
          );
        }
      })
      .addCase(updateAdminSubmissionStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update submission";
      })
      .addCase(exportAdminSubmissions.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(exportAdminSubmissions.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.exportBlob = action.payload;
      })
      .addCase(exportAdminSubmissions.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to export submissions";
      })
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload || null;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch stats";
      })
      .addCase(fetchAdminMilestoneCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMilestoneCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.milestoneCategories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminMilestoneCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch milestone categories";
      })
      .addCase(createAdminMilestoneCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAdminMilestoneCategory.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.milestoneCategories = [action.payload, ...state.milestoneCategories];
        }
      })
      .addCase(createAdminMilestoneCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create milestone category";
      })
      .addCase(updateAdminMilestoneCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminMilestoneCategory.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.milestoneCategories = state.milestoneCategories.map((cat) =>
            cat._id === action.payload._id ? action.payload : cat,
          );
        }
      })
      .addCase(updateAdminMilestoneCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update milestone category";
      })
      .addCase(deleteAdminMilestoneCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAdminMilestoneCategory.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.milestoneCategories = state.milestoneCategories.filter(
          (cat) => cat._id !== action.payload,
        );
      })
      .addCase(deleteAdminMilestoneCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete milestone category";
      })
      .addCase(fetchAdminMilestoneLevels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMilestoneLevels.fulfilled, (state, action) => {
        state.loading = false;
        state.milestoneLevels = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminMilestoneLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch milestone levels";
      })
      .addCase(createAdminMilestoneLevel.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAdminMilestoneLevel.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.milestoneLevels = [action.payload, ...state.milestoneLevels];
        }
      })
      .addCase(createAdminMilestoneLevel.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create milestone level";
      })
      .addCase(updateAdminMilestoneLevel.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminMilestoneLevel.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.milestoneLevels = state.milestoneLevels.map((lvl) =>
            lvl._id === action.payload._id ? action.payload : lvl,
          );
        }
      })
      .addCase(updateAdminMilestoneLevel.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update milestone level";
      })
      .addCase(deleteAdminMilestoneLevel.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAdminMilestoneLevel.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.milestoneLevels = state.milestoneLevels.filter(
          (lvl) => lvl._id !== action.payload,
        );
      })
      .addCase(deleteAdminMilestoneLevel.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete milestone level";
      })
      .addCase(fetchAdminMilestoneChallenges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMilestoneChallenges.fulfilled, (state, action) => {
        state.loading = false;
        state.milestoneChallenges = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminMilestoneChallenges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch milestone challenges";
      })
      .addCase(createAdminMilestoneChallenge.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAdminMilestoneChallenge.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.milestoneChallenges = [action.payload, ...state.milestoneChallenges];
        }
      })
      .addCase(createAdminMilestoneChallenge.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create milestone challenge";
      })
      .addCase(updateAdminMilestoneChallenge.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminMilestoneChallenge.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.milestoneChallenges = state.milestoneChallenges.map((ch) =>
            ch._id === action.payload._id ? action.payload : ch,
          );
        }
      })
      .addCase(updateAdminMilestoneChallenge.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update milestone challenge";
      })
      .addCase(deleteAdminMilestoneChallenge.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAdminMilestoneChallenge.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.milestoneChallenges = state.milestoneChallenges.filter(
          (ch) => ch._id !== action.payload,
        );
      })
      .addCase(deleteAdminMilestoneChallenge.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete milestone challenge";
      })
      .addCase(fetchAdminMilestoneSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminMilestoneSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.milestoneSubmissions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminMilestoneSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch milestone submissions";
      })
      .addCase(updateAdminMilestoneSubmissionStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAdminMilestoneSubmissionStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload._id) {
          state.milestoneSubmissions = state.milestoneSubmissions.map((sub) =>
            sub._id === action.payload._id ? action.payload : sub,
          );
        }
      })
      .addCase(updateAdminMilestoneSubmissionStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update milestone submission";
      });
  },
});

export const { clearAdminError, clearExportBlob } = adminSlice.actions;
export default adminSlice.reducer;
