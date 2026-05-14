import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import intralLogo from "../assets/intral-logo.jpg";

function PasswordChangeRequired({ session, profile, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const writeAudit = async ({ success, notes }) => {
    try {
      await supabase.from("login_audit_logs").insert([
        {
          user_id: session?.user?.id || null,
          user_email: session?.user?.email || "",
          user_role: profile?.role || "",
          action: success
            ? "Password Change Completed"
            : "Password Change Failed",
          success,
          notes,
        },
      ]);
    } catch (error) {
      console.warn("Password change audit failed:", error.message);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setMessage("Enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsUpdating(true);
    setMessage("Updating password...");

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      await writeAudit({
        success: false,
        notes: passwordError.message,
      });

      setMessage(passwordError.message);
      setIsUpdating(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        must_change_password: false,
      })
      .eq("id", session.user.id);

    if (profileError) {
      await writeAudit({
        success: false,
        notes: profileError.message,
      });

      setMessage(profileError.message);
      setIsUpdating(false);
      return;
    }

    await writeAudit({
      success: true,
      notes: "User completed required first-login password change.",
    });

    setMessage("Password updated successfully.");

    setTimeout(() => {
      if (onPasswordChanged) {
        onPasswordChanged();
      } else {
        window.location.reload();
      }
    }, 700);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="page no-sidebar">
      <form className="login-card" onSubmit={updatePassword}>
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

          <h1 style={{ marginBottom: "8px" }}>Password Change Required</h1>

          <p style={{ marginTop: 0, color: "#475569", fontWeight: "600" }}>
            INTRAL Connect • Secure Account Setup
          </p>
        </div>

        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "16px",
            color: "#0f172a",
          }}
        >
          <strong>First Login Security Step</strong>
          <p style={{ marginBottom: 0 }}>
            Your account was created with a temporary password. Create your own
            password before accessing the system.
          </p>
        </div>

        <label>Email</label>
        <input value={session?.user?.email || ""} disabled />

        <label>New Password</label>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <button type="submit" disabled={isUpdating}>
          {isUpdating ? "Updating Password..." : "Update Password"}
        </button>

        <button
          type="button"
          onClick={logout}
          style={{
            background: "#475569",
            marginTop: "8px",
            width: "100%",
          }}
        >
          Logout
        </button>

        {message && (
          <p
            style={{
              marginTop: "14px",
              fontWeight: "700",
              color:
                message === "Password updated successfully." ||
                message === "Updating password..."
                  ? "#166534"
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
          This password update is required before accessing INTRAL operations.
        </div>
      </form>
    </div>
  );
}

export default PasswordChangeRequired;
