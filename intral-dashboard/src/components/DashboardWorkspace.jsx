import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function DashboardWorkspace({ setTab }) {
  const [jobs, setJobs] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const goToDrilldown = (targetTab) => {
    if (typeof setTab === "function" && targetTab) {
      setTab(targetTab);
    }
  };

  const isToday = (value) => {
    if (!value) return false;

    const date = new Date(value);
    const today = new Date();

    return date.toDateString() === today.toDateString();
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

  const isPendingShipmentJob = useCallback((job) => {
    if (!isOpenJob(job)) return false;

    const combinedText = [
      job.request_category,
      job.job_type,
      job.request_source,
      job.notes,
      job.location,
    ]
      .join(" ")
      .toLowerCase();

    const outboundKeywords = [
      "ship",
      "shipping",
      "shipment",
      "deliver",
      "delivery",
      "transport",
      "carrier",
      "pickup",
      "pick up",
      "move to",
      "transfer out",
      "outbound",
      "crating",
      "crate",
      "a&m",
      "am",
    ];

    return outboundKeywords.some((keyword) => combinedText.includes(keyword));
  }, []);

  const isAMCratingJob = useCallback((job) => {
    if (!isOpenJob(job)) return false;

    const combinedText = [
      job.request_category,
      job.job_type,
      job.request_source,
      job.notes,
      job.location,
      job.ship_to,
      job.destination,
    ]
      .join(" ")
      .toLowerCase();

    return (
      combinedText.includes("a&m") ||
      combinedText.includes("am ") ||
      combinedText.includes("crating") ||
      combinedText.includes("crate")
    );
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setMessage("Loading dashboard data...");

    const [jobsResult, inventoryResult, allocationsResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_allocations")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (jobsResult.error) {
      setMessage(`Jobs load failed: ${jobsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (inventoryResult.error) {
      setMessage(`Inventory load failed: ${inventoryResult.error.message}`);
      setLoading(false);
      return;
    }

    if (allocationsResult.error) {
      setMessage(`Allocations load failed: ${allocationsResult.error.message}`);
      setLoading(false);
      return;
    }

    setJobs(jobsResult.data || []);
    setInventoryItems(inventoryResult.data || []);
    setAllocations(allocationsResult.data || []);
    setMessage("");
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const dashboardMetrics = useMemo(() => {
    const openJobs = jobs.filter(isOpenJob);
    const pendingShipments = jobs.filter(isPendingShipmentJob);
    const amCratingQueue = jobs.filter(isAMCratingJob);

    const receivingToday = inventoryItems.filter((item) =>
      isToday(item.created_at)
    );

    const openAllocations = allocations.filter((allocation) => {
      const status = String(allocation.status || "").toLowerCase();

      return status === "allocated" || status === "open" || status === "active";
    });

    const over24Hours = openJobs.filter((job) => {
      if (!job.created_at) return false;

      const created = new Date(job.created_at);
      const now = new Date();
      const hoursOpen = (now - created) / (1000 * 60 * 60);

      return hoursOpen > 24;
    });

    const activeInventory = inventoryItems.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "available" || status === "active" || !status;
    });

    const completedJobs = jobs.filter((job) => {
      const status = String(job.status || "").toLowerCase();
      return (
        status === "shipped" ||
        status === "closed" ||
        status === "complete" ||
        status === "order complete"
      );
    });

    const completedToday = completedJobs.filter((job) =>
      isToday(job.updated_at || job.completed_at || job.created_at)
    );

    const chargeableJobs = jobs.filter((job) => {
      const value = String(
        job.chargeable || job.is_chargeable || job.billing_type || ""
      ).toLowerCase();

      return value === "yes" || value === "true" || value === "chargeable";
    });

    const uniqueCustomers = new Set(
      jobs
        .map((job) => job.customer || job.request_source || job.customer_name)
        .filter(Boolean)
    );

    const throughputRate =
      jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;

    const queuePressure =
      openJobs.length === 0
        ? "Low"
        : over24Hours.length > 0 || openJobs.length >= 10
        ? "High"
        : openJobs.length >= 5
        ? "Moderate"
        : "Controlled";

    return {
      openJobs: openJobs.length,
      receivingToday: receivingToday.length,
      openAllocations: openAllocations.length,
      pendingShipments: pendingShipments.length,
      over24Hours: over24Hours.length,
      inventoryLines: inventoryItems.length,
      activeInventory: activeInventory.length,
      amCratingQueue: amCratingQueue.length,
      completedToday: completedToday.length,
      chargeableJobs: chargeableJobs.length,
      uniqueCustomers: uniqueCustomers.size,
      throughputRate,
      queuePressure,
      completedJobs: completedJobs.length,
    };
  }, [jobs, inventoryItems, allocations, isPendingShipmentJob, isAMCratingJob]);

  const recentOpenJobs = useMemo(() => {
    return jobs.filter(isOpenJob).slice(0, 8);
  }, [jobs]);

  const recentPendingShipments = useMemo(() => {
    return jobs.filter(isPendingShipmentJob).slice(0, 8);
  }, [jobs, isPendingShipmentJob]);

  const recentAMCratingJobs = useMemo(() => {
    return jobs.filter(isAMCratingJob).slice(0, 6);
  }, [jobs, isAMCratingJob]);

  const maxChartValue = Math.max(
    dashboardMetrics.openJobs,
    dashboardMetrics.pendingShipments,
    dashboardMetrics.over24Hours,
    dashboardMetrics.openAllocations,
    dashboardMetrics.receivingToday,
    dashboardMetrics.completedToday,
    1
  );

  const workDistribution = [
    {
      label: "Open Work",
      value: dashboardMetrics.openJobs,
      tone: "blue",
    },
    {
      label: "Shipping Load",
      value: dashboardMetrics.pendingShipments,
      tone: "teal",
    },
    {
      label: "Aging >24h",
      value: dashboardMetrics.over24Hours,
      tone: "red",
    },
    {
      label: "Allocations",
      value: dashboardMetrics.openAllocations,
      tone: "gold",
    },
    {
      label: "Receiving Today",
      value: dashboardMetrics.receivingToday,
      tone: "green",
    },
    {
      label: "Completed Today",
      value: dashboardMetrics.completedToday,
      tone: "purple",
    },
  ];

  const inventoryMix = [
    {
      label: "Active Inventory",
      value: dashboardMetrics.activeInventory,
      tone: "green",
    },
    {
      label: "Inventory Lines",
      value: dashboardMetrics.inventoryLines,
      tone: "blue",
    },
    {
      label: "Allocation Gate",
      value: dashboardMetrics.openAllocations,
      tone: "gold",
    },
  ];

  const riskChart = [
    {
      label: "Aging Risk",
      value: dashboardMetrics.over24Hours,
      max: Math.max(dashboardMetrics.openJobs, 1),
      tone: dashboardMetrics.over24Hours > 0 ? "red" : "green",
    },
    {
      label: "Shipping Load",
      value: dashboardMetrics.pendingShipments,
      max: maxChartValue,
      tone: dashboardMetrics.pendingShipments > 0 ? "teal" : "green",
    },
    {
      label: "Allocation Load",
      value: dashboardMetrics.openAllocations,
      max: maxChartValue,
      tone: dashboardMetrics.openAllocations > 0 ? "gold" : "green",
    },
  ];

  const throughputGaugeStyle = {
    "--gauge-value": `${Math.max(0, Math.min(100, dashboardMetrics.throughputRate))}%`,
  };

  const executiveKpis = [
    {
      title: "Open Work",
      value: dashboardMetrics.openJobs,
      note: "Active operational requests",
      tone: dashboardMetrics.openJobs > 0 ? "normal" : "healthy",
      targetTab: "jobs",
    },
    {
      title: "Critical Aging",
      value: dashboardMetrics.over24Hours,
      note: "Open work over 24 hours",
      tone: dashboardMetrics.over24Hours > 0 ? "critical" : "healthy",
      targetTab: "orders-open",
    },
    {
      title: "Shipping Load",
      value: dashboardMetrics.pendingShipments,
      note: "Outbound execution queue",
      tone: dashboardMetrics.pendingShipments > 0 ? "warning" : "healthy",
      targetTab: "shipping",
    },
    {
      title: "Inventory Ready",
      value: dashboardMetrics.activeInventory,
      note: "Available inventory lines",
      tone: "healthy",
      targetTab: "inventory",
    },
    {
      title: "Allocation Gate",
      value: dashboardMetrics.openAllocations,
      note: "Active allocation records",
      tone: dashboardMetrics.openAllocations > 0 ? "warning" : "healthy",
      targetTab: "allocation",
    },
    {
      title: "Receiving Today",
      value: dashboardMetrics.receivingToday,
      note: "Inbound activity captured",
      tone: "normal",
      targetTab: "receiving",
    },
  ];

  const leadershipSnapshots = [
    {
      label: "Customer Activity",
      value: dashboardMetrics.uniqueCustomers,
      note: "Customers / sources represented",
    },
    {
      label: "Chargeable Work",
      value: dashboardMetrics.chargeableJobs,
      note: "Captured billable operations",
    },
    {
      label: "Completed Today",
      value: dashboardMetrics.completedToday,
      note: "Closed / completed records",
    },
    {
      label: "Throughput Rate",
      value: `${dashboardMetrics.throughputRate}%`,
      note: "Closed work vs total records",
    },
  ];

  const healthMatrix = [
    {
      label: "Operational Health",
      value:
        dashboardMetrics.over24Hours > 0 ? "Attention Required" : "Healthy",
      status: dashboardMetrics.over24Hours > 0 ? "critical" : "healthy",
    },
    {
      label: "Queue Pressure",
      value: dashboardMetrics.queuePressure,
      status:
        dashboardMetrics.queuePressure === "High"
          ? "critical"
          : dashboardMetrics.queuePressure === "Moderate"
          ? "warning"
          : "healthy",
    },
    {
      label: "Shipping Execution",
      value:
        dashboardMetrics.pendingShipments > 0
          ? "Action Queue Active"
          : "Controlled",
      status: dashboardMetrics.pendingShipments > 0 ? "warning" : "healthy",
    },
    {
      label: "Allocation Readiness",
      value:
        dashboardMetrics.openAllocations > 0
          ? "Review Required"
          : "Clear",
      status: dashboardMetrics.openAllocations > 0 ? "warning" : "healthy",
    },
  ];

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

  const getStatusBadgeClass = (status) => {
    const cleanStatus = String(status || "").toLowerCase();

    if (cleanStatus.includes("ship")) return "status-badge shipped";
    if (cleanStatus.includes("complete")) return "status-badge complete";
    if (cleanStatus.includes("release")) return "status-badge released";
    if (cleanStatus.includes("pick")) return "status-badge picking";

    return "status-badge open";
  };

  const executiveHealthStatus =
    dashboardMetrics.over24Hours > 0 ? "Attention Required" : "Healthy";

  return (
    <div className="dashboard-workspace dashboard-control-tower phase14-dashboard phase18-dashboard">
      <div className="dashboard-header dashboard-control-header phase14-hero phase18-hero">
        <div>
          <span className="dashboard-eyebrow">PHASE 18C • EXECUTIVE INTELLIGENCE</span>
          <h1>Operational KPI Command Center</h1>
        </div>

        <div className="dashboard-header-actions phase14-header-actions">
          <div
            className={
              dashboardMetrics.over24Hours > 0
                ? "dashboard-health-card phase14-health-card critical"
                : "dashboard-health-card phase14-health-card healthy"
            }
          >
            <span>Enterprise Health</span>
            <strong>{executiveHealthStatus}</strong>
            <small>
              {dashboardMetrics.over24Hours > 0
                ? `${dashboardMetrics.over24Hours} aging item(s) need review`
                : "No critical aging alerts"}
            </small>
          </div>

          <button
            className="dashboard-refresh-button"
            onClick={loadDashboardData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      <div className="phase14-kpi-grid">
        {executiveKpis.map((kpi) => (
          <button
            type="button"
            key={kpi.title}
            className={`phase14-kpi-card phase14-kpi-${kpi.tone}`}
            onClick={() => goToDrilldown(kpi.targetTab)}
            title={`Open ${kpi.title} drilldown`}
          >
            <span>{kpi.title}</span>
            <strong>{kpi.value}</strong>
            <p>{kpi.note}</p>
          </button>
        ))}
      </div>

      <div className="phase18-chart-grid">
        <div className="dashboard-panel phase18-chart-panel phase18-wide-chart">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Visual Workload</span>
              <h2>Operational Work Distribution</h2>
            </div>
            <strong>{maxChartValue} Max</strong>
          </div>

          <div className="phase18-bar-chart">
            {workDistribution.map((item) => (
              <div key={item.label} className="phase18-bar-row">
                <div className="phase18-bar-label">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>

                <div className="phase18-bar-track">
                  <div
                    className={`phase18-bar-fill ${item.tone}`}
                    style={{
                      width: `${Math.max(4, Math.round((item.value / maxChartValue) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Throughput</span>
              <h2>Completion Gauge</h2>
            </div>
          </div>

          <div className="phase18-gauge-wrap">
            <div className="phase18-gauge" style={throughputGaugeStyle}>
              <div>
                <strong>{dashboardMetrics.throughputRate}%</strong>
                <span>Complete</span>
              </div>
            </div>

            <p>
              {dashboardMetrics.completedJobs} completed record(s) out of{" "}
              {jobs.length || 0} total dashboard job record(s).
            </p>
          </div>
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Risk Load</span>
              <h2>Risk Pressure Bars</h2>
            </div>
          </div>

          <div className="phase18-risk-stack">
            {riskChart.map((item) => (
              <div key={item.label} className="phase18-risk-item">
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>

                <div className="phase18-risk-meter">
                  <i
                    className={item.tone}
                    style={{
                      width: `${Math.max(5, Math.round((item.value / item.max) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Inventory Mix</span>
              <h2>Inventory / Allocation View</h2>
            </div>
          </div>

          <div className="phase18-column-chart">
            {inventoryMix.map((item) => (
              <div key={item.label} className="phase18-column-item">
                <div className="phase18-column-frame">
                  <span
                    className={`phase18-column-fill ${item.tone}`}
                    style={{
                      height: `${Math.max(
                        8,
                        Math.round((item.value / Math.max(dashboardMetrics.inventoryLines, 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="phase14-leadership-grid">
        <div className="dashboard-panel phase14-health-matrix">
          <div className="phase14-panel-header">
            <div>
              <span className="dashboard-eyebrow">Executive Risk Matrix</span>
              <h2>Operational Health Matrix</h2>
            </div>
          </div>

          <div className="phase14-health-list">
            {healthMatrix.map((item) => (
              <div key={item.label} className={`phase14-health-row ${item.status}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel phase14-leadership-snapshot">
          <div className="phase14-panel-header">
            <div>
              <span className="dashboard-eyebrow">Leadership Snapshot</span>
              <h2>Daily Executive Summary</h2>
            </div>
          </div>

          <div className="phase14-snapshot-grid">
            {leadershipSnapshots.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-command-grid phase14-command-grid">
        <div className="dashboard-panel dashboard-command-panel">
          <h2>Executive Action Queue</h2>

          <div className="dashboard-command-row phase14-action-row">
            <button type="button" onClick={() => goToDrilldown("orders-open")}>
              <span>Aging Alert</span>
              <strong>{dashboardMetrics.over24Hours}</strong>
              <p>Open work over 24 hours</p>
            </button>

            <button type="button" onClick={() => goToDrilldown("inventory")}>
              <span>Active Inventory</span>
              <strong>{dashboardMetrics.activeInventory}</strong>
              <p>Available inventory lines</p>
            </button>

            <button type="button" onClick={() => goToDrilldown("shipping")}>
              <span>Outbound Load</span>
              <strong>{dashboardMetrics.pendingShipments}</strong>
              <p>Shipping / transport work</p>
            </button>

            <button type="button" onClick={() => goToDrilldown("allocation")}>
              <span>Allocation Gate</span>
              <strong>{dashboardMetrics.openAllocations}</strong>
              <p>Active allocation records</p>
            </button>
          </div>
        </div>

        <div className="dashboard-panel dashboard-command-panel phase14-crating-panel">
          <h2>A&M / Crating Control</h2>

          <button
            type="button"
            className="health-row"
            onClick={() => goToDrilldown("jobs-track")}
          >
            <span>A&M Crating Queue</span>
            <strong>{dashboardMetrics.amCratingQueue}</strong>
          </button>

          <button
            type="button"
            className="health-row"
            onClick={() => goToDrilldown("receiving")}
          >
            <span>Receiving Today</span>
            <strong>{dashboardMetrics.receivingToday}</strong>
          </button>

          <button
            type="button"
            className="health-row"
            onClick={() => goToDrilldown("inventory")}
          >
            <span>Inventory Lines</span>
            <strong>{dashboardMetrics.inventoryLines}</strong>
          </button>
        </div>
      </div>

      <div className="dashboard-grid dashboard-control-grid phase14-queue-grid">
        <div className="dashboard-panel large-panel dashboard-queue-panel">
          <h2>Open Work Queue</h2>

          {recentOpenJobs.length === 0 ? (
            <p>No active open jobs found.</p>
          ) : (
            <table className="dashboard-table dashboard-drilldown-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {recentOpenJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => goToDrilldown("jobs-track")}
                    title="Open job tracking"
                  >
                    <td>{job.job_number || "-"}</td>
                    <td>{job.request_source || "-"}</td>
                    <td>{job.request_category || "-"}</td>
                    <td>
                      <span className={getStatusBadgeClass(job.status)}>
                        {job.status || "Open"}
                      </span>
                    </td>
                    <td>{formatDateTime(job.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-panel dashboard-queue-panel">
          <h2>Pending Shipments</h2>

          <p className="panel-note">
            Outbound, transport, delivery, carrier, crating, or facility move
            requests.
          </p>

          {recentPendingShipments.length === 0 ? (
            <p>No pending shipment / transport work found.</p>
          ) : (
            <div className="mini-list">
              {recentPendingShipments.map((job) => (
                <button
                  type="button"
                  key={job.id}
                  className="mini-list-row"
                  onClick={() => goToDrilldown("shipping")}
                >
                  <strong>{job.job_number || "No Job #"}</strong>
                  <span>{job.request_category || job.job_type || "-"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel dashboard-queue-panel">
          <h2>A&M Crating Queue</h2>

          {recentAMCratingJobs.length === 0 ? (
            <p>No A&M crating related work currently found.</p>
          ) : (
            <div className="mini-list">
              {recentAMCratingJobs.map((job) => (
                <button
                  type="button"
                  key={job.id}
                  className="mini-list-row"
                  onClick={() => goToDrilldown("jobs-track")}
                >
                  <strong>{job.job_number || "No Job #"}</strong>
                  <span>{job.request_category || job.job_type || "A&M"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardWorkspace;
