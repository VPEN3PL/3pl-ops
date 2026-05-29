import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function AuditLogsWorkspace() {
  const [jobs, setJobs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [openSection, setOpenSection] = useState("timeline");
  const [filterType, setFilterType] = useState("all");

  const loadAuditData = async () => {
    setLoading(true);
    setMessage("Loading audit activity...");

    const [jobsResult, profilesResult, userRequestsResult, inventoryResult, allocationsResult] =
      await Promise.all([
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_user_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("inventory_items").select("*").order("created_at", { ascending: false }),
        supabase.from("inventory_allocations").select("*").order("created_at", { ascending: false }),
      ]);

    if (jobsResult.error) {
      setMessage(`Jobs audit load failed: ${jobsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (profilesResult.error) {
      setMessage(`Profiles audit load failed: ${profilesResult.error.message}`);
      setLoading(false);
      return;
    }

    if (userRequestsResult.error) {
      setMessage(`User request audit load failed: ${userRequestsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (inventoryResult.error) {
      setMessage(`Inventory audit load failed: ${inventoryResult.error.message}`);
      setLoading(false);
      return;
    }

    if (allocationsResult.error) {
      setMessage(`Allocation audit load failed: ${allocationsResult.error.message}`);
      setLoading(false);
      return;
    }

    setJobs(jobsResult.data || []);
    setProfiles(profilesResult.data || []);
    setUserRequests(userRequestsResult.data || []);
    setInventoryItems(inventoryResult.data || []);
    setAllocations(allocationsResult.data || []);
    setMessage("");
    setLoading(false);
  };

  useEffect(() => {
    loadAuditData();
  }, []);

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

  const isOpenJob = (job) => {
    const status = String(job.status || "").toLowerCase();
    return (
      status !== "shipped" &&
      status !== "closed" &&
      status !== "complete" &&
      status !== "order complete"
    );
  };

  const buildAuditEvents = useMemo(() => {
    const governanceEvents = [
      ...profiles.map((profile) => ({
        id: `profile-${profile.id}`,
        type: "governance",
        severity: profile.is_active === false ? "warning" : "normal",
        title: profile.is_active === false ? "Account Disabled" : "Profile Active",
        subject: profile.email || profile.user_email || profile.id || "Profile",
        detail: `Role: ${String(profile.role || "unknown").toUpperCase()} • Password change: ${
          profile.must_change_password ? "Required" : "Complete"
        }`,
        date: profile.updated_at || profile.created_at,
        module: "Admin",
      })),
      ...userRequests.map((request) => ({
        id: `request-${request.id}`,
        type: "governance",
        severity: String(request.status || "").toLowerCase() === "created" ? "normal" : "warning",
        title: "User Request Activity",
        subject: request.requested_email || "User Request",
        detail: `Requested role: ${String(request.requested_role || "employee").toUpperCase()} • Status: ${request.status || "Pending"}`,
        date: request.updated_at || request.created_at,
        module: "Admin",
      })),
    ];

    const operationalEvents = [
      ...jobs.map((job) => {
        const status = String(job.status || "Open");
        const agingHours = job.created_at
          ? Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / 36e5)
          : 0;

        return {
          id: `job-${job.id}`,
          type: "operations",
          severity: isOpenJob(job) && agingHours >= 24 ? "high" : "normal",
          title: `Job ${status}`,
          subject: job.job_number || job.customer_request_number || "Job Record",
          detail: `${job.request_source || "Source"} • ${job.request_category || job.job_type || "Work"}${
            agingHours >= 24 ? ` • ${agingHours} hrs open` : ""
          }`,
          date: job.updated_at || job.created_at,
          module: "Jobs",
        };
      }),
      ...inventoryItems.map((item) => ({
        id: `inventory-${item.id}`,
        type: "operations",
        severity: "normal",
        title: "Inventory Activity",
        subject: item.inventory_id || item.part_number || item.item_number || "Inventory Line",
        detail: `${item.customer || "Customer"} • ${item.location || item.subinventory || "Location"} • ${
          item.status || "Active"
        }`,
        date: item.updated_at || item.created_at,
        module: "Inventory / Receiving",
      })),
      ...allocations.map((allocation) => ({
        id: `allocation-${allocation.id}`,
        type: "operations",
        severity: String(allocation.status || "").toLowerCase() === "open" ? "warning" : "normal",
        title: "Allocation Activity",
        subject: allocation.inventory_id || allocation.job_number || "Allocation Record",
        detail: `Status: ${allocation.status || "Open"} • Qty: ${allocation.allocated_qty || allocation.quantity || "-"}`,
        date: allocation.updated_at || allocation.created_at,
        module: "Allocation",
      })),
    ];

    return [...governanceEvents, ...operationalEvents]
      .filter((event) => event.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [profiles, userRequests, jobs, inventoryItems, allocations]);

  const filteredEvents = useMemo(() => {
    if (filterType === "all") return buildAuditEvents;
    return buildAuditEvents.filter((event) => event.type === filterType);
  }, [buildAuditEvents, filterType]);

  const auditMetrics = useMemo(() => {
    const governanceCount = buildAuditEvents.filter((event) => event.type === "governance").length;
    const operationalCount = buildAuditEvents.filter((event) => event.type === "operations").length;
    const highSeverityCount = buildAuditEvents.filter((event) => event.severity === "high").length;
    const warningCount = buildAuditEvents.filter((event) => event.severity === "warning").length;

    return {
      totalEvents: buildAuditEvents.length,
      governanceCount,
      operationalCount,
      highSeverityCount,
      warningCount,
    };
  }, [buildAuditEvents]);

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? "" : section));
  };

  const renderAccordionButton = (section, title, subtitle) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
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
        <strong style={{ fontSize: "14px" }}>{title}</strong>
        <span style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>{subtitle}</span>
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
        {openSection === section ? "−" : "+"}
      </b>
    </button>
  );

  const renderEventTable = (events) => (
    <div className="inventory-table-scroll">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Module</th>
            <th>Event</th>
            <th>Subject</th>
            <th>Details</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {events.slice(0, 30).map((event) => (
            <tr key={event.id}>
              <td>{formatDateTime(event.date)}</td>
              <td>{event.module}</td>
              <td>{event.title}</td>
              <td>{event.subject}</td>
              <td>{event.detail}</td>
              <td>
                <span
                  className={
                    event.severity === "high"
                      ? "status-badge open"
                      : event.severity === "warning"
                      ? "status-badge released"
                      : "status-badge complete"
                  }
                >
                  {event.severity.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSection = (section, title, subtitle, content) => (
    <div
      className="phase17-accordion-section"
      style={{
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: "12px",
        padding: "6px",
        background: "rgba(8, 24, 39, 0.42)",
      }}
    >
      {renderAccordionButton(section, title, subtitle)}
      {openSection === section && (
        <div className="phase17-accordion-body" style={{ padding: "12px 4px 4px" }}>
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-workspace dashboard-control-tower phase14-dashboard phase18-dashboard audit-workspace">
      <div className="dashboard-header dashboard-control-header phase14-hero phase18-hero">
        <div>
          <span className="dashboard-eyebrow">PHASE 21C • AUDIT GOVERNANCE</span>
          <h1>Audit & Compliance Command Center</h1>
        </div>

        <div className="dashboard-header-actions phase14-header-actions">
          <div
            className={
              auditMetrics.highSeverityCount > 0
                ? "dashboard-health-card phase14-health-card critical"
                : "dashboard-health-card phase14-health-card healthy"
            }
          >
            <span>Audit Health</span>
            <strong>{auditMetrics.highSeverityCount > 0 ? "Attention" : "Controlled"}</strong>
            <small>{auditMetrics.totalEvents} visible event(s)</small>
          </div>

          <button className="dashboard-refresh-button" onClick={loadAuditData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Audit"}
          </button>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      <div className="phase14-kpi-grid">
        <div className="phase14-kpi-card phase14-kpi-normal">
          <span>Total Events</span>
          <strong>{auditMetrics.totalEvents}</strong>
          <p>Visible system activity</p>
        </div>

        <div className="phase14-kpi-card phase14-kpi-healthy">
          <span>Governance</span>
          <strong>{auditMetrics.governanceCount}</strong>
          <p>User / admin controls</p>
        </div>

        <div className="phase14-kpi-card phase14-kpi-normal">
          <span>Operations</span>
          <strong>{auditMetrics.operationalCount}</strong>
          <p>Jobs / inventory / allocation</p>
        </div>

        <div className="phase14-kpi-card phase14-kpi-warning">
          <span>Warnings</span>
          <strong>{auditMetrics.warningCount + auditMetrics.highSeverityCount}</strong>
          <p>Review / exception signals</p>
        </div>
      </div>

      <div className="phase17-smart-card-shell">
        <div
          className="phase17-smart-card"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 280px",
            gap: "12px",
            alignItems: "start",
          }}
        >
          <div className="phase17-smart-main" style={{ minWidth: 0 }}>
            <div className="phase17-smart-header">
              <div>
                <span className="dashboard-eyebrow">Smart Audit Control Card</span>
                <h2>System Activity Timeline</h2>
                <p>
                  Review governance and operational activity in one controlled audit workbench before the production testing rollout.
                </p>
              </div>
            </div>

            <div className="phase17-accordion-list" style={{ display: "grid", gap: "8px" }}>
              {renderSection(
                "timeline",
                "Activity Timeline",
                "Chronological activity from governance and operational sources",
                <>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <button className="dashboard-refresh-button" onClick={() => setFilterType("all")}>
                      All Events
                    </button>
                    <button className="dashboard-refresh-button" onClick={() => setFilterType("governance")}>
                      Governance
                    </button>
                    <button className="dashboard-refresh-button" onClick={() => setFilterType("operations")}>
                      Operations
                    </button>
                  </div>

                  {filteredEvents.length === 0 ? (
                    <p className="panel-note">No audit activity found.</p>
                  ) : (
                    renderEventTable(filteredEvents)
                  )}
                </>
              )}

              {renderSection(
                "governance",
                "Governance Events",
                "Admin user requests, profile status, role and password control indicators",
                renderEventTable(buildAuditEvents.filter((event) => event.type === "governance"))
              )}

              {renderSection(
                "operations",
                "Operational Events",
                "Jobs, inventory, receiving and allocation activity snapshots",
                renderEventTable(buildAuditEvents.filter((event) => event.type === "operations"))
              )}

              {renderSection(
                "testing",
                "Testing Rollout Readiness",
                "QA hardening checklist and audit validation focus",
                <div className="phase14-snapshot-grid">
                  <div>
                    <span>Dropdown Layering</span>
                    <strong>Patched</strong>
                    <p>Oracle menu stacking issue was corrected.</p>
                  </div>
                  <div>
                    <span>Dashboard Drilldown</span>
                    <strong>Confirmed</strong>
                    <p>Executive KPI routing tested successfully.</p>
                  </div>
                  <div>
                    <span>Admin Controls</span>
                    <strong>Active</strong>
                    <p>User governance workbench is operational.</p>
                  </div>
                  <div>
                    <span>Audit Expansion</span>
                    <strong>Framework Ready</strong>
                    <p>Future phase can write direct audit rows.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="phase17-smart-summary" style={{ position: "sticky", top: "74px" }}>
            <div className="job-summary-header">
              <span>Audit Snapshot</span>
              <strong>Compliance</strong>
            </div>

            <div className="job-summary-grid">
              <div>
                <span>Total</span>
                <strong>{auditMetrics.totalEvents}</strong>
              </div>
              <div>
                <span>Governance</span>
                <strong>{auditMetrics.governanceCount}</strong>
              </div>
              <div>
                <span>Operations</span>
                <strong>{auditMetrics.operationalCount}</strong>
              </div>
              <div>
                <span>Warnings</span>
                <strong>{auditMetrics.warningCount}</strong>
              </div>
            </div>

            <p className="job-summary-note">
              This phase reads existing operational and admin records. Future hardening can add direct audit-event writes for every action.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsWorkspace;
