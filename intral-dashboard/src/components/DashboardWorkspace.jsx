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

    return {
      openJobs: openJobs.length,
      receivingToday: receivingToday.length,
      openAllocations: openAllocations.length,
      pendingShipments: pendingShipments.length,
      over24Hours: over24Hours.length,
    };
  }, [jobs, inventoryItems, allocations, isPendingShipmentJob]);

  const recentOpenJobs = useMemo(() => {
    return jobs.filter(isOpenJob).slice(0, 8);
  }, [jobs]);

  const recentPendingShipments = useMemo(() => {
    return jobs.filter(isPendingShipmentJob).slice(0, 8);
  }, [jobs, isPendingShipmentJob]);

  const kpis = [
    {
      title: "Open Jobs",
      value: dashboardMetrics.openJobs,
      note: "All active non-shipped work",
    },
    {
      title: "Receiving Today",
      value: dashboardMetrics.receivingToday,
      note: "Inventory received today",
    },
    {
      title: "Open Allocations",
      value: dashboardMetrics.openAllocations,
      note: "Reserved inventory still active",
    },
    {
      title: "Pending Shipments",
      value: dashboardMetrics.pendingShipments,
      note: "Outbound / transport work only",
    },
    {
      title: "Over 24 Hours",
      value: dashboardMetrics.over24Hours,
      note: "Aging active requests",
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

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1>Operational Dashboard</h1>

          <p>
            Executive operational visibility across receiving, inventory,
            allocations, pending outbound work, and aging requests.
          </p>
        </div>

        <button
          className="dashboard-refresh-button"
          onClick={loadDashboardData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="kpi-card">
            <span>{kpi.title}</span>
            <h2>{kpi.value}</h2>
            <p>{kpi.note}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel large-panel">
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

        <div className="dashboard-panel">
          <h2>Pending Shipments</h2>

          <p className="panel-note">
            Counts only outbound, transport, delivery, carrier, crating, or
            facility move requests.
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

        <div className="dashboard-panel">
          <h2>Inventory & Allocation Health</h2>

          <div className="health-row">
            <span>Inventory Lines</span>
            <strong>{inventoryItems.length}</strong>
          </div>

          <div className="health-row">
            <span>Active Allocations</span>
            <strong>{dashboardMetrics.openAllocations}</strong>
          </div>

          <div className="health-row">
            <span>Received Today</span>
            <strong>{dashboardMetrics.receivingToday}</strong>
          </div>

          <div className="health-row">
            <span>Aging Work</span>
            <strong>{dashboardMetrics.over24Hours}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardWorkspace;
