import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import themeReducer from "../slices/themeSlice";
import weeksReducer from "../slices/weeksSlice";
import submissionsReducer from "../slices/submissionsSlice";
import milestonesReducer from "../slices/milestonesSlice";
import adminReducer from "../slices/adminSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    weeks: weeksReducer,
    submissions: submissionsReducer,
    milestones: milestonesReducer,
    admin: adminReducer,
  },
});

export default store;
