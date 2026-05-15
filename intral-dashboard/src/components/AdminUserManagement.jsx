import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function AdminUserManagement({ session, profile }) {
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

  const updateNewUserForm = (field, value) => {
    setNewUserForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      <span
        style={{
          display: "inline-block",
          background: active ? "#166534" : "#991b1b",
          color: "white",
          padding: "6px 10px",
          borderRadius: "999px",
          fontWeight: "800",
          fontSize: "12px",
        }}
      >
        {active ? "ACTIVE" : "DISABLED"}
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div className="card">
        <h2>Admin User Management</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Admin User Management</h2>
        <p>
          Admin-only user control center for employee, manager, customer, and
          admin onboarding.
        </p>

        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #86efac",
            padding: "14px",
            borderRadius: "12px",
            marginTop: "14px",
            marginBottom: "14px",
          }}
        >
          <strong>Phase 1B.7 — Admin Reset Password</strong>
          <p style={{ marginBottom: 0 }}>
            Admins can create users, send onboarding emails, disable/reactivate
            accounts, change roles, and now force a password reset with a new
            temporary password.
          </p>
        </div>

        <button onClick={loadProfiles} disabled={loadingProfiles}>
          {loadingProfiles ? "Refreshing Profiles..." : "Refresh User Profiles"}
        </button>

        <button onClick={loadUserRequests} disabled={loadingRequests}>
          {loadingRequests ? "Refreshing Requests..." : "Refresh User Requests"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "12px",
              fontWeight: "700",
              color: message.includes("failed") ? "#991b1b" : "#475569",
            }}
          >
            {message}
          </p>
        )}
      </div>

      <div className="card">
        <h3>Create User Request</h3>
        <p>
          Create the onboarding request first. Then use the Create Real User
          button in the request table to create the actual login account and send
          the onboarding notification.
        </p>

        <div className="grid">
          <div>
            <label>Email</label>
            <input
              type="email"
              value={newUserForm.email}
              onChange={(e) => updateNewUserForm("email", e.target.value)}
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label>Role</label>
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
          </div>

          <div>
            <label>Temporary Password</label>
            <input
              type="text"
              value={newUserForm.temporaryPassword}
              onChange={(e) =>
                updateNewUserForm("temporaryPassword", e.target.value)
              }
              placeholder="Temporary password"
            />
          </div>

          <div>
            <label>Request Status</label>
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
          </div>
        </div>

        <label>Notes</label>
        <input
          value={newUserForm.notes}
          onChange={(e) => updateNewUserForm("notes", e.target.value)}
          placeholder="Example: Oscar - staging employee"
        />

        <button onClick={saveUserRequest}>Save User Request</button>
      </div>

      <div className="card">
        <h3>User Requests</h3>
        <p>
          Use Create Real User only after reviewing the email, role, and
          temporary password.
        </p>

        {userRequests.length === 0 ? (
          <p>No user requests found.</p>
        ) : (
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Requested Email</th>
                  <th>Role</th>
                  <th>Temporary Password</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Notes</th>
                  <th>Created</th>
                  <th>Update Status</th>
                  <th>Create Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.requested_email}</td>
                    <td>
                      <strong>
                        {String(request.requested_role || "").toUpperCase()}
                      </strong>
                    </td>
                    <td>{request.temporary_password || "-"}</td>
                    <td>
                      <strong>{request.status || "Pending"}</strong>
                    </td>
                    <td>{request.requested_by_email || "-"}</td>
                    <td>{request.notes || "-"}</td>
                    <td>{request.created_at || "-"}</td>
                    <td>
                      <select
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
                          : "Create Real User + Email"}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => deleteUserRequest(request.id)}>
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

      <div className="card">
        <h3>Current User Profiles</h3>
        <p>
          Existing Supabase profile records. Role updates affect dashboard
          permissions. Disable/reactivate controls employee access lifecycle.
        </p>

        {profiles.length === 0 ? (
          <p>No profiles loaded.</p>
        ) : (
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Password Change</th>
                  <th>Update Role</th>
                  <th>Disable / Reactivate</th>
                  <th>Force Password Reset</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((item) => {
                  const isActive = item.is_active !== false;

                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.email || item.user_email || "Email not stored"}</td>
                      <td>
                        <strong>{String(item.role || "").toUpperCase()}</strong>
                      </td>
                      <td>{renderActiveBadge(item.is_active)}</td>
                      <td>
                        {item.must_change_password ? (
                          <span
                            style={{
                              color: "#991b1b",
                              fontWeight: "800",
                            }}
                          >
                            REQUIRED
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "#166534",
                              fontWeight: "800",
                            }}
                          >
                            COMPLETE
                          </span>
                        )}
                      </td>
                      <td>
                        <select
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
                            onClick={() =>
                              updateProfileActiveStatus(item.id, false)
                            }
                            style={{
                              background: "#991b1b",
                              color: "white",
                              fontWeight: "800",
                            }}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              updateProfileActiveStatus(item.id, true)
                            }
                            style={{
                              background: "#166534",
                              color: "white",
                              fontWeight: "800",
                            }}
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => forcePasswordReset(item)}
                          disabled={resettingUserId === item.id}
                          style={{
                            background: "#f59e0b",
                            color: "#111827",
                            fontWeight: "800",
                          }}
                        >
                          {resettingUserId === item.id
                            ? "Resetting..."
                            : "Force Reset"}
                        </button>
                      </td>
                      <td>{item.created_at || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUserManagement;
