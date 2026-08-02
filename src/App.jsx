import { useState, useEffect } from "react";
import Stepper from "./components/Stepper.jsx";
import Sidebar from "./components/Sidebar.jsx";
import MyLibraryPage from "./components/MyLibraryPage.jsx";
import LoginStage from "./components/stages/LoginStage.jsx";
import ImportStage from "./components/stages/ImportStage.jsx";
import ProcessingStage from "./components/stages/ProcessingStage.jsx";
import ReviewStage from "./components/stages/ReviewStage.jsx";
import PublishStage from "./components/stages/PublishStage.jsx";
import DoneStage from "./components/stages/DoneStage.jsx";
import { authFetch, getToken, setToken, clearToken, createJob } from "./lib/api.js";

// "01:23" or "1:02:15" -> seconds. Mirrors the parser in ReviewStage.jsx —
// small enough that a shared util felt like overkill for now, but worth
// factoring out if a third spot needs it.
function parseTimestamp(ts) {
  if (typeof ts === "number") return ts;
  if (typeof ts !== "string") return 0;
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Placeholder clips, used only while the backend's render_clips step is
// still a stub timer with no real output. Remove once real results flow
// through — see the TODO note on handleProcessingDone below.
const MOCK_CLIPS = [
  { duration: "0:38", title: "The moment the routine actually clicked", start: 42, end: 80 },
  { duration: "0:24", title: "\u201cI almost quit on day 9\u201d", start: 187, end: 211 },
  { duration: "0:51", title: "Before and after, side by side", start: 336, end: 387 },
  { duration: "0:19", title: "The one line that stuck with me", start: 512, end: 531 },
  { duration: "0:44", title: "Why nobody tells you this part", start: 641, end: 685 },
  { duration: "0:29", title: "The reaction says it all", start: 799, end: 828 },
];

function makeClipId() {
  return `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [step, setStep] = useState("login");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("clipflow-theme") || "light"
  );

  const [currentVideo, setCurrentVideo] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [generatedClips, setGeneratedClips] = useState([]);
  const [processingError, setProcessingError] = useState(null);
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [activeClipIds, setActiveClipIds] = useState([]);
  const [library, setLibrary] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);

  // On load: if we just landed back from the Google OAuth redirect, the
  // backend puts the token in the URL hash (#token=...). Pull it out,
  // save it, and scrub the hash so it's not left sitting in the address bar.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#token=")) {
      const token = decodeURIComponent(hash.slice("#token=".length));
      setToken(token);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Ask the backend who we are, using whatever token we have stored
  // (whether it just arrived above, or was already saved from a previous visit).
  useEffect(() => {
    async function checkSession() {
      const token = getToken();
      if (!token) {
        setCheckingSession(false);
        return;
      }
      try {
        const res = await authFetch("/auth/me");
        if (res.ok) {
          const me = await res.json();
          setUser({
            id: me.id,
            name: me.name,
            email: me.email,
            picture: me.picture_url,
          });
          setStep((s) => (s === "login" ? "import" : s));
        } else {
          // Token expired/invalid — clear it so we don't keep retrying it.
          clearToken();
        }
      } catch (err) {
        // Backend unreachable — stay on the login screen, keep the token
        // in case it's just a transient network issue.
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    localStorage.setItem("clipflow-theme", theme);
    document.body.style.background = theme === "dark" ? "#15130F" : "#FBF7F1";
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function startOver() {
    setStep("import");
    setCurrentVideo(null);
    setJobId(null);
    setGeneratedClips([]);
    setProcessingError(null);
    setSelectedClipIds([]);
    setActiveClipIds([]);
  }

  function logout() {
    setSidebarOpen(false);
    setStep("login");
    setCurrentVideo(null);
    setJobId(null);
    setGeneratedClips([]);
    setProcessingError(null);
    setSelectedClipIds([]);
    setActiveClipIds([]);
    setUser(null);
    clearToken();
  }

  function openLibrary() {
    setSidebarOpen(false);
    setStep("library");
  }

  function toggleClipSelection(id) {
    setSelectedClipIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Kicks off the real backend pipeline for a submitted video. Transitions
  // to "processing" immediately so the UI doesn't sit frozen on the button
  // click; ProcessingStage itself handles jobId still being null for the
  // brief moment before createJob() resolves.
  async function handleImportSubmit(info) {
    setCurrentVideo(info);
    setProcessingError(null);
    setJobId(null);
    setStep("processing");
    try {
      const { job_id } = await createJob(info.sourceUrl);
      setJobId(job_id);
    } catch (err) {
      setProcessingError("Couldn't start processing that video. Please try again.");
      setStep("import");
    }
  }

  // The backend is currently just a stub timer (per-step ~10s delay) while
  // the real pipeline logic isn't implemented yet — this is deliberately
  // for validating the job lifecycle wiring (auth -> create -> poll -> SSE)
  // ahead of the actual work. So there's no real `result.clips` payload
  // yet; fall back to mock clips so Review/Publish/Library can still be
  // exercised end-to-end. Once the backend returns real results, this same
  // `jobSnapshot?.result?.clips ?? jobSnapshot?.clips` lookup should just
  // start finding real data — confirm the exact field name/shape at that
  // point and this fallback can come out.
  function handleProcessingDone(jobSnapshot) {
    const rawClips = jobSnapshot?.result?.clips ?? jobSnapshot?.clips ?? MOCK_CLIPS;
    const clips = rawClips.map((c, i) => ({
      id: `${jobSnapshot.job_id || jobId}_${i}`,
      ...c,
    }));
    setGeneratedClips(clips);
    setSelectedClipIds([]);
    setStep("review");
  }

  function handleProcessingError(message) {
    setProcessingError(message);
    setStep("import");
  }

  // Turns the selected candidate clips into real library entries tied to
  // the current video, then hands them to the Publish stage.
  function handleReviewContinue() {
    const newEntries = selectedClipIds.map((clipId) => {
      const template = generatedClips.find((c) => c.id === clipId);
      const startSeconds = parseTimestamp(template.start);
      const endSeconds = parseTimestamp(template.end);
      return {
        id: makeClipId(),
        videoId: currentVideo.videoId,
        videoTitle: currentVideo.title,
        videoThumbnail: currentVideo.thumbnail,
        videoChannel: currentVideo.channel,
        title: template.title,
        description:
          "Full video linked below. Cut with ClipFlow from " + currentVideo.title + ".",
        duration:
          typeof template.duration === "number"
            ? formatDuration(template.duration)
            : formatDuration(endSeconds - startSeconds),
        start: startSeconds,
        end: endSeconds,
        // Carried over from the analysis step in case Publish/Library ever
        // want to surface them (score badge, hook as a subtitle, etc.).
        score: template.score,
        reason: template.reason,
        hook: template.hook,
        category: template.category,
        viralPotential: template.viral_potential,
        thumbnailIndex: 0,
        isShort: true,
        status: "draft",
        publishedUrl: null,
      };
    });

    setLibrary((prev) => [...newEntries, ...prev]);
    setActiveClipIds(newEntries.map((c) => c.id));
    setSelectedClipIds([]);
    setStep("publish");
  }

  function handlePostClip(id) {
    setLibrary((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "published", publishedUrl: `youtube.com/shorts/${id}` }
          : c
      )
    );
  }

  function handleDeleteClip(id) {
    setLibrary((prev) => prev.filter((c) => c.id !== id));
    setActiveClipIds((prev) => prev.filter((x) => x !== id));
  }

  function handleSaveClip(id, updates) {
    setLibrary((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  const activeClips = activeClipIds
    .map((id) => library.find((c) => c.id === id))
    .filter(Boolean);
  const activePublishedCount = activeClips.filter((c) => c.status === "published").length;

  if (checkingSession) {
    return (
      <div className="clipflow" data-theme={theme}>
        <div className="clipflow-content" style={{ textAlign: "center", paddingTop: 120 }}>
          <p style={{ color: "var(--ink-dim)", fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clipflow" data-theme={theme}>
      <div className="clipflow-appbar">
        <div
          className="clipflow-wordmark"
          onClick={user && step !== "login" ? startOver : undefined}
          style={{ cursor: user && step !== "login" ? "pointer" : "default" }}
        >
          clipflow<span>.</span>
        </div>
        <div className="clipflow-appbar-right">
          {step !== "login" && (
            <>
              <button className="clipflow-restart" onClick={openLibrary}>
                My Library
              </button>
              <button className="clipflow-restart" onClick={startOver}>
                Start over
              </button>
            </>
          )}
          {user &&
            (user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                title={user.name}
                className="clipflow-avatar"
                style={{ objectFit: "cover" }}
                onClick={() => setSidebarOpen(true)}
              />
            ) : (
              <div
                className="clipflow-avatar"
                onClick={() => setSidebarOpen(true)}
              />
            ))}
        </div>
      </div>

      <div className="clipflow-content">
        {step !== "login" && step !== "library" && <Stepper step={step} />}

        {step === "login" && <LoginStage />}

        {step === "import" && (
          <>
            {processingError && (
              <p
                style={{
                  color: "var(--orange)",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {processingError}
              </p>
            )}
            <ImportStage onSubmit={handleImportSubmit} />
          </>
        )}

        {step === "processing" && (
          <ProcessingStage
            jobId={jobId}
            onDone={handleProcessingDone}
            onError={handleProcessingError}
          />
        )}

        {step === "review" && (
          <ReviewStage
            videoId={currentVideo?.videoId}
            videoThumbnail={currentVideo?.thumbnail}
            clips={generatedClips}
            selectedClipIds={selectedClipIds}
            onToggleClip={toggleClipSelection}
            onSetSelectedClipIds={setSelectedClipIds}
            onContinue={handleReviewContinue}
          />
        )}

        {step === "publish" && (
          <PublishStage
            clips={activeClips}
            onPost={handlePostClip}
            onDelete={handleDeleteClip}
            onSave={handleSaveClip}
            onDone={() => setStep("done")}
          />
        )}

        {step === "done" && (
          <DoneStage
            publishedCount={activePublishedCount}
            onRestart={startOver}
            onOpenLibrary={openLibrary}
          />
        )}

        {step === "library" && (
          <MyLibraryPage
            library={library}
            onPost={handlePostClip}
            onDelete={handleDeleteClip}
            onSave={handleSaveClip}
          />
        )}
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
        library={library}
        onOpenLibrary={openLibrary}
      />
    </div>
  );
}