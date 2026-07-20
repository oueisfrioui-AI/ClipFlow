import { useState, useEffect } from "react";
import Stepper from "./components/Stepper.jsx";
import Sidebar from "./components/Sidebar.jsx";
import MyLibraryPage from "./components/MyLibraryPage.jsx";
import LoginStage from "./components/stages/LoginStage.jsx";
import ImportStage from "./components/stages/ImportStage.jsx";
import ProcessingStage from "./components/stages/ProcessingStage.jsx";
import ReviewStage, { CLIPS } from "./components/stages/ReviewStage.jsx";
import PublishStage from "./components/stages/PublishStage.jsx";
import DoneStage from "./components/stages/DoneStage.jsx";

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
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [activeClipIds, setActiveClipIds] = useState([]);
  const [library, setLibrary] = useState([]);

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
    setSelectedClipIds([]);
    setActiveClipIds([]);
  }

  function logout() {
    setSidebarOpen(false);
    setStep("login");
    setCurrentVideo(null);
    setSelectedClipIds([]);
    setActiveClipIds([]);
    setUser(null);
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

  // Turns the selected candidate clips into real library entries tied to
  // the current video, then hands them to the Publish stage.
  function handleReviewContinue() {
    const newEntries = selectedClipIds.map((clipTemplateId) => {
      const template = CLIPS.find((c) => c.id === clipTemplateId);
      return {
        id: makeClipId(),
        videoId: currentVideo.videoId,
        videoTitle: currentVideo.title,
        videoThumbnail: currentVideo.thumbnail,
        videoChannel: currentVideo.channel,
        title: template.title,
        description:
          "Full video linked below. Cut with ClipFlow from " + currentVideo.title + ".",
        duration: template.duration,
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

  return (
    <div className="clipflow" data-theme={theme}>
      <div className="clipflow-appbar">
        <div className="clipflow-wordmark">
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

        {step === "login" && (
          <LoginStage
            onContinue={() => setStep("import")}
            onLogin={setUser}
            theme={theme}
          />
        )}

        {step === "import" && (
          <ImportStage
            onSubmit={(info) => {
              setCurrentVideo(info);
              setStep("processing");
            }}
          />
        )}

        {step === "processing" && (
          <ProcessingStage onDone={() => setStep("review")} />
        )}

        {step === "review" && (
          <ReviewStage
            selectedClipIds={selectedClipIds}
            onToggleClip={toggleClipSelection}
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