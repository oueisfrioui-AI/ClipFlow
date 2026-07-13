import { useState, useEffect } from "react";
import BrowserChrome from "./components/BrowserChrome.jsx";
import Stepper from "./components/Stepper.jsx";
import Sidebar from "./components/Sidebar.jsx";
import LoginStage from "./components/stages/LoginStage.jsx";
import ImportStage from "./components/stages/ImportStage.jsx";
import ProcessingStage from "./components/stages/ProcessingStage.jsx";
import ReviewStage from "./components/stages/ReviewStage.jsx";
import PublishStage from "./components/stages/PublishStage.jsx";
import DoneStage from "./components/stages/DoneStage.jsx";

function urlForStep(step) {
  switch (step) {
    case "login":
      return "clipflow.app/login";
    case "import":
    case "processing":
      return "clipflow.app/new";
    case "review":
      return "clipflow.app/review/3fK9m2Lp1qs";
    case "publish":
      return "clipflow.app/publish/clip_0038";
    default:
      return "clipflow.app/publish/clip_0038/done";
  }
}

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
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function restart() {
    setStep("login");
    setSelectedClip(null);
    setIsShort(true);
    setThumbIndex(0);
    setUser(null);
  }

  function logout() {
    setSidebarOpen(false);
    restart();
  }

  return (
    <div className="clipflow" data-theme={theme}>
      <div className="clipflow-page">
        <div className="clipflow-masthead">
          <div className="clipflow-wordmark">
            clipflow<span>.</span>
          </div>
          <div className="clipflow-restart" onClick={restart}>
            Restart demo
          </div>
        </div>

        <Stepper step={step} />

        <div className="clipflow-frame">
          <BrowserChrome url={urlForStep(step)} />
          <div className="clipflow-screen">
            {(step === "import" ||
              step === "processing" ||
              step === "review" ||
              step === "publish") && (
              <div className="clipflow-topnav">
                <div className="clipflow-topnav-logo">clipflow.</div>
                {user?.picture ? (
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
                )}
              </div>
            )}

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
              <DoneStage isShort={isShort} onRestart={restart} />
            )}
          </div>
        </div>
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