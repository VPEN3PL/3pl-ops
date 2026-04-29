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

  // ✅ KPIs
  const openJobs = jobs.filter(j => j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ Line Chart Data
  const chartData = Object.values(
    jobs.reduce((acc, job) => {
      const date = job.created;
      if (!acc[date]) acc[date] = { name: date, jobs: 0 };
      acc[date].jobs++;
      return acc;
    }, {})
  );

  // ✅ Job Type Chart
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

      <div className="tabs">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
      </div>

      {/* ✅ DASHBOARD */}
      {tab === "dashboard" && (
        <>
          <div className="kpi-row">
            <div className="kpi-card"><h3>Open</h3><p>{openJobs}</p></div>
            <div className="kpi-card"><h3>Closed</h3><p>{closedJobs}</p></div>
          </div>

          <div className="card">
            <h3>Jobs Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="jobs" stroke="#2563eb" />
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
            </select>

            <button onClick={addJob}>Add Job</button>
          </div>

          <div className="card">
            <h3>Jobs</h3>

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
    </div>
  );
}

export default App;