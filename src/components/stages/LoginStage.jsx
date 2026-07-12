import GoogleIcon from "../GoogleIcon.jsx";

export default function LoginStage({ onContinue }) {
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
      <div className="clipflow-card">
        <button className="clipflow-btn" onClick={onContinue}>
          <GoogleIcon /> Continue with Google
        </button>
        <div className="clipflow-divider">or</div>
        <input className="clipflow-field" placeholder="name@studio.com" />
        <input className="clipflow-field" placeholder="Password" type="password" />
        <button className="clipflow-btn clipflow-btn-primary" onClick={onContinue}>
          Sign in
        </button>
      </div>
    </div>
  );
}
