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

  if (error.response?.status === 404) {
    return "Requested resource was not found.";
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
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
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
