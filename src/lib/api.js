// Base URL for the ClipFlow backend API.
export const API_BASE = "https://clipflow-api-8k5b.onrender.com";

const TOKEN_KEY = "clipflow_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Wraps fetch() to attach the stored token as a Bearer header automatically.
// Use this for any call to the backend that requires auth.
export function authFetch(path, options = {}) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}