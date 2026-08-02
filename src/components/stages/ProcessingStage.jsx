import { useState, useEffect, useRef } from "react";
import { getJobStatus, streamJobUpdates } from "../../lib/api.js";

const STEPS = [
  { key: "fetch_video", label: "Fetching video" },
  { key: "transcribe", label: "Transcribing audio" },
  { key: "score_moments", label: "Scoring moments for attention" },
  { key: "render_clips", label: "Rendering clips" },
];

export default function ProcessingStage({ jobId, onDone, onError }) {
  // Per-step status, keyed by step name: "pending" | "started" | "completed" | "failed"
  const [stepsStatus, setStepsStatus] = useState(
    Object.fromEntries(STEPS.map((s) => [s.key, "pending"]))
  );
  const [jobStatus, setJobStatus] = useState("pending");
  const [connectionError, setConnectionError] = useState(null);
  const doneRef = useRef(false); // guards against calling onDone/onError twice

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    if (snapshot.status) setJobStatus(snapshot.status);
    if (snapshot.steps) {
      setStepsStatus((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(snapshot.steps)) {
          next[key] = snapshot.steps[key]?.status ?? next[key];
        }
        return next;
      });
    }
  }

  useEffect(() => {
    if (!jobId) return; // job creation still in flight — see App.jsx
    let cancelled = false;
    let source = null;

    async function finish() {
      if (doneRef.current || cancelled) return;
      // Always re-fetch the authoritative status before finishing, rather
      // than trusting whatever partial payload triggered this — cheap and
      // avoids acting on a stale/incomplete event.
      try {
        const snapshot = await getJobStatus(jobId);
        if (cancelled) return;
        applySnapshot(snapshot);
        if (snapshot.status === "completed") {
          doneRef.current = true;
          // Backend is currently a stub timer with no real results yet —
          // App.jsx's handleProcessingDone falls back to mock clips until
          // the real pipeline is implemented. This just hands off whatever
          // the job snapshot contains, real or not.
          onDone(snapshot);
        } else if (snapshot.status === "failed") {
          doneRef.current = true;
          onError?.(snapshot.error || "Something went wrong while processing this video.");
        }
      } catch (err) {
        if (!cancelled) setConnectionError("Couldn't confirm job status. Retrying...");
      }
    }

    async function init() {
      try {
        const snapshot = await getJobStatus(jobId);
        if (cancelled) return;
        applySnapshot(snapshot);
        if (snapshot.status === "completed" || snapshot.status === "failed") {
          finish();
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setConnectionError("Couldn't load job status.");
        }
        return;
      }

      source = streamJobUpdates(jobId, {
        onSnapshot: applySnapshot,
        onStep: (evt) => {
          setConnectionError(null);
          setStepsStatus((prev) => ({ ...prev, [evt.step]: evt.status }));
          if (evt.job_status) setJobStatus(evt.job_status);
          if (evt.job_status === "completed" || evt.job_status === "failed") {
            finish();
          }
        },
        onDone: () => finish(),
        onError: () => {
          if (!cancelled) setConnectionError("Lost connection to the server. Retrying...");
        },
      });
    }

    init();
    return () => {
      cancelled = true;
      source?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const failedStep = STEPS.find((s) => stepsStatus[s.key] === "failed");
  const hasFailed = Boolean(failedStep) || jobStatus === "failed";

  return (
    <div className="clipflow-processing-wrap">
      {!hasFailed ? (
        <div className="clipflow-spinner" />
      ) : (
        <div className="clipflow-check-icon failed" style={{ margin: "0 auto 16px" }}>
          ✕
        </div>
      )}

      <p className="clipflow-processing-title">
        {hasFailed ? "Something went wrong" : "Finding the moment"}
      </p>
      <p className="clipflow-processing-sub">
        {hasFailed
          ? "That step failed — you can head back and try again."
          : connectionError || "This usually takes under a minute."}
      </p>

      <div className="clipflow-checklist">
        {STEPS.map((step, i) => {
          const status = stepsStatus[step.key];
          return (
            <div className="clipflow-check-row" key={step.key}>
              <div className={"clipflow-check-icon " + status}>
                {status === "completed"
                  ? "✓"
                  : status === "failed"
                  ? "✕"
                  : status === "started"
                  ? "···"
                  : i + 1}
              </div>
              <div className={"clipflow-check-text" + (status === "pending" ? " pending" : "")}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}