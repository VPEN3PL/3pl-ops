import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function LoginAuditLogs({ profile }) {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const userRole = String(profile?.role || "").toLowerCase().trim();
  const canViewAudit = userRole === "admin" || userRole === "manager";

  const loadLoginAuditLogs = async () => {
    if (!canViewAudit) {
      setMessage("Only Admin and Manager users can view login audit logs.");
      return;
    }

    setLoading(true);
    setMessage("Loading login audit logs...");

    const { data, error } = await supabase
      .from("login_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setMessage(`Login audit load failed: ${error.message}`);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setFilteredLogs(data || []);
    setMessage("");
    setLoading(false);
  };

  useEffect(() => {
    if (canViewAudit) {
      loadLoginAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAudit]);

  useEffect(() => {
    let results = [...logs];

    if (actionFilter !== "All") {
      results = results.filter(
        (log) => String(log.action || "") === actionFilter
      );
    }

    if (search.trim()) {
      const cleanSearch = search.toLowerCase();

      results = results.filter((log) => {
        return (
          String(log.user_email || "").toLowerCase().includes(cleanSearch) ||
          String(log.user_role || "").toLowerCase().includes(cleanSearch) ||
          String(log.action || "").toLowerCase().includes(cleanSearch) ||
          String(log.notes || "").toLowerCase().includes(cleanSearch)
        );
      });
    }

    setFilteredLogs(results);
  }, [logs, search, actionFilter]);

  const formatDateTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUniqueActions = () => {
    const actionSet = new Set();

    logs.forEach((log) => {
      if (log.action) {
        actionSet.add(log.action);
      }
    });

    return ["All", ...Array.from(actionSet).sort()];
  };

  const getActionBadgeStyle = (action, success) => {
    const cleanAction = String(action || "").toLowerCase();

    if (success === false || cleanAction.includes("failed")) {
      return {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
      };
    }

    if (cleanAction.includes("blocked")) {
      return {
        background: "#ffedd5",
        color: "#9a3412",
        border: "1px solid #fed7aa",
      };
    }

    if (cleanAction.includes("password")) {
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    }

    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  };

  const exportLoginAuditCSV = () => {
    const headers = [
      "Date / Time",
      "User Email",
      "User Role",
      "Action",
      "Success",
      "Notes",
      "User ID",
    ];

    const rows = filteredLogs.map((log) => [
      formatDateTime(log.created_at),
      log.user_email || "",
      log.user_role || "",
      log.action || "",
      log.success ? "Yes" : "No",
      log.notes || "",
      log.user_id || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "intral_connect_login_audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLogs = logs.length;
  const successfulLogins = logs.filter(
    (log) => String(log.action || "") === "Login Successful"
  ).length;
  const failedLogins = logs.filter(
    (log) =>
      String(log.action || "").toLowerCase().includes("failed") ||
      log.success === false
  ).length;
  const passwordEvents = logs.filter((log) =>
    String(log.action || "").toLowerCase().includes("password")
  ).length;
  const blockedEvents = logs.filter((log) =>
    String(log.action || "").toLowerCase().includes("blocked")
  ).length;

  if (!canViewAudit) {
    return (
      <div className="card">
        <h2>Login Audit Logs</h2>
        <p>You do not have permission to view login audit history.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Login Audit Dashboard</h2>
        <p>
          Security visibility for successful logins, failed login attempts,
          password reset requests, password changes, and blocked account access.
        </p>

        <button onClick={loadLoginAuditLogs} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Login Audit Logs"}
        </button>

        <button onClick={exportLoginAuditCSV} disabled={filteredLogs.length === 0}>
          Export Login Audit CSV
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

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <h3>Total Events</h3>
          <p>{totalLogs}</p>
        </div>

        <div className="kpi-card green">
          <h3>Successful Logins</h3>
          <p>{successfulLogins}</p>
        </div>

        <div className="kpi-card red">
          <h3>Failed / Denied</h3>
          <p>{failedLogins}</p>
        </div>

        <div className="kpi-card orange">
          <h3>Password Events</h3>
          <p>{passwordEvents}</p>
        </div>

        <div className="kpi-card purple">
          <h3>Blocked Attempts</h3>
          <p>{blockedEvents}</p>
        </div>
      </div>

      <div className="card">
        <h3>Filter Login Audit Logs</h3>

        <div className="grid">
          <div>
            <label>Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, role, action, or notes"
            />
          </div>

          <div>
            <label>Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {getUniqueActions().map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Login Audit History</h3>

        {filteredLogs.length === 0 ? (
          <p>No login audit records found.</p>
        ) : (
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>User Email</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Success</th>
                  <th>Notes</th>
                  <th>User ID</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => {
                  const badgeStyle = getActionBadgeStyle(
                    log.action,
                    log.success
                  );

                  return (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td>{log.user_email || "-"}</td>
                      <td>
                        <strong>
                          {String(log.user_role || "-").toUpperCase()}
                        </strong>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            fontWeight: "800",
                            fontSize: "12px",
                            ...badgeStyle,
                          }}
                        >
                          {log.action || "-"}
                        </span>
                      </td>
                      <td>
                        {log.success ? (
                          <strong style={{ color: "#166534" }}>YES</strong>
                        ) : (
                          <strong style={{ color: "#991b1b" }}>NO</strong>
                        )}
                      </td>
                      <td>{log.notes || "-"}</td>
                      <td>{log.user_id || "-"}</td>
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

export default LoginAuditLogs;
