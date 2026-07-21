import GoogleIcon from "../GoogleIcon.jsx";
import { API_BASE } from "../../lib/api.js";

export default function LoginStage() {
  function handleGoogleLogin() {
    // /auth/google issues a real HTTP redirect straight to Google — a plain
    // page navigation follows it fine, but fetch() can't (CORS blocks the
    // redirect hop to accounts.google.com), so we navigate directly.
    window.location.href = `${API_BASE}/auth/google`;
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
        <button className="clipflow-google-btn-real" onClick={handleGoogleLogin}>
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="clipflow-login-fineprint">
          By continuing, you agree to ClipFlow's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}