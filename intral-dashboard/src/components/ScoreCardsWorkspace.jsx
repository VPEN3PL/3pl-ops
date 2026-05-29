import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function ScoreCardsWorkspace() {
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

  const isClosedJob = useCallback((job) => !isOpenJob(job), []);

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

  const loadScoreCardData = async () => {
    setLoading(true);
    setMessage("Loading live score card data...");

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
      setMessage(`Jobs score card load failed: ${jobsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (inventoryResult.error) {
      setMessage(`Inventory score card load failed: ${inventoryResult.error.message}`);
      setLoading(false);
      return;
    }

    if (allocationsResult.error) {
      setMessage(`Allocation score card load failed: ${allocationsResult.error.message}`);
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
    loadScoreCardData();
  }, []);

  const getDateKey = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
  };

  const getLastSevenDays = () => {
    const days = [];
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);

      days.push({
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
      });
    }

    return days;
  };

  const scoreCardMetrics = useMemo(() => {
    const openJobs = jobs.filter(isOpenJob);
    const closedJobs = jobs.filter(isClosedJob);
    const pendingShipments = jobs.filter(isPendingShipmentJob);
    const amCratingQueue = jobs.filter(isAMCratingJob);

    const over24Hours = openJobs.filter((job) => {
      if (!job.created_at) return false;

      const created = new Date(job.created_at);
      const now = new Date();
      const hoursOpen = (now - created) / (1000 * 60 * 60);

      return hoursOpen > 24;
    });

    const completedToday = closedJobs.filter((job) =>
      isToday(job.updated_at || job.completed_at || job.created_at)
    );

    const receivingToday = inventoryItems.filter((item) =>
      isToday(item.created_at)
    );

    const activeInventory = inventoryItems.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "available" || status === "active" || !status;
    });

    const openAllocations = allocations.filter((allocation) => {
      const status = String(allocation.status || "").toLowerCase();

      return status === "allocated" || status === "open" || status === "active";
    });

    const completedAllocations = allocations.filter((allocation) => {
      const status = String(allocation.status || "").toLowerCase();

      return (
        status === "released" ||
        status === "complete" ||
        status === "completed" ||
        status === "closed"
      );
    });

    const chargeableJobs = jobs.filter((job) => {
      const value = String(
        job.chargeable || job.is_chargeable || job.billing_type || ""
      ).toLowerCase();

      return value === "yes" || value === "true" || value === "chargeable";
    });

    const nonChargeableJobs = jobs.filter((job) => {
      const value = String(
        job.chargeable || job.is_chargeable || job.billing_type || ""
      ).toLowerCase();

      return value === "no" || value === "false" || value === "non-chargeable";
    });

    const uniqueCustomers = new Set(
      jobs
        .map((job) => job.customer || job.request_source || job.customer_name)
        .filter(Boolean)
    );

    const closureRate =
      jobs.length > 0 ? Math.round((closedJobs.length / jobs.length) * 100) : 0;

    const agingScore =
      openJobs.length === 0
        ? 100
        : Math.max(0, Math.round(100 - (over24Hours.length / openJobs.length) * 100));

    const allocationScore =
      allocations.length === 0
        ? 100
        : Math.round((completedAllocations.length / allocations.length) * 100);

    const inventoryReadinessScore =
      inventoryItems.length === 0
        ? 100
        : Math.round((activeInventory.length / inventoryItems.length) * 100);

    const shippingExecutionScore =
      openJobs.length === 0
        ? 100
        : Math.max(
            0,
            Math.round(100 - (pendingShipments.length / openJobs.length) * 45)
          );

    const operationalHealthScore = Math.round(
      (closureRate +
        agingScore +
        allocationScore +
        inventoryReadinessScore +
        shippingExecutionScore) /
        5
    );

    const externalDependencyScore =
      openJobs.length === 0
        ? 100
        : Math.max(0, Math.round(100 - (amCratingQueue.length / openJobs.length) * 50));

    return {
      totalJobs: jobs.length,
      openJobs: openJobs.length,
      closedJobs: closedJobs.length,
      completedToday: completedToday.length,
      over24Hours: over24Hours.length,
      pendingShipments: pendingShipments.length,
      amCratingQueue: amCratingQueue.length,
      receivingToday: receivingToday.length,
      inventoryLines: inventoryItems.length,
      activeInventory: activeInventory.length,
      openAllocations: openAllocations.length,
      completedAllocations: completedAllocations.length,
      chargeableJobs: chargeableJobs.length,
      nonChargeableJobs: nonChargeableJobs.length,
      uniqueCustomers: uniqueCustomers.size,
      closureRate,
      agingScore,
      allocationScore,
      inventoryReadinessScore,
      shippingExecutionScore,
      operationalHealthScore,
      externalDependencyScore,
    };
  }, [
    jobs,
    inventoryItems,
    allocations,
    isClosedJob,
    isAMCratingJob,
    isPendingShipmentJob,
  ]);

  const trendData = useMemo(() => {
    const days = getLastSevenDays();

    return days.map((day) => {
      const jobsCreated = jobs.filter((job) => getDateKey(job.created_at) === day.key);
      const closedJobs = jobs.filter((job) => {
        const status = String(job.status || "").toLowerCase();
        const dateKey = getDateKey(job.updated_at || job.completed_at || job.created_at);

        return (
          dateKey === day.key &&
          (status === "shipped" ||
            status === "closed" ||
            status === "complete" ||
            status === "order complete")
        );
      });

      const agingJobs = jobsCreated.filter((job) => {
        if (!job.created_at) return false;

        const created = new Date(job.created_at);
        const now = new Date();
        const hoursOpen = (now - created) / (1000 * 60 * 60);

        return isOpenJob(job) && hoursOpen > 24;
      });

      const shippingJobs = jobsCreated.filter(isPendingShipmentJob);
      const receivingLines = inventoryItems.filter((item) => getDateKey(item.created_at) === day.key);
      const allocationLines = allocations.filter((allocation) => getDateKey(allocation.created_at) === day.key);

      return {
        ...day,
        open: jobsCreated.length,
        closed: closedJobs.length,
        aging: agingJobs.length,
        shipping: shippingJobs.length,
        receiving: receivingLines.length,
        allocation: allocationLines.length,
      };
    });
  }, [jobs, inventoryItems, allocations, isPendingShipmentJob]);

  const maxTrendValue = useMemo(() => {
    return Math.max(
      ...trendData.flatMap((item) => [
        item.open,
        item.closed,
        item.aging,
        item.shipping,
        item.receiving,
        item.allocation,
      ]),
      1
    );
  }, [trendData]);

  const getStatusLabel = (score) => {
    if (score >= 90) return "Strong";
    if (score >= 75) return "Stable";
    if (score >= 60) return "Monitor";
    return "Review";
  };

  const getToneClass = (score) => {
    if (score >= 90) return "phase14-kpi-healthy";
    if (score >= 75) return "phase14-kpi-normal";
    if (score >= 60) return "phase14-kpi-warning";
    return "phase14-kpi-critical";
  };

  const executiveScoreCards = useMemo(
    () => [
      {
        title: "Operational Health",
        score: `${scoreCardMetrics.operationalHealthScore}%`,
        rawScore: scoreCardMetrics.operationalHealthScore,
        status: getStatusLabel(scoreCardMetrics.operationalHealthScore),
        note: "Composite score across throughput, aging, allocation, inventory, and shipping.",
      },
      {
        title: "Throughput Readiness",
        score: `${scoreCardMetrics.closureRate}%`,
        rawScore: scoreCardMetrics.closureRate,
        status: getStatusLabel(scoreCardMetrics.closureRate),
        note: "Closed work vs total captured job records.",
      },
      {
        title: "Aging Control",
        score: `${scoreCardMetrics.agingScore}%`,
        rawScore: scoreCardMetrics.agingScore,
        status: getStatusLabel(scoreCardMetrics.agingScore),
        note: "Measures open work that is not over 24 hours.",
      },
      {
        title: "Allocation Control",
        score: `${scoreCardMetrics.allocationScore}%`,
        rawScore: scoreCardMetrics.allocationScore,
        status: getStatusLabel(scoreCardMetrics.allocationScore),
        note: "Completed/released allocations vs total allocation records.",
      },
    ],
    [scoreCardMetrics]
  );

  const leadershipMetrics = useMemo(
    () => [
      {
        label: "Open Work",
        value: scoreCardMetrics.openJobs,
        detail: "Live active work queue from job records.",
      },
      {
        label: "Completed Today",
        value: scoreCardMetrics.completedToday,
        detail: "Closed or completed work updated today.",
      },
      {
        label: "Active Customers",
        value: scoreCardMetrics.uniqueCustomers,
        detail: "Customers or request sources represented in jobs.",
      },
      {
        label: "A&M External Queue",
        value: scoreCardMetrics.amCratingQueue,
        detail: "External crating dependency tracked outside INTRAL labor time.",
      },
    ],
    [scoreCardMetrics]
  );

  const testingFocus = useMemo(
    () => [
      {
        label: "Dashboard Drilldowns",
        value: "Active",
        detail: "KPI tile routing has been confirmed.",
      },
      {
        label: "Dropdown Layering",
        value: "Patched",
        detail: "Oracle menu stacking issue has a scoped QA patch.",
      },
      {
        label: "Role Testing",
        value: "Pending",
        detail: "Admin, Manager, Employee, and Customer workflows require test pass.",
      },
      {
        label: "Printer Testing",
        value: "Site Required",
        detail: "Zebra ZT411 serial/COM print verification must be tested onsite.",
      },
    ],
    []
  );

  const renderTrendRows = (metricKey, tone) => {
    return (
      <div className="phase18-bar-chart">
        {trendData.map((item) => (
          <div key={`${metricKey}-${item.key}`} className="phase18-bar-row">
            <div className="phase18-bar-label">
              <span>{item.label}</span>
              <strong>{item[metricKey]}</strong>
            </div>

            <div className="phase18-bar-track">
              <div
                className={`phase18-bar-fill ${tone}`}
                style={{
                  width: `${Math.max(
                    4,
                    Math.round((item[metricKey] / maxTrendValue) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-workspace dashboard-control-tower phase14-dashboard phase18-dashboard scorecards-workspace">
      <div className="dashboard-header dashboard-control-header phase14-hero phase18-hero">
        <div>
          <span className="dashboard-eyebrow">PHASE 20C • EXECUTIVE TRENDS</span>
          <h1>Score Cards Command Center</h1>
        </div>

        <div className="dashboard-header-actions phase14-header-actions">
          <div
            className={
              scoreCardMetrics.operationalHealthScore >= 75
                ? "dashboard-health-card phase14-health-card healthy"
                : "dashboard-health-card phase14-health-card critical"
            }
          >
            <span>Executive Readiness</span>
            <strong>{getStatusLabel(scoreCardMetrics.operationalHealthScore)}</strong>
            <small>
              Live score: {scoreCardMetrics.operationalHealthScore}% •{" "}
              {scoreCardMetrics.totalJobs} job record(s)
            </small>
          </div>

          <button
            className="dashboard-refresh-button"
            onClick={loadScoreCardData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Score Cards"}
          </button>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      <div className="phase14-kpi-grid">
        {executiveScoreCards.map((card) => (
          <div
            key={card.title}
            className={`phase14-kpi-card ${getToneClass(card.rawScore)}`}
          >
            <span>{card.title}</span>
            <strong>{card.score}</strong>
            <p>{card.status}</p>
          </div>
        ))}
      </div>

      <div className="phase18-chart-grid">
        <div className="dashboard-panel phase18-chart-panel phase18-wide-chart">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">7-Day Trend</span>
              <h2>Open Work Trend</h2>
            </div>
            <strong>{maxTrendValue} Max</strong>
          </div>

          {renderTrendRows("open", "blue")}
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">7-Day Trend</span>
              <h2>Closed Work</h2>
            </div>
          </div>

          {renderTrendRows("closed", "green")}
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">7-Day Trend</span>
              <h2>Aging Risk</h2>
            </div>
          </div>

          {renderTrendRows("aging", "red")}
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">7-Day Trend</span>
              <h2>Shipping Load</h2>
            </div>
          </div>

          {renderTrendRows("shipping", "teal")}
        </div>
      </div>

      <div className="phase18-chart-grid">
        <div className="dashboard-panel phase18-chart-panel phase18-wide-chart">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Operational Volume</span>
              <h2>Receiving Trend</h2>
            </div>
            <strong>{scoreCardMetrics.receivingToday} Today</strong>
          </div>

          {renderTrendRows("receiving", "purple")}
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Inventory Control</span>
              <h2>Allocation Trend</h2>
            </div>
          </div>

          {renderTrendRows("allocation", "gold")}
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">Readiness</span>
              <h2>Inventory Ready</h2>
            </div>
          </div>

          <div className="phase18-gauge-wrap">
            <div
              className="phase18-gauge"
              style={{
                "--gauge-value": `${Math.max(
                  0,
                  Math.min(100, scoreCardMetrics.inventoryReadinessScore)
                )}%`,
              }}
            >
              <div>
                <strong>{scoreCardMetrics.inventoryReadinessScore}%</strong>
                <span>Ready</span>
              </div>
            </div>

            <p>
              {scoreCardMetrics.activeInventory} active line(s) out of{" "}
              {scoreCardMetrics.inventoryLines} inventory record(s).
            </p>
          </div>
        </div>

        <div className="dashboard-panel phase18-chart-panel">
          <div className="phase18-chart-header">
            <div>
              <span className="dashboard-eyebrow">External Dependency</span>
              <h2>A&M Exposure</h2>
            </div>
          </div>

          <div className="phase18-risk-stack">
            <div className="phase18-risk-item">
              <div>
                <span>A&M Queue</span>
                <strong>{scoreCardMetrics.amCratingQueue}</strong>
              </div>
              <div className="phase18-risk-meter">
                <i
                  className={scoreCardMetrics.amCratingQueue > 0 ? "gold" : "green"}
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (scoreCardMetrics.amCratingQueue /
                          Math.max(scoreCardMetrics.openJobs, 1)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="phase18-risk-item">
              <div>
                <span>Open Work</span>
                <strong>{scoreCardMetrics.openJobs}</strong>
              </div>
              <div className="phase18-risk-meter">
                <i
                  className="blue"
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (scoreCardMetrics.openJobs /
                          Math.max(scoreCardMetrics.totalJobs, 1)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="phase14-leadership-grid">
        <div className="dashboard-panel phase14-leadership-snapshot">
          <div className="phase14-panel-header">
            <div>
              <span className="dashboard-eyebrow">Leadership Score Cards</span>
              <h2>Live Executive Performance Summary</h2>
            </div>
          </div>

          <div className="phase14-snapshot-grid">
            {leadershipMetrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel phase14-health-matrix">
          <div className="phase14-panel-header">
            <div>
              <span className="dashboard-eyebrow">Balanced Scorecard View</span>
              <h2>Operating Category Health</h2>
            </div>
          </div>

          <div className="phase14-health-list">
            <div
              className={`phase14-health-row ${scoreCardMetrics.closureRate >= 75 ? "healthy" : "warning"}`}
            >
              <span>Internal Process</span>
              <strong>{scoreCardMetrics.closureRate}% Closure</strong>
            </div>

            <div
              className={`phase14-health-row ${scoreCardMetrics.agingScore >= 75 ? "healthy" : "critical"}`}
            >
              <span>Service / Aging</span>
              <strong>{scoreCardMetrics.over24Hours} Over 24h</strong>
            </div>

            <div
              className={`phase14-health-row ${scoreCardMetrics.allocationScore >= 75 ? "healthy" : "warning"}`}
            >
              <span>Inventory Allocation</span>
              <strong>{scoreCardMetrics.openAllocations} Open</strong>
            </div>

            <div
              className={`phase14-health-row ${scoreCardMetrics.externalDependencyScore >= 75 ? "healthy" : "warning"}`}
            >
              <span>A&M Dependency</span>
              <strong>{scoreCardMetrics.amCratingQueue} External</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-command-grid phase14-command-grid">
        <div className="dashboard-panel dashboard-command-panel">
          <h2>Live Score Card Metrics</h2>

          <div className="dashboard-command-row phase14-action-row">
            <div>
              <span>Shipping Load</span>
              <strong>{scoreCardMetrics.pendingShipments}</strong>
              <p>Pending outbound / transport queue.</p>
            </div>

            <div>
              <span>Receiving Today</span>
              <strong>{scoreCardMetrics.receivingToday}</strong>
              <p>Inbound inventory records created today.</p>
            </div>

            <div>
              <span>Inventory Ready</span>
              <strong>{scoreCardMetrics.activeInventory}</strong>
              <p>Active / available inventory lines.</p>
            </div>

            <div>
              <span>Chargeable Capture</span>
              <strong>{scoreCardMetrics.chargeableJobs}</strong>
              <p>Jobs marked chargeable from captured records.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-command-panel">
          <h2>Testing Rollout Score Card</h2>

          <div className="mini-list">
            {testingFocus.map((item) => (
              <div key={item.label} className="mini-list-row">
                <strong>{item.label}</strong>
                <span>
                  {item.value} • {item.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-control-grid phase14-queue-grid">
        <div className="dashboard-panel large-panel dashboard-queue-panel">
          <h2>Live Score Card Data Sources</h2>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Live Source</th>
                <th>Current Measure</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Jobs</td>
                <td>Supabase jobs</td>
                <td>
                  {scoreCardMetrics.openJobs} open / {scoreCardMetrics.closedJobs} closed
                </td>
                <td>
                  <span className="status-badge complete">Live</span>
                </td>
              </tr>

              <tr>
                <td>Shipping</td>
                <td>Supabase jobs</td>
                <td>{scoreCardMetrics.pendingShipments} pending shipment(s)</td>
                <td>
                  <span className="status-badge complete">Live</span>
                </td>
              </tr>

              <tr>
                <td>Receiving</td>
                <td>Supabase inventory_items</td>
                <td>{scoreCardMetrics.receivingToday} received today</td>
                <td>
                  <span className="status-badge complete">Live</span>
                </td>
              </tr>

              <tr>
                <td>Allocation</td>
                <td>Supabase inventory_allocations</td>
                <td>
                  {scoreCardMetrics.openAllocations} open /{" "}
                  {scoreCardMetrics.completedAllocations} completed
                </td>
                <td>
                  <span className="status-badge complete">Live</span>
                </td>
              </tr>

              <tr>
                <td>A&M</td>
                <td>External crating queue</td>
                <td>{scoreCardMetrics.amCratingQueue} external dependency record(s)</td>
                <td>
                  <span className="status-badge released">Separated</span>
                </td>
              </tr>

              <tr>
                <td>Labor</td>
                <td>Future work capture</td>
                <td>
                  {scoreCardMetrics.chargeableJobs} chargeable /{" "}
                  {scoreCardMetrics.nonChargeableJobs} non-chargeable
                </td>
                <td>
                  <span className="status-badge open">Partially Live</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="dashboard-panel dashboard-queue-panel">
          <h2>Executive Notes</h2>
          <p className="panel-note">
            Score Cards now include live 7-day trend graphics. Dashboard remains the operational command center; Score Cards serve leadership reporting and performance review.
          </p>

          <div className="mini-list">
            <div className="mini-list-row">
              <strong>CEO / VP</strong>
              <span>Live readiness score and operational trend foundation.</span>
            </div>

            <div className="mini-list-row">
              <strong>Manager</strong>
              <span>Queue, aging, labor capture, and dependency visibility.</span>
            </div>

            <div className="mini-list-row">
              <strong>QA</strong>
              <span>Testing rollout score card is now visible.</span>
            </div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-queue-panel">
          <h2>Next Build Target</h2>
          <div className="health-row">
            <span>Phase 20D</span>
            <strong>Export / Snapshot</strong>
          </div>

          <p className="panel-note">
            Next step: prepare leadership-ready export and weekly snapshot workflow without changing the protected shell.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScoreCardsWorkspace;
