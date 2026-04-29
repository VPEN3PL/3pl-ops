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

  // ✅ Add job
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

  // ✅ Start timer manually
  const startJob = index => {
    const copy = [...jobs];
    copy[index].startTime = Date.now();
    setJobs(copy);
  };

  // ✅ Close job
  const closeJob = index => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    copy[index].endTime = Date.now();
    setJobs(copy);
  };

  // ✅ Export CSV
  const exportToCSV = () => {
    const headers = ["Task", "Type", "Status"];
    const rows = jobs.map(j => [j.task, j.type, j.status]);

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
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ Line chart
  const chartData = Object.values(
    jobs.reduce((acc, job) => {
      const d = job.created;
      if (!acc[d]) acc[d] = { name: d, jobs: 0 };
      acc[d].jobs++;
      return acc;
    }, {})
  );

  // ✅ Type chart
  const typeChartData = Object.values(
    jobs.reduce((acc, job) => {
      if (!acc[job.type]) acc[job.type] = { name: job.type, count: 0 };
      acc[job.type].count++;
      return acc;
    }, {})
  );

  return (
    <div className="container">
      <h1>3PL Operations Dashboard</h1>

      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
        <button onClick={() => setTab("upload")}>Upload</button>
      </div>

      {/* ✅ DASHBOARD */}
      {tab === "dashboard" && (
        <>
          <div className="kpi-row">
            <div className="kpi-card">
              <h3>Open</h3>
              <p>{openJobs}</p>
            </div>
            <div className="kpi-card">
              <h3>Closed</h3>
              <p>{closedJobs}</p>
            </div>
          </div>

          <div className="card">
            <h3>Jobs Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line dataKey="jobs" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>Jobs by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ✅ JOBS */}
      {tab === "jobs" && (
        <>
          <div className="card">
            <h3>New Job</h3>

            <input
              value={newJob}
              onChange={e => setNewJob(e.target.value)}
            />

            <select
              value={jobType}
              onChange={e => setJobType(e.target.value)}
            >
              <option>Outbound</option>
              <option>Inbound</option>
              <option>Wrapping</option>
              <option>Movement</option>
              <option>Picking</option>
              <option>Other</option>
            </select>

            <button onClick={addJob}>Add Job</button>
          </div>

          <div className="card">
            <h3>Jobs</h3>
            <button onClick={exportToCSV}>Download CSV</button>

            <ul>
              {jobs.map((job, i) => (
                <li key={i}>
                  {job.task} — {job.type} — {job.status} —{" "}

                  {job.startTime && job.endTime &&
                    (() => {
                      const diff = job.endTime - job.startTime;
                      const min = Math.floor(diff / 60000);
                      const sec = Math.floor((diff % 60000) / 1000);
                      return `${min}m ${sec}s`;
                    })()
                  }

                  {!job.startTime && job.status === "Open" && (
                    <button onClick={() => startJob(i)}>
                      Start
                    </button>
                  )}

                  {job.startTime && job.status === "Open" && (
                    <button onClick={() => closeJob(i)}>
                      Close
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* ✅ UPLOAD TAB */}
      {tab === "upload" && (
        <div className="card">
          <h3>Upload (next step)</h3>
          <p>We can add Excel upload next.</p>
        </div>
      )}
    </div>
  );
}

export default App;