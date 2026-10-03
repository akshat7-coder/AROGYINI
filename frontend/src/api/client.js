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
      return Promise.reject(new ApiError({ ...payload, status }));
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
