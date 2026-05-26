import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function DashboardWorkspace() {
  const [jobs, setJobs] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

    return {
      openJobs: openJobs.length,
      receivingToday: receivingToday.length,
      openAllocations: openAllocations.length,
      pendingShipments: pendingShipments.length,
      over24Hours: over24Hours.length,
      inventoryLines: inventoryItems.length,
      activeInventory: activeInventory.length,
      amCratingQueue: amCratingQueue.length,
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

  const kpis = [
    {
      title: "Open Jobs",
      value: dashboardMetrics.openJobs,
      note: "Active non-shipped work",
    },
    {
      title: "Receiving Today",
      value: dashboardMetrics.receivingToday,
      note: "Inventory received today",
    },
    {
      title: "Open Allocations",
      value: dashboardMetrics.openAllocations,
      note: "Reserved inventory active",
    },
    {
      title: "Pending Shipments",
      value: dashboardMetrics.pendingShipments,
      note: "Outbound / transport work",
    },
    {
      title: "Over 24 Hours",
      value: dashboardMetrics.over24Hours,
      note: "Aging active requests",
    },
    {
      title: "A&M Crating",
      value: dashboardMetrics.amCratingQueue,
      note: "Crating related queue",
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
    <div className="dashboard-workspace dashboard-control-tower">
      <div className="dashboard-header dashboard-control-header">
        <div>
          <span className="dashboard-eyebrow">INTRAL CONNECT COMMAND CENTER</span>

          <h1>Operational Dashboard</h1>

          <p>
            Executive visibility across receiving, inventory, allocations,
            outbound work, A&M crating activity, and aging operational requests.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-health-card">
            <span>System Health</span>
            <strong>{executiveHealthStatus}</strong>
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

      <div className="kpi-grid dashboard-control-kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="kpi-card dashboard-control-kpi-card">
            <span>{kpi.title}</span>
            <h2>{kpi.value}</h2>
            <p>{kpi.note}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-command-grid">
        <div className="dashboard-panel dashboard-command-panel">
          <h2>Executive Action Queue</h2>

          <div className="dashboard-command-row">
            <div>
              <span>Aging Alert</span>
              <strong>{dashboardMetrics.over24Hours}</strong>
              <p>Open work over 24 hours</p>
            </div>

            <div>
              <span>Active Inventory</span>
              <strong>{dashboardMetrics.activeInventory}</strong>
              <p>Available inventory lines</p>
            </div>

            <div>
              <span>Outbound Load</span>
              <strong>{dashboardMetrics.pendingShipments}</strong>
              <p>Shipping / transport work</p>
            </div>

            <div>
              <span>Allocation Gate</span>
              <strong>{dashboardMetrics.openAllocations}</strong>
              <p>Active allocation records</p>
            </div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-command-panel">
          <h2>Manager Daily Summary</h2>

          <div className="health-row">
            <span>Inventory Lines</span>
            <strong>{dashboardMetrics.inventoryLines}</strong>
          </div>

          <div className="health-row">
            <span>Received Today</span>
            <strong>{dashboardMetrics.receivingToday}</strong>
          </div>

          <div className="health-row">
            <span>A&M Crating Queue</span>
            <strong>{dashboardMetrics.amCratingQueue}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-control-grid">
        <div className="dashboard-panel large-panel dashboard-queue-panel">
          <h2>Open Work Queue</h2>

          {recentOpenJobs.length === 0 ? (
            <p>No active open jobs found.</p>
          ) : (
            <table className="dashboard-table">
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
                  <tr key={job.id}>
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
                <div key={job.id} className="mini-list-row">
                  <strong>{job.job_number || "No Job #"}</strong>
                  <span>{job.request_category || job.job_type || "-"}</span>
                </div>
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
                <div key={job.id} className="mini-list-row">
                  <strong>{job.job_number || "No Job #"}</strong>
                  <span>{job.request_category || job.job_type || "A&M"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardWorkspace;
