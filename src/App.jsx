import { useState, useEffect } from "react";
import Stepper from "./components/Stepper.jsx";
import Sidebar from "./components/Sidebar.jsx";
import LoginStage from "./components/stages/LoginStage.jsx";
import ImportStage from "./components/stages/ImportStage.jsx";
import ProcessingStage from "./components/stages/ProcessingStage.jsx";
import ReviewStage from "./components/stages/ReviewStage.jsx";
import PublishStage from "./components/stages/PublishStage.jsx";
import DoneStage from "./components/stages/DoneStage.jsx";

export default function App() {
  const [step, setStep] = useState("login");
  const [selectedClip, setSelectedClip] = useState(null);
  const [isShort, setIsShort] = useState(true);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("clipflow-theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("clipflow-theme", theme);
    document.body.style.background = theme === "dark" ? "#15130F" : "#FBF7F1";
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function startOver() {
    setStep("import");
    setSelectedClip(null);
    setIsShort(true);
    setThumbIndex(0);
  }

  function logout() {
    setSidebarOpen(false);
    setStep("login");
    setSelectedClip(null);
    setIsShort(true);
    setThumbIndex(0);
    setUser(null);
  }

  return (
    <div className="clipflow" data-theme={theme}>
      <div className="clipflow-appbar">
        <div className="clipflow-wordmark">
          clipflow<span>.</span>
        </div>
        <div className="clipflow-appbar-right">
          {step !== "login" && (
            <button className="clipflow-restart" onClick={startOver}>
              Start over
            </button>
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
        {step !== "login" && <Stepper step={step} />}

        {step === "login" && (
          <LoginStage
            onContinue={() => setStep("import")}
            onLogin={setUser}
          />
        )}

        {step === "import" && (
          <ImportStage onSubmit={() => setStep("processing")} />
        )}

        {step === "processing" && (
          <ProcessingStage onDone={() => setStep("review")} />
        )}

        {step === "review" && (
          <ReviewStage
            selectedClip={selectedClip}
            onSelectClip={setSelectedClip}
            onContinue={() => setStep("publish")}
          />
        )}

        {step === "publish" && (
          <PublishStage
            isShort={isShort}
            onToggleShort={() => setIsShort(!isShort)}
            thumbIndex={thumbIndex}
            onSelectThumb={setThumbIndex}
            onPublish={() => setStep("done")}
          />
        )}

        {step === "done" && (
          <DoneStage isShort={isShort} onRestart={startOver} />
        )}
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />
    </div>
  );
}