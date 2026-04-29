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

  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState("");

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.startTime && j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  const chartData = Object.values(
    jobs.reduce((acc, j) => {
      if (!acc[j.created]) acc[j.created] = { name: j.created, jobs: 0 };
      acc[j.created].jobs++;
      return acc;
    }, {})
  );

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
            <button onClick={() => setTab("requests")}>Requests</button>
            <button onClick={() => setTab("notes")}>Notes</button>
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
                <p>No job data yet.</p>
              ) : (
                <div className="chart-grid">

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

                  <div className="chart-box">
                    <h3>Job Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name">
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
              <input value={newJob} onChange={(e) => setNewJob(e.target.value)} />

              <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
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
                    {job.task} — {job.type} — {job.status}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ✅ REQUESTS */}
          {tab === "requests" && (
            <>
              <input value={newRequest} onChange={(e) => setNewRequest(e.target.value)} />
              <button onClick={() => {
                setRequests([...requests, newRequest]);
                setNewRequest("");
              }}>
                Add Request
              </button>

              <ul>
                {requests.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </>
          )}

          {/* ✅ NOTES */}
          {tab === "notes" && (
            <>
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              <button onClick={() => {
                setNotes([...notes, newNote]);
                setNewNote("");
              }}>
                Add Note
              </button>

              <ul>
                {notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </>
          )}

        </div>
      </div>

      {/* ✅ ACTIVE BAR */}
      <div className="active-bar">
        Active Jobs: {activeJobs}
      </div>
    </>
  );
}

export default App;
