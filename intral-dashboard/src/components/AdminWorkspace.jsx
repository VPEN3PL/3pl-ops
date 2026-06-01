import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function AdminWorkspace({ session, profile }) {
  const CREATE_USER_FUNCTION_URL =
    "https://yykbaayqwnewqljrywit.supabase.co/functions/v1/create-user";

  const RESET_PASSWORD_FUNCTION_URL =
    "https://yykbaayqwnewqljrywit.supabase.co/functions/v1/reset-user-password";

  const [profiles, setProfiles] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState("");
  const [resettingUserId, setResettingUserId] = useState("");
  const [openSection, setOpenSection] = useState("requests");
  const [profileIdentityEdits, setProfileIdentityEdits] = useState({});

  const [newUserForm, setNewUserForm] = useState({
    email: "",
    role: "employee",
    temporaryPassword: "",
    notes: "",
    status: "Pending",
  });

  const isAdmin = String(profile?.role || "").toLowerCase().trim() === "admin";

  const roleOptions = ["admin", "manager", "employee", "customer"];
  const statusOptions = [
    "Pending",
    "Approved",
    "Created",
    "Rejected",
    "Disabled",
  ];

  const loadProfiles = async () => {
    if (!isAdmin) {
      setMessage("Only Admin users can access user management.");
      return;
    }

    setLoadingProfiles(true);
    setMessage("Loading user profiles...");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("role", { ascending: true });

    if (error) {
      setMessage(`Profile load failed: ${error.message}`);
      setLoadingProfiles(false);
      return;
    }

    setProfiles(data || []);
    setMessage("");
    setLoadingProfiles(false);
  };

  const loadUserRequests = async () => {
    if (!isAdmin) {
      setMessage("Only Admin users can view user requests.");
      return;
    }

    setLoadingRequests(true);

    const { data, error } = await supabase
      .from("admin_user_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`User request load failed: ${error.message}`);
      setLoadingRequests(false);
      return;
    }

    setUserRequests(data || []);
    setLoadingRequests(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
      loadUserRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const adminMetrics = useMemo(() => {
    const activeUsers = profiles.filter((item) => item.is_active !== false).length;
    const disabledUsers = profiles.filter((item) => item.is_active === false).length;
    const resetRequired = profiles.filter((item) => item.must_change_password).length;
    const pendingRequests = userRequests.filter((item) => {
      const status = String(item.status || "Pending").toLowerCase();
      return status === "pending" || status === "approved";
    }).length;

    return {
      activeUsers,
      disabledUsers,
      resetRequired,
      pendingRequests,
      totalProfiles: profiles.length,
      totalRequests: userRequests.length,
    };
  }, [profiles, userRequests]);

  const updateNewUserForm = (field, value) => {
    setNewUserForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateProfileIdentityDraft = (profileId, field, value) => {
    setProfileIdentityEdits((prev) => ({
      ...prev,
      [profileId]: {
        ...(prev[profileId] || {}),
        [field]: value,
      },
    }));
  };

  const getIdentityDraftValue = (item, field, fallback = "") => {
    if (profileIdentityEdits[item.id]?.[field] !== undefined) {
      return profileIdentityEdits[item.id][field];
    }

    return item[field] || fallback;
  };

  const updateProfileIdentity = async (item) => {
    if (!isAdmin) {
      alert("Only Admin users can update profile identity.");
      return;
    }

    if (!item?.id) {
      alert("Profile ID is required.");
      return;
    }

    const nextDisplayName = String(
      getIdentityDraftValue(
        item,
        "display_name",
        item.display_name || item.full_name || item.name || item.user_name || ""
      )
    ).trim();

    const nextDepartment = String(
      getIdentityDraftValue(item, "department", item.department || "")
    ).trim();

    const nextEmail = String(
      getIdentityDraftValue(item, "email", item.email || item.user_email || "")
    )
      .trim()
      .toLowerCase();

    if (!nextDisplayName) {
      alert("Display Name is required.");
      return;
    }

    if (!nextEmail) {
      alert("Email is required.");
      return;
    }

    if (!nextEmail.includes("@") || !nextEmail.includes(".")) {
      alert("Enter a valid email address.");
      return;
    }

    const confirmed = window.confirm(
      `Save identity for ${nextDisplayName}?\n\nDepartment: ${
        nextDepartment || "Not provided"
      }\nEmail: ${nextEmail}`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({
  display_name: nextDisplayName,
  full_name: nextDisplayName,
  department: nextDepartment,
  email: nextEmail,
  user_email: nextEmail,
})
      .eq("id", item.id);

    if (error) {
      alert(`Profile identity update failed: ${error.message}`);
      return;
    }

    setProfiles((prev) =>
      prev.map((profileItem) =>
        profileItem.id === item.id
          ? {
              ...profileItem,
              display_name: nextDisplayName,
              full_name: nextDisplayName,
              department: nextDepartment,
              email: nextEmail,
              user_email: nextEmail,
            }
          : profileItem
      )
    );

    setProfileIdentityEdits((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    alert("Profile identity saved successfully.");
await loadProfiles();
await loadUserRequests();
  };

  const updateProfileRole = async (profileId, newRole) => {
    if (!isAdmin) {
      alert("Only Admin users can update roles.");
      return;
    }

    if (!profileId || !newRole) {
      alert("Profile ID and role are required.");
      return;
    }

    const confirmed = window.confirm(
      `Change this user role to ${newRole.toUpperCase()}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        role: newRole,
      })
      .eq("id", profileId);

    if (error) {
      alert(`Role update failed: ${error.message}`);
      return;
    }

    setProfiles((prev) =>
      prev.map((item) =>
        item.id === profileId
          ? {
              ...item,
              role: newRole,
            }
          : item
      )
    );

    alert("Role updated successfully.");
  };

  const updateProfileActiveStatus = async (profileId, isActive) => {
    if (!isAdmin) {
      alert("Only Admin users can manage account status.");
      return;
    }

    if (!profileId) {
      alert("Profile ID is required.");
      return;
    }

    const actionText = isActive ? "reactivate" : "disable";
    const confirmed = window.confirm(`Are you sure you want to ${actionText} this account?`);

    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_active: isActive,
      })
      .eq("id", profileId);

    if (error) {
      alert(`Account status update failed: ${error.message}`);
      return;
    }

    setProfiles((prev) =>
      prev.map((item) =>
        item.id === profileId
          ? {
              ...item,
              is_active: isActive,
            }
          : item
      )
    );

    alert(isActive ? "Account reactivated." : "Account disabled.");
  };

  const saveUserRequest = async () => {
    if (!isAdmin) {
      alert("Only Admin users can save user requests.");
      return;
    }

    if (!newUserForm.email.trim()) {
      alert("Email is required.");
      return;
    }

    if (!newUserForm.role) {
      alert("Role is required.");
      return;
    }

    if (!newUserForm.temporaryPassword.trim()) {
      alert("Temporary password is required for account creation.");
      return;
    }

    const { data, error } = await supabase
      .from("admin_user_requests")
      .insert([
        {
          requested_email: newUserForm.email.trim(),
          requested_role: newUserForm.role,
          temporary_password: newUserForm.temporaryPassword.trim(),
          notes: newUserForm.notes.trim(),
          requested_by: session?.user?.id || null,
          requested_by_email: session?.user?.email || "",
          status: newUserForm.status || "Pending",
        },
      ])
      .select()
      .single();

    if (error) {
      alert(`User request save failed: ${error.message}`);
      return;
    }

    setUserRequests((prev) => [data, ...prev]);

    setNewUserForm({
      email: "",
      role: "employee",
      temporaryPassword: "",
      notes: "",
      status: "Pending",
    });

    alert("User request saved successfully.");
  };

  const updateUserRequestStatus = async (requestId, newStatus) => {
    if (!isAdmin) {
      alert("Only Admin users can update request status.");
      return;
    }

    if (!requestId || !newStatus) {
      alert("Request ID and status are required.");
      return;
    }

    const { error } = await supabase
      .from("admin_user_requests")
      .update({
        status: newStatus,
      })
      .eq("id", requestId);

    if (error) {
      alert(`Status update failed: ${error.message}`);
      return;
    }

    setUserRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: newStatus,
            }
          : request
      )
    );

    alert("Request status updated.");
  };

  const createRealUserFromRequest = async (request) => {
    if (!isAdmin) {
      alert("Only Admin users can create accounts.");
      return;
    }

    if (!request?.requested_email) {
      alert("Requested email is missing.");
      return;
    }

    if (!request?.temporary_password) {
      alert("Temporary password is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Create REAL Supabase login for ${request.requested_email} and send onboarding email?`
    );

    if (!confirmed) return;

    setCreatingUserId(request.id);

    try {
      const response = await fetch(CREATE_USER_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: request.requested_email,
          password: request.temporary_password,
          role: request.requested_role || "employee",
          notes: request.notes || "",
          requestedByEmail: session?.user?.email || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Create user failed.");
      }

      const finalStatus = "Created";

      const { error: updateError } = await supabase
        .from("admin_user_requests")
        .update({
          status: finalStatus,
        })
        .eq("id", request.id);

      if (updateError) {
        throw updateError;
      }

      setUserRequests((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: finalStatus,
              }
            : item
        )
      );

      await loadProfiles();

      if (result.emailSent) {
        alert(
          `User created and onboarding email sent.\n\nEmail: ${
            request.requested_email
          }\nRole: ${String(request.requested_role || "employee").toUpperCase()}`
        );
      } else {
        alert(
          `User created and profile populated, but onboarding email was not sent.\n\nEmail: ${
            request.requested_email
          }\nRole: ${String(request.requested_role || "employee").toUpperCase()}\n\nEmail Error: ${
            result.emailError || "Unknown email error"
          }`
        );
      }
    } catch (error) {
      alert(`Create user failed: ${error.message}`);
    } finally {
      setCreatingUserId("");
    }
  };

  const forcePasswordReset = async (item) => {
    if (!isAdmin) {
      alert("Only Admin users can reset passwords.");
      return;
    }

    if (!item?.id) {
      alert("User ID is missing.");
      return;
    }

    if (!item?.email && !item?.user_email) {
      alert("User email is missing from profile.");
      return;
    }

    const email = item.email || item.user_email;
    const temporaryPassword = window.prompt(
      `Enter a temporary password for ${email}. The user will be required to change it on next login.`
    );

    if (!temporaryPassword) return;

    if (temporaryPassword.length < 8) {
      alert("Temporary password must be at least 8 characters.");
      return;
    }

    const confirmed = window.confirm(
      `Reset password for ${email} and send notification email?`
    );

    if (!confirmed) return;

    setResettingUserId(item.id);

    try {
      const response = await fetch(RESET_PASSWORD_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          userId: item.id,
          email,
          temporaryPassword,
          role: item.role || "",
          requestedByEmail: session?.user?.email || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Password reset failed.");
      }

      await loadProfiles();

      if (result.emailSent) {
        alert(`Password reset successfully and notification email sent to ${email}.`);
      } else {
        alert(
          `Password reset successfully, but notification email was not sent.\n\nEmail Error: ${
            result.emailError || "Unknown email error"
          }`
        );
      }
    } catch (error) {
      alert(`Password reset failed: ${error.message}`);
    } finally {
      setResettingUserId("");
    }
  };

  const deleteUserRequest = async (requestId) => {
    if (!isAdmin) {
      alert("Only Admin users can delete user requests.");
      return;
    }

    const confirmed = window.confirm("Delete this user request?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("admin_user_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }

    setUserRequests((prev) =>
      prev.filter((request) => request.id !== requestId)
    );

    alert("User request deleted.");
  };

  const renderActiveBadge = (isActive) => {
    const active = isActive !== false;

    return (
      <span className={active ? "status-badge complete" : "status-badge shipped"}>
        {active ? "ACTIVE" : "DISABLED"}
      </span>
    );
  };

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? "" : section));
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const getProfileReference = (item) => {
    return (
      item.display_name ||
      item.full_name ||
      item.name ||
      item.user_name ||
      item.email ||
      item.user_email ||
      "Unassigned Profile"
    );
  };

  const getProfileDepartment = (item) => {
    return item.department || "Department not assigned";
  };

  const getProfileUuidReference = (item) => {
    return item.id ? `ID: ${item.id}` : "No UUID";
  };

  if (!isAdmin) {
    return (
      <div className="dashboard-workspace dashboard-control-tower phase14-dashboard phase18-dashboard admin-workspace">
        <div className="dashboard-header dashboard-control-header phase14-hero phase18-hero">
          <div>
            <span className="dashboard-eyebrow">PHASE 21A • ADMIN CONTROL</span>
            <h1>Administrative Control Command Center</h1>
          </div>
        </div>

        <div className="dashboard-panel">
          <h2>Access Restricted</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-workspace dashboard-control-tower phase14-dashboard phase18-dashboard admin-workspace">
      <div className="dashboard-header dashboard-control-header phase14-hero phase18-hero">
        <div>
          <span className="dashboard-eyebrow">PHASE 21A • ADMIN CONTROL</span>
          <h1>Administrative Control Command Center</h1>
        </div>

        <div className="dashboard-header-actions phase14-header-actions">
          <div className="dashboard-health-card phase14-health-card healthy">
            <span>Admin Status</span>
            <strong>Secure Mode</strong>
            <small>Admin-only user governance is active.</small>
          </div>

          <button
            className="dashboard-refresh-button"
            onClick={() => {
              loadProfiles();
              loadUserRequests();
            }}
            disabled={loadingProfiles || loadingRequests}
          >
            {loadingProfiles || loadingRequests ? "Refreshing..." : "Refresh Admin Data"}
          </button>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      <div className="phase14-kpi-grid">
        <div className="phase14-kpi-card phase14-kpi-normal">
          <span>Pending Requests</span>
          <strong>{adminMetrics.pendingRequests}</strong>
          <p>Approval / creation queue</p>
        </div>

        <div className="phase14-kpi-card phase14-kpi-healthy">
          <span>Active Users</span>
          <strong>{adminMetrics.activeUsers}</strong>
          <p>Enabled profile records</p>
        </div>

        <div className="phase14-kpi-card phase14-kpi-warning">
          <span>Password Queue</span>
          <strong>{adminMetrics.resetRequired}</strong>
          <p>Users requiring password change</p>
        </div>

        <div className="phase14-kpi-card phase14-kpi-critical">
          <span>Disabled Accounts</span>
          <strong>{adminMetrics.disabledUsers}</strong>
          <p>Inactive profile records</p>
        </div>
      </div>

      <div className="phase17-smart-card-shell">
        <div className="phase17-smart-card" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: "12px", alignItems: "start" }}>
          <div className="phase17-smart-main" style={{ minWidth: 0 }}>
            <div className="phase17-smart-header">
              <div>
                <span className="dashboard-eyebrow">Smart Admin Control Card</span>
                <h2>Admin Control Workbench</h2>
                <p>
                  Manage user onboarding, role governance, account status, and password recovery through controlled expandable sections.
                </p>
              </div>
            </div>

            <div className="phase17-accordion-list" style={{ display: "grid", gap: "8px" }}>
              <div className="phase17-accordion-section" style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: "12px", padding: "6px", background: "rgba(8, 24, 39, 0.42)" }}>
                <button
                  type="button"
                  onClick={() => toggleSection("requests")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(148, 163, 184, 0.26)",
                    background: "rgba(2, 12, 24, 0.52)",
                    color: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "grid", gap: "3px" }}>
                    <strong style={{ fontSize: "14px" }}>User Request Intake</strong>
                    <span style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>
                      Create onboarding requests and assign temporary access credentials
                    </span>
                  </div>
                  <b
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(37, 99, 235, 0.28)",
                      border: "1px solid rgba(96, 165, 250, 0.55)",
                      color: "#93c5fd",
                      flex: "0 0 auto",
                    }}
                  >
                    {openSection === "requests" ? "−" : "+"}
                  </b>
                </button>

                {openSection === "requests" && (
                  <div className="phase17-accordion-body" style={{ padding: "12px 4px 4px" }}>
                    <div className="inventory-form-grid">
                      <input
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => updateNewUserForm("email", e.target.value)}
                        placeholder="employee@company.com"
                      />

                      <select
                        value={newUserForm.role}
                        onChange={(e) => updateNewUserForm("role", e.target.value)}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role.toUpperCase()}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={newUserForm.temporaryPassword}
                        onChange={(e) =>
                          updateNewUserForm("temporaryPassword", e.target.value)
                        }
                        placeholder="Temporary password"
                      />

                      <select
                        value={newUserForm.status}
                        onChange={(e) => updateNewUserForm("status", e.target.value)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.toUpperCase()}
                          </option>
                        ))}
                      </select>

                      <input
                        value={newUserForm.notes}
                        onChange={(e) => updateNewUserForm("notes", e.target.value)}
                        placeholder="Example: Oscar - staging employee"
                      />
                    </div>

                    <button
                      className="dashboard-refresh-button"
                      onClick={saveUserRequest}
                      style={{ marginTop: "8px" }}
                    >
                      Save User Request
                    </button>
                  </div>
                )}
              </div>

              <div className="phase17-accordion-section" style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: "12px", padding: "6px", background: "rgba(8, 24, 39, 0.42)" }}>
                <button
                  type="button"
                  onClick={() => toggleSection("approvals")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(148, 163, 184, 0.26)",
                    background: "rgba(2, 12, 24, 0.52)",
                    color: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "grid", gap: "3px" }}>
                    <strong style={{ fontSize: "14px" }}>Pending Approval Queue</strong>
                    <span style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>
                      Review saved requests and create real Supabase login accounts
                    </span>
                  </div>
                  <b
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(37, 99, 235, 0.28)",
                      border: "1px solid rgba(96, 165, 250, 0.55)",
                      color: "#93c5fd",
                      flex: "0 0 auto",
                    }}
                  >
                    {openSection === "approvals" ? "−" : "+"}
                  </b>
                </button>

                {openSection === "approvals" && (
                  <div className="phase17-accordion-body" style={{ padding: "12px 4px 4px" }}>
                    {userRequests.length === 0 ? (
                      <p className="panel-note">No user requests found.</p>
                    ) : (
                      <div className="inventory-table-scroll" style={{ overflowX: "auto", maxWidth: "100%" }}>
                        <table className="dashboard-table" style={{ minWidth: "1680px" }}>
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Email Maintenance</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Requested By</th>
                              <th>Notes</th>
                              <th>Created</th>
                              <th>Update</th>
                              <th>Create Login</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userRequests.map((request) => (
                              <tr key={request.id}>
                                <td>{request.requested_email}</td>
                                <td>{String(request.requested_role || "").toUpperCase()}</td>
                                <td>{request.status || "Pending"}</td>
                                <td>{request.requested_by_email || "-"}</td>
                                <td>{request.notes || "-"}</td>
                                <td>{formatDate(request.created_at)}</td>
                                <td>
                                  <select
                                    style={{
                                      minHeight: "28px",
                                      borderRadius: "7px",
                                      border: "1px solid rgba(147, 197, 253, 0.35)",
                                      background: "rgba(15, 23, 42, 0.88)",
                                      color: "#ffffff",
                                      fontWeight: 800,
                                    }}
                                    value={request.status || "Pending"}
                                    onChange={(e) =>
                                      updateUserRequestStatus(request.id, e.target.value)
                                    }
                                  >
                                    {statusOptions.map((status) => (
                                      <option key={status} value={status}>
                                        {status.toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <button
                                    style={{
                                      minHeight: "28px",
                                      borderRadius: "7px",
                                      border: "1px solid rgba(96, 165, 250, 0.45)",
                                      background: "rgba(37, 99, 235, 0.88)",
                                      color: "#ffffff",
                                      fontWeight: 900,
                                      padding: "5px 8px",
                                    }}
                                    onClick={() => createRealUserFromRequest(request)}
                                    disabled={
                                      creatingUserId === request.id ||
                                      request.status === "Created"
                                    }
                                  >
                                    {creatingUserId === request.id
                                      ? "Creating..."
                                      : request.status === "Created"
                                      ? "Created"
                                      : "Create + Email"}
                                  </button>
                                </td>
                                <td>
                                  <button
                                    style={{
                                      minHeight: "28px",
                                      borderRadius: "7px",
                                      border: "1px solid rgba(248, 113, 113, 0.45)",
                                      background: "rgba(153, 27, 27, 0.88)",
                                      color: "#ffffff",
                                      fontWeight: 900,
                                      padding: "5px 8px",
                                    }}
                                    onClick={() => deleteUserRequest(request.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="phase17-accordion-section" style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: "12px", padding: "6px", background: "rgba(8, 24, 39, 0.42)" }}>
                <button
                  type="button"
                  onClick={() => toggleSection("governance")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(148, 163, 184, 0.26)",
                    background: "rgba(2, 12, 24, 0.52)",
                    color: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "grid", gap: "3px" }}>
                    <strong style={{ fontSize: "14px" }}>User Governance</strong>
                    <span style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>
                      Role controls, account status, password reset tools, and lifecycle management
                    </span>
                  </div>
                  <b
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(37, 99, 235, 0.28)",
                      border: "1px solid rgba(96, 165, 250, 0.55)",
                      color: "#93c5fd",
                      flex: "0 0 auto",
                    }}
                  >
                    {openSection === "governance" ? "−" : "+"}
                  </b>
                </button>

                {openSection === "governance" && (
                  <div className="phase17-accordion-body" style={{ padding: "12px 4px 4px" }}>
                    {profiles.length === 0 ? (
                      <p className="panel-note">No profiles loaded.</p>
                    ) : (
                      <div className="inventory-table-scroll" style={{ overflowX: "auto", maxWidth: "100%" }}>
                        <table className="dashboard-table" style={{ minWidth: "1680px" }}>
                          <thead>
                            <tr>
                              <th>User / Profile</th>
                              <th>Email</th>
                              <th>Identity Maintenance</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Password</th>
                              <th>Update Role</th>
                              <th>Lifecycle</th>
                              <th>Password Reset</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profiles.map((item) => {
                              const isActive = item.is_active !== false;

                              return (
                                <tr key={item.id}>
                                  <td>
                                    <div style={{ display: "grid", gap: "3px", minWidth: "210px" }}>
                                      <strong>{getProfileReference(item)}</strong>
                                      <span style={{ color: "#cbd5e1", fontWeight: 800 }}>
                                        {getProfileDepartment(item)}
                                      </span>
                                      <small style={{ color: "#94a3b8", fontWeight: 800 }}>
                                        {getProfileUuidReference(item)}
                                      </small>
                                    </div>
                                  </td>
                                  <td>{item.email || item.user_email || "Email not stored"}</td>
                                  <td>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "180px 160px 220px auto",
                                        gap: "8px",
                                        alignItems: "center",
                                        minWidth: "760px",
                                        position: "relative",
                                        zIndex: 2,
                                      }}
                                    >
                                      <input
                                        value={getIdentityDraftValue(
                                          item,
                                          "display_name",
                                          item.display_name || item.full_name || item.name || item.user_name || ""
                                        )}
                                        onChange={(e) =>
                                          updateProfileIdentityDraft(item.id, "display_name", e.target.value)
                                        }
                                        placeholder="Display Name"
                                        style={{
                                          minHeight: "30px",
                                          borderRadius: "7px",
                                          border: "1px solid rgba(147, 197, 253, 0.35)",
                                          background: "rgba(15, 23, 42, 0.88)",
                                          color: "#ffffff",
                                          fontWeight: 800,
                                          padding: "5px 8px",
                                        }}
                                      />

                                      <input
                                        value={getIdentityDraftValue(item, "department", item.department || "")}
                                        onChange={(e) =>
                                          updateProfileIdentityDraft(item.id, "department", e.target.value)
                                        }
                                        placeholder="Department"
                                        style={{
                                          minHeight: "30px",
                                          borderRadius: "7px",
                                          border: "1px solid rgba(147, 197, 253, 0.35)",
                                          background: "rgba(15, 23, 42, 0.88)",
                                          color: "#ffffff",
                                          fontWeight: 800,
                                          padding: "5px 8px",
                                        }}
                                      />

                                      <input
                                        type="email"
                                        value={getIdentityDraftValue(
                                          item,
                                          "email",
                                          item.email || item.user_email || ""
                                        )}
                                        onChange={(e) =>
                                          updateProfileIdentityDraft(item.id, "email", e.target.value)
                                        }
                                        placeholder="Attach / update email"
                                        style={{
                                          minHeight: "30px",
                                          borderRadius: "7px",
                                          border: "1px solid rgba(147, 197, 253, 0.35)",
                                          background: "rgba(15, 23, 42, 0.88)",
                                          color: "#ffffff",
                                          fontWeight: 800,
                                          padding: "5px 8px",
                                        }}
                                      />

                                      <button
                                        type="button"
                                        style={{
                                          minHeight: "30px",
                                          borderRadius: "7px",
                                          border: "1px solid rgba(96, 165, 250, 0.45)",
                                          background: "rgba(37, 99, 235, 0.88)",
                                          color: "#ffffff",
                                          fontWeight: 900,
                                          padding: "5px 10px",
                                          whiteSpace: "nowrap",
                                          cursor: "pointer",
                                          position: "relative",
                                          zIndex: 3,
                                        }}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          updateProfileIdentity(item);
                                        }}
                                      >
                                        Save Identity
                                      </button>
                                    </div>
                                  </td>
                                  <td>{String(item.role || "").toUpperCase()}</td>
                                  <td>{renderActiveBadge(item.is_active)}</td>
                                  <td>
                                    {item.must_change_password ? (
                                      <span className="status-badge open">REQUIRED</span>
                                    ) : (
                                      <span className="status-badge complete">COMPLETE</span>
                                    )}
                                  </td>
                                  <td>
                                    <select
                                      style={{
                                        minHeight: "28px",
                                        borderRadius: "7px",
                                        border: "1px solid rgba(147, 197, 253, 0.35)",
                                        background: "rgba(15, 23, 42, 0.88)",
                                        color: "#ffffff",
                                        fontWeight: 800,
                                      }}
                                      value={item.role || "employee"}
                                      onChange={(e) =>
                                        updateProfileRole(item.id, e.target.value)
                                      }
                                    >
                                      {roleOptions.map((role) => (
                                        <option key={role} value={role}>
                                          {role.toUpperCase()}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    {isActive ? (
                                      <button
                                        style={{
                                          minHeight: "28px",
                                          borderRadius: "7px",
                                          border: "1px solid rgba(248, 113, 113, 0.45)",
                                          background: "rgba(153, 27, 27, 0.88)",
                                          color: "#ffffff",
                                          fontWeight: 900,
                                          padding: "5px 8px",
                                        }}
                                        onClick={() =>
                                          updateProfileActiveStatus(item.id, false)
                                        }
                                      >
                                        Disable
                                      </button>
                                    ) : (
                                      <button
                                        style={{
                                          minHeight: "28px",
                                          borderRadius: "7px",
                                          border: "1px solid rgba(74, 222, 128, 0.45)",
                                          background: "rgba(22, 101, 52, 0.88)",
                                          color: "#ffffff",
                                          fontWeight: 900,
                                          padding: "5px 8px",
                                        }}
                                        onClick={() =>
                                          updateProfileActiveStatus(item.id, true)
                                        }
                                      >
                                        Reactivate
                                      </button>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      style={{
                                        minHeight: "28px",
                                        borderRadius: "7px",
                                        border: "1px solid rgba(251, 191, 36, 0.55)",
                                        background: "rgba(180, 83, 9, 0.92)",
                                        color: "#ffffff",
                                        fontWeight: 900,
                                        padding: "5px 8px",
                                      }}
                                      onClick={() => forcePasswordReset(item)}
                                      disabled={resettingUserId === item.id}
                                    >
                                      {resettingUserId === item.id
                                        ? "Resetting..."
                                        : "Force Reset"}
                                    </button>
                                  </td>
                                  <td>{formatDate(item.created_at)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="phase17-accordion-section" style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: "12px", padding: "6px", background: "rgba(8, 24, 39, 0.42)" }}>
                <button
                  type="button"
                  onClick={() => toggleSection("security")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(148, 163, 184, 0.26)",
                    background: "rgba(2, 12, 24, 0.52)",
                    color: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "grid", gap: "3px" }}>
                    <strong style={{ fontSize: "14px" }}>Security / Audit Readiness</strong>
                    <span style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>
                      Admin controls, protected actions, and future audit expansion
                    </span>
                  </div>
                  <b
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(37, 99, 235, 0.28)",
                      border: "1px solid rgba(96, 165, 250, 0.55)",
                      color: "#93c5fd",
                      flex: "0 0 auto",
                    }}
                  >
                    {openSection === "security" ? "−" : "+"}
                  </b>
                </button>

                {openSection === "security" && (
                  <div className="phase17-accordion-body" style={{ padding: "12px 4px 4px" }}>
                    <div className="phase14-snapshot-grid">
                      <div>
                        <span>Protected Role</span>
                        <strong>Admin Only</strong>
                        <p>All actions are gated by the admin role.</p>
                      </div>
                      <div>
                        <span>Create User</span>
                        <strong>Edge Function</strong>
                        <p>Uses secure Supabase function, not frontend service role.</p>
                      </div>
                      <div>
                        <span>Email Maintenance</span>
                        <strong>Controlled</strong>
                        <p>Admins can attach or update profile emails after confirmation.</p>
                      </div>
                      <div>
                        <span>Audit Logs</span>
                        <strong>Future Phase</strong>
                        <p>Admin actions should be logged in a later production hardening phase.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="phase17-smart-summary" style={{ position: "sticky", top: "74px" }}>
            <div className="job-summary-header">
              <span>Admin Snapshot</span>
              <strong>Governance</strong>
            </div>

            <div className="job-summary-grid">
              <div>
                <span>Requests</span>
                <strong>{adminMetrics.totalRequests}</strong>
              </div>
              <div>
                <span>Profiles</span>
                <strong>{adminMetrics.totalProfiles}</strong>
              </div>
              <div>
                <span>Active</span>
                <strong>{adminMetrics.activeUsers}</strong>
              </div>
              <div>
                <span>Password Queue</span>
                <strong>{adminMetrics.resetRequired}</strong>
              </div>
            </div>

            <p className="job-summary-note">
              Admin actions are protected. Create-user and password reset operations still use your existing secure Edge Functions.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AdminWorkspace;
