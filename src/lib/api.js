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

// ---- Jobs API ----
// Pipeline: fetch_video -> transcribe -> score_moments -> render_clips.
// Each step's status is one of: pending | started | completed | failed.

// Kicks off a new job and returns immediately with { job_id }.
export async function createJob(videoUrl) {
  const res = await authFetch("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_url: videoUrl }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create job (${res.status}).`);
  }
  return res.json(); // { job_id }
}

// Full current state of a job. Use on page load / reconnect to show
// whatever's already completed before subscribing to live updates.
export async function getJobStatus(jobId) {
  const res = await authFetch(`/jobs/${jobId}/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job status (${res.status}).`);
  }
  return res.json();
}

// Opens an SSE connection for live step-by-step updates. The token has to
// go in the query string (not a header) because EventSource doesn't support
// custom headers. Returns the EventSource — call .close() on it when done
// (the "done" event closes it automatically too).
//
// callbacks:
//   onSnapshot(job)         — fired immediately on connect, full job object
//   onStep({step, status, error, job_status}) — fired on each step change
//   onDone(job | null)      — fired once, when job is completed or failed
//   onError(event)          — fired on connection-level errors
export function streamJobUpdates(jobId, { onSnapshot, onStep, onDone, onError } = {}) {
  const token = getToken();
  const url = `${API_BASE}/jobs/${jobId}/stream?token=${encodeURIComponent(token || "")}`;
  const source = new EventSource(url);

  source.addEventListener("snapshot", (e) => {
    onSnapshot?.(JSON.parse(e.data));
  });
  source.addEventListener("step", (e) => {
    onStep?.(JSON.parse(e.data));
  });
  source.addEventListener("done", (e) => {
    let payload = null;
    try {
      payload = e.data ? JSON.parse(e.data) : null;
    } catch {
      payload = null;
    }
    onDone?.(payload);
    source.close();
  });
  source.onerror = (e) => {
    onError?.(e);
  };

  return source;
}