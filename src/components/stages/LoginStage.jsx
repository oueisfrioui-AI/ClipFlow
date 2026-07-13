import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function LoginStage({ onContinue, onLogin }) {
  function handleSuccess(credentialResponse) {
    // credentialResponse.credential is a signed JWT from Google.
    // Decoding it client-side gives us the user's name/email/picture.
    // (Decoding is NOT the same as verifying — see note below.)
    const decoded = jwtDecode(credentialResponse.credential);
    onLogin({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    });
    onContinue();
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
      <div className="clipflow-card">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Google login failed")}
          />
        </div>
      </div>
    </div>
  );
}