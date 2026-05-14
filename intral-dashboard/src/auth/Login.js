import { useState } from "react";
import { supabase } from "../supabaseClient";
import intralLogo from "../assets/intral-logo.jpg";

function Login() {
  const [email, setEmail] = useState("admin@3pl.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  async function writeLoginAudit({
    userId = null,
    userEmail = "",
    userRole = "",
    action = "Login",
    success = true,
    notes = "",
  }) {
    try {
      await supabase.from("login_audit_logs").insert([
        {
          user_id: userId,
          user_email: userEmail,
          user_role: userRole,
          action,
          success,
          notes,
        },
      ]);
    } catch (error) {
      console.warn("Login audit failed:", error.message);
    }
  }

  async function getUserProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("Profile lookup failed:", error.message);
      return null;
    }

    return data;
  }

  async function handleLogin(e) {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setMessage("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);
    setMessage("Logging in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      await writeLoginAudit({
        userEmail: cleanEmail,
        action: "Login Failed",
        success: false,
        notes: error.message,
      });

      setMessage(error.message);
      setIsLoggingIn(false);
      return;
    }

    const user = data?.user || null;
    const userProfile = await getUserProfile(user?.id);

    if (userProfile && userProfile.is_active === false) {
      await writeLoginAudit({
        userId: user.id,
        userEmail: user.email || cleanEmail,
        userRole: userProfile.role || "",
        action: "Login Blocked",
        success: false,
        notes: "Account is disabled.",
      });

      await supabase.auth.signOut();

      setMessage("This account has been disabled. Contact an administrator.");
      setIsLoggingIn(false);
      return;
    }

    await writeLoginAudit({
      userId: user?.id || null,
      userEmail: user?.email || cleanEmail,
      userRole: userProfile?.role || "",
      action: "Login Successful",
      success: true,
      notes: "User logged into INTRAL Control Tower.",
    });

    setMessage("Login successful!");
    setIsLoggingIn(false);
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage("Enter your email first, then click Forgot Password.");
      return;
    }

    setIsResettingPassword(true);
    setMessage("Sending password reset email...");

    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      await writeLoginAudit({
        userEmail: cleanEmail,
        action: "Password Reset Failed",
        success: false,
        notes: error.message,
      });

      setMessage(error.message);
      setIsResettingPassword(false);
      return;
    }

    await writeLoginAudit({
      userEmail: cleanEmail,
      action: "Password Reset Requested",
      success: true,
      notes: "Password reset email requested from login page.",
    });

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
          Access is controlled by Supabase authentication, assigned user roles,
          account status, and login audit tracking.
          <br />
          Use Forgot Password if an employee needs account recovery.
        </div>
      </form>
    </div>
  );
}

export default Login;
