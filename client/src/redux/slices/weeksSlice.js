import { createSlice } from "@reduxjs/toolkit";
import {
  fetchWeeks,
  fetchActiveWeek,
  fetchWeekById,
  fetchWeekSubmissions,
  fetchPublicStats,
} from "../thunks/weeksThunks";

const initialState = {
  items: [],
  byId: {},
  activeWeek: null,
  submissionsByWeek: {},
  publicStats: null,
  loading: false,
  error: null,
};

const weeksSlice = createSlice({
  name: "weeks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeeks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeeks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.byId = state.items.reduce((acc, week) => {
          acc[week._id] = week;
          return acc;
        }, {});
      })
      .addCase(fetchWeeks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch weeks";
      })
      .addCase(fetchActiveWeek.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveWeek.fulfilled, (state, action) => {
        state.loading = false;
        state.activeWeek = action.payload || null;
      })
      .addCase(fetchActiveWeek.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch active week";
      })
      .addCase(fetchWeekById.fulfilled, (state, action) => {
        if (action.payload && action.payload._id) {
          state.byId[action.payload._id] = action.payload;
        }
      })
      .addCase(fetchWeekSubmissions.fulfilled, (state, action) => {
        state.submissionsByWeek[action.payload.weekId] =
          action.payload.submissions || [];
      })
      .addCase(fetchPublicStats.fulfilled, (state, action) => {
        state.publicStats = action.payload || null;
      });
  },
});

export default weeksSlice.reducer;
