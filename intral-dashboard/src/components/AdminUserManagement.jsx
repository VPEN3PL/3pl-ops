import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function AdminUserManagement({ session, profile }) {
  const [profiles, setProfiles] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    email: "",
    role: "employee",
    temporaryPassword: "",
    notes: "",
    status: "Pending",
  });

  const isAdmin = String(profile?.role || "").toLowerCase().trim() === "admin";

  const roleOptions = ["admin", "manager", "employee", "customer"];
  const statusOptions = ["Pending", "Approved", "Created", "Rejected", "Disabled"];

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
      alert("Temporary password is required for Phase 1B.1 request tracking.");
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
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "14px",
            borderRadius: "12px",
            marginTop: "14px",
            marginBottom: "14px",
          }}
        >
          <strong>Phase 1B.1 Status</strong>
          <p style={{ marginBottom: 0 }}>
            This screen now saves email, role, temporary password, notes, and
            request status into Supabase. The next step will connect a secure
            Supabase Edge Function to create the actual Auth user.
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
          This stores the onboarding request. Actual Supabase Auth creation will
          be handled by the secure Edge Function in the next step.
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
          Tracks requested users before the secure account creation step is
          activated.
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
          Existing Supabase profile records. Role updates here affect dashboard
          permissions.
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
                  <th>Update Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.email || item.user_email || "Email not stored"}</td>
                    <td>
                      <strong>{String(item.role || "").toUpperCase()}</strong>
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
                    <td>{item.created_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUserManagement;
