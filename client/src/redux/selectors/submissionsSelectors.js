export const selectSubmissionsState = (state) => state.submissions;
export const selectPublicSubmissions = (state) => state.submissions.publicItems;
export const selectMySubmissions = (state) => state.submissions.myItems;
export const selectCurrentSubmission = (state) => state.submissions.current;
export const selectSubmissionsLoading = (state) => state.submissions.loading;
export const selectSubmissionsActionLoading = (state) =>
  state.submissions.actionLoading;
export const selectSubmissionsError = (state) => state.submissions.error;
