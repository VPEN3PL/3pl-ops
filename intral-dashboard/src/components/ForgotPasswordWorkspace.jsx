import React, { useState } from "react";
import { supabase } from "../supabaseClient";

function ForgotPasswordWorkspace({ onBackToLogin }) {
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const handlePasswordRecovery = async () => {
    const cleanEmail = recoveryEmail.trim();

    if (!cleanEmail) {
      setRecoveryMessage("Enter your email address to request password recovery.");
      return;
    }

    setLoading(true);
    setRecoveryMessage("Sending password recovery email...");

    const redirectTo =
      window.location.origin && window.location.origin !== "null"
        ? window.location.origin
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      setRecoveryMessage(`Password recovery failed: ${error.message}`);
      setLoading(false);
      return;
    }

    setRecoveryMessage(
      "Password recovery email sent. Check your inbox and follow the secure reset link."
    );
    setLoading(false);
  };

  return (
    <div className="login-panel">
      <div className="login-header">
        <h1>INTRAL CONNECT</h1>
        <p>Password Recovery • Secure Credential Reset</p>
      </div>

      <div className="login-form">
        <input
          type="email"
          placeholder="Enter your account email"
          value={recoveryEmail}
          onChange={(event) => setRecoveryEmail(event.target.value)}
        />

        <button onClick={handlePasswordRecovery} disabled={loading}>
          {loading ? "Sending..." : "Send Password Recovery Email"}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          style={{
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(147, 197, 253, 0.35)",
          }}
        >
          Back to Login
        </button>

        {recoveryMessage && (
          <p
            style={{
              marginTop: "4px",
              color: recoveryMessage.includes("failed") ? "#fecaca" : "#dbeafe",
              fontWeight: 800,
              lineHeight: 1.45,
            }}
          >
            {recoveryMessage}
          </p>
        )}

        <p
          style={{
            color: "#cbd5e1",
            fontSize: "12px",
            lineHeight: 1.5,
            marginTop: "4px",
          }}
        >
          If you do not receive an email, contact an INTRAL admin to force a
          temporary password reset from the Admin Control Workbench.
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordWorkspace;
