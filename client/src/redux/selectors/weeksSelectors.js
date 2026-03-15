export const selectWeeksState = (state) => state.weeks;
export const selectWeeks = (state) => state.weeks.items;
export const selectWeekById = (state, id) => state.weeks.byId[id];
export const selectActiveWeek = (state) => state.weeks.activeWeek;
export const selectWeekSubmissions = (state, id) =>
  state.weeks.submissionsByWeek[id] || [];
export const selectPublicStats = (state) => state.weeks.publicStats;
export const selectWeeksLoading = (state) => state.weeks.loading;
export const selectWeeksError = (state) => state.weeks.error;
