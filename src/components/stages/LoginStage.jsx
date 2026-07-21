import { useState } from "react";
import GoogleIcon from "../GoogleIcon.jsx";
import { API_BASE } from "../../lib/api.js";

export default function LoginStage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      // /auth/google returns the Google OAuth URL as a JSON string —
      // we send the browser there with a full-page redirect.
      const res = await fetch(`${API_BASE}/auth/google`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Request failed.");
      const url = await res.json();
      window.location.href = url;
    } catch (err) {
      setError("Couldn't reach sign-in right now. Try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <div className="clipflow-login-eyebrow">✦ New here</div>
      </div>
      <h1 className="clipflow-login-headline">Find the moment worth sharing.</h1>
      <p className="clipflow-login-copy">
        Paste a video and ClipFlow finds the moment people won't scroll past,
        cuts it, and gets it ready to publish.
      </p>
      <div className="clipflow-card clipflow-login-card">
        <button
          className="clipflow-google-btn-real"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <GoogleIcon />
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
        {error && (
          <p style={{ color: "var(--orange)", fontSize: 13, textAlign: "center", marginTop: 14 }}>
            {error}
          </p>
        )}
        <p className="clipflow-login-fineprint">
          By continuing, you agree to ClipFlow's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}