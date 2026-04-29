import React, { useState } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");

  // ✅ Add Job
  const addJob = () => {
    if (!newJob.trim()) return;

    setJobs([
      ...jobs,
      {
        task: newJob,
        type: jobType,
        status: "Open",
        startTime: null,
        endTime: null,
        created: new Date().toLocaleDateString()
      }
    ]);

    setNewJob("");
  };

  // ✅ Start Timer
  const startJob = index => {
    const copy = [...jobs];
    copy[index].startTime = Date.now();
    setJobs(copy);
  };

  // ✅ Close Job
  const closeJob = index => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    copy[index].endTime = Date.now();
    setJobs(copy);
  };

  // ✅ Export CSV
  const exportToCSV = () => {
    const headers = ["Task", "Type", "Status", "Duration"];

    const rows = jobs.map(job => {
      let duration = "";
      if (job.startTime && job.endTime) {
        const diff = job.endTime - job.startTime;
        const min = Math.floor(diff / 60000);
        duration = `${min}m`;
      }
      return [job.task, job.type, job.status, duration];
    });

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(r => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "jobs.csv";
    document.body.appendChild(link);
    link.click();
  };

  // ✅ KPI
  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.startTime && j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ Chart Data
  const chartData = Object.values(
    jobs.reduce((acc, job) => {
      if (!acc[job.created]) acc[job.created] = { name: job.created, jobs: 0 };
      acc[job.created].jobs++;
      return acc;
    }, {})
  );

  const typeChartData = Object.values(
    jobs.reduce((acc, job) => {
      if (!acc[job.type]) acc[job.type] = { name: job.type, count: 0 };
      acc[job.type].count++;
      return acc;
    }, {})
  );

  return (
    <div className="container">

      <h1>INTRAL OPERATIONS CONTROL PANEL</h1>
      <p className="subtitle">
        Live Operations • Workload Visibility • Efficiency Tracking
      </p>

      <div className="tabs">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
      </div>

      {/* ✅ DASHBOARD */}
      {tab === "dashboard" && (
        <div className="dashboard-container">

          <div className="kpi-row">
            <div className="kpi-card"><h3>Open</h3><p>{openJobs}</p></div>
            <div className="kpi-card"><h3>Active</h3><p>{activeJobs}</p></div>
            <div className="kpi-card"><h3>Closed</h3><p>{closedJobs}</p></div>
          </div>

          <div className="chart-grid">

            <div className="chart-box">
              <h3>Jobs Over Time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name"/>
                  <YAxis/>
                  <Tooltip/>
                  <Line dataKey="jobs" stroke="#2563eb"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h3>Jobs by Type</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="name"/>
                  <YAxis/>
                  <Tooltip/>
                  <Bar dataKey="count" fill="#22c55e"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* ✅ JOBS */}
      {tab === "jobs" && (
        <>
          <h3>New Job</h3>

          <input value={newJob} onChange={e => setNewJob(e.target.value)} />

          <select value={jobType} onChange={e => setJobType(e.target.value)}>
            <option>Outbound</option>
            <option>Inbound</option>
            <option>Receiving</option>
            <option>Kitting</option>
            <option>Wrapping</option>
            <option>Movement</option>
            <option>Picking</option>
            <option>Other</option>
          </select>

          <button onClick={addJob}>Add Job</button>
          <button onClick={exportToCSV}>Export CSV</button>

          <ul>
            {jobs.map((job,i)=>(
              <li
                key={i}
                className={
                  job.status === "Closed"
                    ? "closed"
                    : job.startTime
                    ? "active"
                    : "open"
                }
              >
                {job.status==="Closed" ? "✅" : job.startTime ? "⏳" : "⏺"}{" "}
                {job.task} — {job.type} — {job.status}

                {job.startTime && job.endTime &&
                  ` — ${Math.floor((job.endTime - job.startTime)/60000)}m`
                }

                {!job.startTime && job.status==="Open" && (
                  <button onClick={()=>startJob(i)}>Start</button>
                )}

                {job.startTime && job.status==="Open" && (
                  <button onClick={()=>closeJob(i)}>Close</button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;