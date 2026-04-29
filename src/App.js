import React, { useState, useEffect } from "react";
import "./ {import "./App.css";
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");
  const [timeNow, setTimeNow] = useState(new Date());

  // ✅ LIVE CLOCK
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ JOBS
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

  // ✅ KPI
  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.startTime && j.status === "Open").length;
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
  const typeChartData = Object.values(
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

      <div className="container">

        <h1>INTRAL OPERATIONS CONTROL PANEL</h1>
        <p>{timeNow.toLocaleString()}</p>

        <div className="tabs">
          <button onClick={() => setTab("dashboard")}>Dashboard</button>
          <button onClick={() => setTab("jobs")}>Jobs</button>
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
                <h3>Active</h3>
                <p>{activeJobs}</p>
              </div>

              <div className="kpi-card">
                <h3>Closed</h3>
                <p>{closedJobs}</p>
              </div>
            </div>

            <div className="chart-grid">

              {/* LINE */}
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

              {/* PIE */}
              <div className="chart-box">
                <h3>Job Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          </>
        )}

        {/* ✅ JOBS */}
        {tab === "jobs" && (
          <>
            <input
              value={newJob}
              onChange={(e) => setNewJob(e.target.value)}
            />

            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option>Outbound</option>
              <option>Inbound</option>
              <option>Receiving</option>
              <option>Kitting</option>
              <option>Wrapping</option>
              <option>Movement</option>
              <option>Picking</option>
            </select>

            <button onClick={addJob}>Add Job</button>

            <ul>
              {jobs.map((job, i) => (
                <li key={i}>
                  {job.status === "Closed"
                    ? "✅"
                    : job.startTime
                    ? "⏳"
                    : "⏺"}{" "}

                  {job.task} — {job.type} — {job.status}

                  {job.startTime && !job.endTime &&
                    ` — ${Math.floor((timeNow - job.startTime) / 60000)}m`
                  }

                  {!job.startTime && job.status === "Open" && (
                    <button onClick={() => startJob(i)}>Start</button>
                  )}

                  {job.startTime && job.status === "Open" && (
                    <button onClick={() => closeJob(i)}>Close</button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ✅ ACTIVE BAR */}
        <div className="active-bar">
          <h4>ACTIVE JOBS ({activeJobs})</h4>

          <div className="active-list">
            {jobs
              .filter(j => j.startTime && j.status === "Open")
              .map((job, i) => {
                const mins = Math.floor((timeNow - job.startTime) / 60000);
                return (
                  <div key={i} className="active-item">
                    ⏳ {job.task} — {job.type} — {mins}m
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </>
  );
}

export default App;

