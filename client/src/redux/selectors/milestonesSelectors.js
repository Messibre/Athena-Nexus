import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

export const selectMilestonesState = (state) => state.milestones;
export const selectMilestoneCategories = (state) => state.milestones.categories;

const selectLevelsByCategory = (state) => state.milestones.levelsByCategory;
const selectChallengesByLevel = (state) => state.milestones.challengesByLevel;
const selectProgressByCategory = (state) => state.milestones.progressByCategory;

export const selectMilestoneLevels = createSelector(
  [selectLevelsByCategory, (_, categoryId) => categoryId],
  (levelsByCategory, categoryId) => levelsByCategory[categoryId] || EMPTY_ARRAY,
);

export const selectMilestoneChallenges = createSelector(
  [selectChallengesByLevel, (_, levelId) => levelId],
  (challengesByLevel, levelId) => challengesByLevel[levelId] || EMPTY_ARRAY,
);

export const selectMilestoneChallenge = (state) => state.milestones.challenge;
export const selectMyMilestoneSubmissions = (state) =>
  state.milestones.mySubmissions;
export const selectPublicMilestoneSubmissions = (state) =>
  state.milestones.publicSubmissions;

export const selectMilestoneProgress = createSelector(
  [selectProgressByCategory, (_, categoryId) => categoryId],
  (progressByCategory, categoryId) =>
    progressByCategory[categoryId] || EMPTY_ARRAY,
);

export const selectMilestonesLoading = (state) => state.milestones.loading;
export const selectMilestonesActionLoading = (state) =>
  state.milestones.actionLoading;
export const selectMilestonesError = (state) => state.milestones.error;
