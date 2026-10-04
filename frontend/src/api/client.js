import axios from "axios";

export const TOKEN_KEY = "arogyini_token";

export class ApiError extends Error {
  constructor({ code, message, details = [], status }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }

  // Field-level messages for inline form errors: { email: "...", password: "..." }
  get fieldErrors() {
    return Object.fromEntries(this.details.filter((d) => d?.field).map((d) => [d.field, d.message]));
  }
}

// The server's wording is aimed at developers for a few codes. These are what the
// user should actually read.
const FRIENDLY = {
  UNAUTHENTICATED: "Your session has ended. Please sign in again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_TOKEN: "Your session is no longer valid. Please sign in again.",
  INTERNAL_ERROR: "Something went wrong at our end. Please try again in a moment.",
  INVALID_JSON: "That request could not be read. Please try again.",
  PAYLOAD_TOO_LARGE: "That is too large to send. Try shortening it.",
};

const friendlyFor = ({ code, message, status }) => {
  if (FRIENDLY[code]) return FRIENDLY[code];
  if (status === 502) return message || "The assistant is unavailable right now. Please try again shortly.";
  if (status === 503) return "The service is temporarily unavailable. Please try again shortly.";
  return message;
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Set by AuthContext so a 401 can clear state, not just the token.
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  // Unwrap the { success, data, meta } envelope; meta rides along for paginated lists.
  (response) => {
    const { data, meta } = response.data ?? {};
    return meta === undefined ? data : { data, meta };
  },
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data?.error;

    // An expired or revoked token logs out everywhere, except on the sign-in attempt itself.
    const isAuthAttempt = /\/auth\/sign(in|up)$/.test(error.config?.url ?? "");
    if (status === 401 && !isAuthAttempt) {
      clearToken();
      onUnauthorized?.();
    }

    if (payload) {
      return Promise.reject(
        new ApiError({ ...payload, status, message: friendlyFor({ ...payload, status }) })
      );
    }
    return Promise.reject(
      new ApiError({
        code: error.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK_ERROR",
        message: status
          ? "Something went wrong. Please try again."
          : "Cannot reach the server. Check that the backend is running.",
        status,
      })
    );
  }
);
