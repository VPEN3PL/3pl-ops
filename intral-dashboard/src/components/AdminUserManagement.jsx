import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function AdminUserManagement({ session, profile }) {
  const [profiles, setProfiles] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    email: "",
    role: "employee",
    notes: "",
  });

  const isAdmin = String(profile?.role || "").toLowerCase().trim() === "admin";

  const roleOptions = ["admin", "manager", "employee", "customer"];

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

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
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

  const createUserRequest = async () => {
    if (!isAdmin) {
      alert("Only Admin users can request new accounts.");
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

    /*
      SECURITY NOTE:
      Do not create Supabase Auth users directly from React using the service role key.
      The secure production method is:
      1. Admin submits this request.
      2. Supabase Edge Function creates the Auth user with service role key.
      3. Edge Function inserts/updates the profiles table.
      4. React never sees the service role key.

      For now, this creates an admin request record if the table exists.
      If you have not created admin_user_requests yet, this will show a table error.
    */

    const { error } = await supabase.from("admin_user_requests").insert([
      {
        requested_email: newUserForm.email.trim(),
        requested_role: newUserForm.role,
        notes: newUserForm.notes.trim(),
        requested_by: session?.user?.id || null,
        requested_by_email: session?.user?.email || "",
        status: "Pending",
      },
    ]);

    if (error) {
      alert(
        `User request could not be saved yet: ${error.message}\n\nThis is expected if the admin_user_requests table has not been created.`
      );
      return;
    }

    setNewUserForm({
      email: "",
      role: "employee",
      notes: "",
    });

    alert("User account request saved.");
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
          admin role visibility.
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
          <strong>Phase 1B Security Rule</strong>
          <p style={{ marginBottom: 0 }}>
            React can safely view profiles and update roles only when Supabase
            RLS allows it. Creating new Supabase Auth users must be done later
            through a secure Supabase Edge Function, not directly inside React.
          </p>
        </div>

        <button onClick={loadProfiles} disabled={loadingProfiles}>
          {loadingProfiles ? "Refreshing..." : "Refresh User List"}
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
        <h3>Request New User Account</h3>
        <p>
          This creates a secure admin request. The actual Supabase Auth user
          creation will be connected in the next step with an Edge Function.
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
        </div>

        <label>Notes</label>
        <input
          value={newUserForm.notes}
          onChange={(e) => updateNewUserForm("notes", e.target.value)}
          placeholder="Example: Oscar - staging employee"
        />

        <button onClick={createUserRequest}>Save User Request</button>
      </div>

      <div className="card">
        <h3>Current User Profiles</h3>

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
