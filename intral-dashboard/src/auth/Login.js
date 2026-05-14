import { useState } from "react";
import { supabase } from "../supabaseClient";
import intralLogo from "../assets/intral-logo.jpg";

function Login() {
  const [email, setEmail] = useState("admin@3pl.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setMessage("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);
    setMessage("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoggingIn(false);
      return;
    }

    setMessage("Login successful!");
    setIsLoggingIn(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage("Enter your email first, then click Forgot Password.");
      return;
    }

    setIsResettingPassword(true);
    setMessage("Sending password reset email...");

    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      setMessage(error.message);
      setIsResettingPassword(false);
      return;
    }

    setMessage(
      "Password reset email sent. Check your inbox and follow the reset link."
    );
    setIsResettingPassword(false);
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <img
            src={intralLogo}
            alt="INTRAL Logo"
            style={{
              width: "110px",
              height: "auto",
              objectFit: "contain",
              marginBottom: "14px",
            }}
          />

          <h1 style={{ marginBottom: "8px" }}>3PL OPS Login</h1>

          <p style={{ marginTop: 0, color: "#475569", fontWeight: "600" }}>
            INTRAL Control Tower • WMS • IMS • ERP
          </p>
        </div>

        <label>Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
        />

        <label>Password</label>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={isLoggingIn || isResettingPassword}>
          {isLoggingIn ? "Logging In..." : "Log In"}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isLoggingIn || isResettingPassword}
          style={{
            background: "#475569",
            marginTop: "8px",
            width: "100%",
          }}
        >
          {isResettingPassword ? "Sending Reset Email..." : "Forgot Password"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "14px",
              fontWeight: "700",
              color:
                message === "Login successful!" ||
                message.includes("Password reset email sent")
                  ? "#166534"
                  : message === "Logging in..." ||
                    message === "Sending password reset email..."
                  ? "#475569"
                  : "#991b1b",
            }}
          >
            {message}
          </p>
        )}

        <div
          style={{
            marginTop: "22px",
            paddingTop: "14px",
            borderTop: "1px solid #e2e8f0",
            fontSize: "13px",
            color: "#64748b",
            lineHeight: "1.5",
          }}
        >
          <strong>Authorized Users Only</strong>
          <br />
          Access is controlled by Supabase authentication and assigned user roles.
          <br />
          Use Forgot Password if an employee needs account recovery.
        </div>
      </form>
    </div>
  );
}

export default Login;
