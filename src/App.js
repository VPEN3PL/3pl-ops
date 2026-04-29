import React, { useState, useEffect } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ ADD JOB
  const addJob = () => {
    if (!newJob.trim()) return;

    setJobs([
      ...jobs,
      {
        task: newJob,
        type: jobType,
        status: "Open",
        created: new Date().toLocaleDateString()
      }
    ]);

    setNewJob("");
  };

  // ✅ KPI
  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.status === "Active").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ LINE DATA
  const chartData = Object.values(
    jobs.reduce((acc, j) => {
      if (!acc[j.created]) acc[j.created] = { name: j.created, jobs: 0 };
      acc[j.created].jobs++;
      return acc;
    }, {})
  );

  // ✅ PIE DATA
  const pieData = Object.values(
    jobs.reduce((acc, j) => {
      if (!acc[j.type]) acc[j.type] = { name: j.type, value: 0 };
      acc[j.type].value++;
      return acc;
    }, {})
  );

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#6366f1"];

  return (
    <>
      <div className="background-layer"></div>

      <div className="main-content">

        <div className="container">

          <h1>INTRAL OPERATIONS CONTROL PANEL</h1>
          <p>{timeNow.toLocaleString()}</p>

          {/* ✅ TABS */}
          <div className="tabs">
            <button onClick={() => setTab("dashboard")}>Dashboard</button>
            <button onClick={() => setTab("jobs")}>Jobs</button>
          </div>

          {/* ✅ DASHBOARD */}
          {tab === "dashboard" && (
            <>
              <div className="kpi-row">
                <div className="kpi-card">Open: {openJobs}</div>
                <div className="kpi-card">Active: {activeJobs}</div>
                <div className="kpi-card">Closed: {closedJobs}</div>
              </div>

              {jobs.length === 0 ? (
                <p>No job data yet. Add jobs.</p>
              ) : (
                <div className="chart-grid">

                  {/* ✅ LINE CHART */}
                  <div className="chart-box">
                    <h3>Jobs Over Time</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line dataKey="jobs" stroke="#2563eb" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ✅ PIE CHART */}
                  <div className="chart-box">
                    <h3>Job Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name">
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                </div>
              )}
            </>
          )}

          {/* ✅ JOBS */}
          {tab === "jobs" && (
            <>
              <input
                value={newJob}
                onChange={(e) => setNewJob(e.target.value)}
                placeholder="Enter job"
              />

              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
              >
                <option>Outbound</option>
                <option>Inbound</option>
                <option>Wrapping</option>
                <option>Movement</option>
                <option>Picking</option>
              </select>

              <button onClick={addJob}>Add Job</button>

              <ul>
                {jobs.map((job, i) => (
                  <li key={i}>
                    {job.task} - {job.type}
                  </li>
                ))}
              </ul>
            </>
          )}

        </div>
      </div>

      {/* ✅ ACTIVE BAR (NO OVERLAP) */}
      <div className="active-bar">
        Active Jobs: {jobs.length}
      </div>
    </>
  );
}

export default App;