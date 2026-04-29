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
  Cell
} from "recharts";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");
  const [timeNow, setTimeNow] = useState(new Date());

  // ✅ Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Add job
  const addJob = () => {
    if (!newJob) return;

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

  // ✅ Start / Close
  const startJob = (i) => {
    const copy = [...jobs];
    copy[i].startTime = Date.now();
    setJobs(copy);
  };

  const closeJob = (i) => {
    const copy = [...jobs];
    copy[i].status = "Closed";
    copy[i].endTime = Date.now();
    setJobs(copy);
  };

  // ✅ KPIs
  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.startTime && j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ Line chart data
  const chartData = Object.values(
    jobs.reduce((acc, j) => {
      if (!acc[j.created]) acc[j.created] = { name: j.created, jobs: 0 };
      acc[j.created].jobs += 1;
      return acc;
    }, {})
  );

  // ✅ Pie chart data
  const pieData = Object.values(
    jobs.reduce((acc, j) => {
      if (!acc[j.type]) acc[j.type] = { name: j.type, value: 0 };
      acc[j.type].value += 1;
      return acc;
    }, {})
  );

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#6366f1"];

  return (
    <div className="container">

      <h1>INTRAL OPERATIONS CONTROL PANEL</h1>
      <p>{timeNow.toLocaleString()}</p>

      <div className="tabs">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
      </div>

      {/* ✅ DASHBOARD */}
      {tab === "dashboard" && (
        <div>

          <h3>Open: {openJobs}</h3>
          <h3>Active: {activeJobs}</h3>
          <h3>Closed: {closedJobs}</h3>

          {jobs.length === 0 ? (
            <p>No job data yet. Add jobs.</p>
          ) : (
            <div style={{ display: "flex", gap: "20px" }}>

              {/* LINE */}
              <div style={{ width: "50%" }}>
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

              {/* PIE */}
              <div style={{ width: "50%" }}>
                <h3>Job Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name">
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ✅ JOBS */}
      {tab === "jobs" && (
        <div>

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
                {job.task} - {job.type} - {job.status}

                {!job.startTime && job.status === "Open" && (
                  <button onClick={() => startJob(i)}>Start</button>
                )}

                {job.startTime && job.status === "Open" && (
                  <button onClick={() => closeJob(i)}>Close</button>
                )}
              </li>
            ))}
          </ul>

        </div>
      )}

      {/* ✅ ACTIVE BAR */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "#111",
        color: "white",
        padding: "8px"
      }}>
        Active Jobs: {activeJobs}
      </div>

    </div>
  );
}

export default App;