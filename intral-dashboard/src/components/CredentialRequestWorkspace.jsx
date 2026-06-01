import React, { useState } from "react";
import { supabase } from "../supabaseClient";

function CredentialRequestWorkspace({ onBackToLogin }) {
  const [form, setForm] = useState({
    fullName: "",
    department: "",
    manager: "",
    email: "",
    phone: "",
    requestedRole: "employee",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitCredentialRequest = async () => {
    const cleanName = form.fullName.trim();
    const cleanEmail = form.email.trim();
    const cleanPhone = form.phone.trim();
    const cleanDepartment = form.department.trim();
    const cleanReason = form.reason.trim();

    if (!cleanName) {
      setRequestMessage("Full name is required.");
      return;
    }

    if (!cleanEmail) {
      setRequestMessage("Email is required.");
      return;
    }

    if (!cleanPhone) {
      setRequestMessage("Phone number is required.");
      return;
    }

    if (!cleanDepartment) {
      setRequestMessage("Department is required.");
      return;
    }

    if (!cleanReason) {
      setRequestMessage("Reason for access is required.");
      return;
    }

    setLoading(true);
    setRequestMessage("Submitting credential request...");

    const requestNotes = [
      `Full Name: ${cleanName}`,
      `Department: ${cleanDepartment}`,
      `Manager: ${form.manager.trim() || "Not provided"}`,
      `Phone: ${cleanPhone}`,
      `Requested Role: ${form.requestedRole}`,
      `Reason: ${cleanReason}`,
      "Source: Login screen credential request",
    ].join(" | ");

    const { error } = await supabase.from("admin_user_requests").insert([
      {
        requested_email: cleanEmail,
        requested_role: form.requestedRole || "employee",
        temporary_password: "",
        notes: requestNotes,
        requested_by: null,
        requested_by_email: cleanEmail,
        status: "Pending",
      },
    ]);

    if (error) {
      setRequestMessage(`Credential request failed: ${error.message}`);
      setLoading(false);
      return;
    }

    setForm({
      fullName: "",
      department: "",
      manager: "",
      email: "",
      phone: "",
      requestedRole: "employee",
      reason: "",
    });

    setRequestMessage(
      "Credential request submitted. An INTRAL admin will review the request and follow up."
    );
    setLoading(false);
  };

  return (
    <div className="login-panel">
      <div className="login-header">
        <h1>INTRAL CONNECT</h1>
        <p>Request Credentials • Admin Review Required</p>
      </div>

      <div className="login-form">
        <input
          value={form.fullName}
          onChange={(event) => updateForm("fullName", event.target.value)}
          placeholder="Full Name"
        />

        <input
          value={form.department}
          onChange={(event) => updateForm("department", event.target.value)}
          placeholder="Department / Area"
        />

        <input
          value={form.manager}
          onChange={(event) => updateForm("manager", event.target.value)}
          placeholder="Manager / Approver"
        />

        <input
          type="email"
          value={form.email}
          onChange={(event) => updateForm("email", event.target.value)}
          placeholder="Work Email"
        />

        <input
          value={form.phone}
          onChange={(event) => updateForm("phone", event.target.value)}
          placeholder="Phone Number"
        />

        <select
          value={form.requestedRole}
          onChange={(event) => updateForm("requestedRole", event.target.value)}
          style={{
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            fontSize: "15px",
          }}
        >
          <option value="employee">Employee Access</option>
          <option value="manager">Manager Access</option>
          <option value="customer">Customer Access</option>
        </select>

        <input
          value={form.reason}
          onChange={(event) => updateForm("reason", event.target.value)}
          placeholder="Reason for Access"
        />

        <button onClick={submitCredentialRequest} disabled={loading}>
          {loading ? "Submitting..." : "Submit Credential Request"}
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

        {requestMessage && (
          <p
            style={{
              marginTop: "4px",
              color: requestMessage.includes("failed") || requestMessage.includes("required")
                ? "#fecaca"
                : "#dbeafe",
              fontWeight: 800,
              lineHeight: 1.45,
            }}
          >
            {requestMessage}
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
          Requests are routed to the Admin Control Workbench for review before a
          real login account is created.
        </p>
      </div>
    </div>
  );
}

export default CredentialRequestWorkspace;
