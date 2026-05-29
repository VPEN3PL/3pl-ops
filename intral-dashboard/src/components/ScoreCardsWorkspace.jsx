import React, { useMemo } from "react";

function ScoreCardsWorkspace() {
  const executiveScoreCards = useMemo(
    () => [
      {
        title: "Operational Health",
        score: "92%",
        status: "Stable",
        note: "Overall execution posture across open work, shipping, receiving, and allocation.",
      },
      {
        title: "Throughput Readiness",
        score: "88%",
        status: "Monitor",
        note: "Open vs closed work balance and daily completion visibility.",
      },
      {
        title: "Customer Response",
        score: "95%",
        status: "Strong",
        note: "Tracks same-day response expectations and customer-facing request activity.",
      },
      {
        title: "Allocation Control",
        score: "84%",
        status: "Review",
        note: "Inventory allocation readiness and exception exposure.",
      },
    ],
    []
  );

  const leadershipMetrics = useMemo(
    () => [
      {
        label: "Daily Operational Performance",
        value: "Green",
        detail: "No major command-center blockers reported.",
      },
      {
        label: "Chargeable Labor Visibility",
        value: "Active",
        detail: "Foundation ready for chargeable vs non-chargeable capture.",
      },
      {
        label: "A&M External Dependency",
        value: "Tracked",
        detail: "External crating queue visibility separated from INTRAL labor time.",
      },
      {
        label: "Testing Rollout Status",
        value: "Planned",
        detail: "QA checklist and user testing framework to be expanded next.",
      },
    ],
    []
  );

  const weeklyFocus = useMemo(
    () => [
      "Validate dashboard drilldowns and queue routing.",
      "Confirm notification bell behavior across open and aging work.",
      "Test role access for Admin, Manager, Employee, and Customer.",
      "Verify label generation, COO visibility, and Zebra print handoff.",
      "Document issues found during production QA rollout.",
    ],
    []
  );

  return (
    <div className="dashboard-workspace dashboard-control-tower phase14-dashboard phase18-dashboard scorecards-workspace">
      <div className="dashboard-header dashboard-control-header phase14-hero phase18-hero">
        <div>
          <span className="dashboard-eyebrow">PHASE 20A • EXECUTIVE SCORE CARDS</span>
          <h1>Score Cards Command Center</h1>
        </div>

        <div className="dashboard-header-actions phase14-header-actions">
          <div className="dashboard-health-card phase14-health-card healthy">
            <span>Executive Readiness</span>
            <strong>Foundation Active</strong>
            <small>Leadership reporting shell is online.</small>
          </div>
        </div>
      </div>

      <div className="phase14-kpi-grid">
        {executiveScoreCards.map((card) => (
          <div
            key={card.title}
            className={
              card.status === "Review"
                ? "phase14-kpi-card phase14-kpi-warning"
                : card.status === "Monitor"
                ? "phase14-kpi-card phase14-kpi-normal"
                : "phase14-kpi-card phase14-kpi-healthy"
            }
          >
            <span>{card.title}</span>
            <strong>{card.score}</strong>
            <p>{card.status}</p>
          </div>
        ))}
      </div>

      <div className="phase14-leadership-grid">
        <div className="dashboard-panel phase14-leadership-snapshot">
          <div className="phase14-panel-header">
            <div>
              <span className="dashboard-eyebrow">Leadership Score Cards</span>
              <h2>Executive Performance Summary</h2>
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
              <h2>Operating Categories</h2>
            </div>
          </div>

          <div className="phase14-health-list">
            <div className="phase14-health-row healthy">
              <span>Customer</span>
              <strong>Response KPI Ready</strong>
            </div>

            <div className="phase14-health-row healthy">
              <span>Internal Process</span>
              <strong>Workflow Visibility Active</strong>
            </div>

            <div className="phase14-health-row warning">
              <span>Financial / Labor</span>
              <strong>Chargeable Tracking Pending</strong>
            </div>

            <div className="phase14-health-row healthy">
              <span>Learning / QA</span>
              <strong>Testing Rollout Next</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-command-grid phase14-command-grid">
        <div className="dashboard-panel dashboard-command-panel">
          <h2>Score Card Development Roadmap</h2>

          <div className="dashboard-command-row phase14-action-row">
            <div>
              <span>Phase 20A</span>
              <strong>Foundation</strong>
              <p>Score Cards shell and leadership categories.</p>
            </div>

            <div>
              <span>Phase 20B</span>
              <strong>Live Data</strong>
              <p>Wire scorecards to Supabase operational records.</p>
            </div>

            <div>
              <span>Phase 20C</span>
              <strong>Trends</strong>
              <p>Add weekly and monthly executive trend panels.</p>
            </div>

            <div>
              <span>Phase 20D</span>
              <strong>Export</strong>
              <p>Prepare leadership-ready summary/export workflow.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-command-panel">
          <h2>Testing Rollout Focus</h2>

          <div className="mini-list">
            {weeklyFocus.map((item) => (
              <div key={item} className="mini-list-row">
                <strong>QA</strong>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-control-grid phase14-queue-grid">
        <div className="dashboard-panel large-panel dashboard-queue-panel">
          <h2>Future Score Card Data Sources</h2>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Source</th>
                <th>Future KPI</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Jobs</td>
                <td>Job Request / Order Central</td>
                <td>Open vs Closed, Aging, Completion Rate</td>
                <td>
                  <span className="status-badge released">Ready to Wire</span>
                </td>
              </tr>

              <tr>
                <td>Shipping</td>
                <td>Shipping Operations</td>
                <td>Throughput, Started vs Complete, Closeout</td>
                <td>
                  <span className="status-badge released">Ready to Wire</span>
                </td>
              </tr>

              <tr>
                <td>Receiving</td>
                <td>Receiving Workspace</td>
                <td>Inbound Volume, Putaway Completion</td>
                <td>
                  <span className="status-badge open">Planned</span>
                </td>
              </tr>

              <tr>
                <td>Labor</td>
                <td>Operational Labor Capture</td>
                <td>Chargeable vs Non-Chargeable Work</td>
                <td>
                  <span className="status-badge open">Planned</span>
                </td>
              </tr>

              <tr>
                <td>A&M</td>
                <td>External Crating Queue</td>
                <td>Dependency Exposure, Non-INTRAL Time</td>
                <td>
                  <span className="status-badge complete">Separated</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="dashboard-panel dashboard-queue-panel">
          <h2>Executive Notes</h2>
          <p className="panel-note">
            Score Cards will become the leadership reporting layer. Dashboard remains the live command center; Score Cards become the weekly/monthly performance view.
          </p>

          <div className="mini-list">
            <div className="mini-list-row">
              <strong>CEO / VP</strong>
              <span>High-level trend and readiness summary.</span>
            </div>

            <div className="mini-list-row">
              <strong>Manager</strong>
              <span>Operational performance and labor visibility.</span>
            </div>

            <div className="mini-list-row">
              <strong>Customer</strong>
              <span>Future customer-facing KPI view.</span>
            </div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-queue-panel">
          <h2>Next Build Target</h2>
          <div className="health-row">
            <span>Phase 20B</span>
            <strong>Live Score Data</strong>
          </div>

          <p className="panel-note">
            Next step: wire this module to actual jobs, inventory, receiving, shipping, and labor records without changing the protected shell.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScoreCardsWorkspace;
