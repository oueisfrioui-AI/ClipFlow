import { useRef, useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function LoginStage({ onContinue, onLogin, theme }) {
  const buttonWrapRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(280);

  useEffect(() => {
    if (buttonWrapRef.current) {
      setButtonWidth(Math.round(buttonWrapRef.current.offsetWidth));
    }
  }, []);

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
      <div className="clipflow-card clipflow-login-card">
        <div className="clipflow-google-btn" ref={buttonWrapRef}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Google login failed")}
            theme={theme === "dark" ? "outline" : "filled_black"}
            shape="pill"
            size="large"
            text="continue_with"
            logo_alignment="left"
            width={buttonWidth}
          />
        </div>
        <p className="clipflow-login-fineprint">
          By continuing, you agree to ClipFlow's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}