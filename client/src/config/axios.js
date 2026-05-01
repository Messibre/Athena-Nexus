import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const getApiErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (
    error.code === "ERR_NETWORK" ||
    error.message?.includes("Network Error")
  ) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "That request is taking longer than expected. Please try again in a moment.";
  }

  if (error.response?.status === 400) {
    return "We couldn't process that request. Please review your details and try again.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to do that.";
  }

  if (error.response?.status === 404) {
    return "We couldn't find that page or resource.";
  }

  if (error.response?.status === 409) {
    return "That item already exists. Try a different value.";
  }

  if (error.response?.status === 422) {
    return "Some of the information looks incomplete or invalid.";
  }

  if (error.response?.status === 429) {
    return "You're doing that too often. Please wait a moment and try again.";
  }

  if (error.response?.status >= 500) {
    return "The server ran into a problem. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
};

const emitAppError = (detail) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:error", { detail }));
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest.skipAuthRedirect &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await api.post("/api/auth/refresh", null, { skipAuthRedirect: true });
        return api(originalRequest);
      } catch {
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest.skipAuthRedirect) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    const normalizedMessage = getApiErrorMessage(error);
    const status = error.response?.status;

    if (!status || status >= 500 || status === 404) {
      emitAppError({
        title: status ? `Request Error (${status})` : "Network Error",
        message: normalizedMessage,
      });
    }

    error.normalizedMessage = normalizedMessage;

    return Promise.reject(error);
  },
);

export default api;
