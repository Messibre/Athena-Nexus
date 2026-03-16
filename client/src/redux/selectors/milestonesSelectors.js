export const selectMilestonesState = (state) => state.milestones;
export const selectMilestoneCategories = (state) => state.milestones.categories;
export const selectMilestoneLevels = (state, categoryId) =>
  state.milestones.levelsByCategory[categoryId] || [];
export const selectMilestoneChallenges = (state, levelId) =>
  state.milestones.challengesByLevel[levelId] || [];
export const selectMilestoneChallenge = (state) => state.milestones.challenge;
export const selectMyMilestoneSubmissions = (state) =>
  state.milestones.mySubmissions;
export const selectPublicMilestoneSubmissions = (state) =>
  state.milestones.publicSubmissions;
export const selectMilestoneProgress = (state, categoryId) =>
  state.milestones.progressByCategory[categoryId] || [];
export const selectMilestonesLoading = (state) => state.milestones.loading;
export const selectMilestonesActionLoading = (state) =>
  state.milestones.actionLoading;
export const selectMilestonesError = (state) => state.milestones.error;

