import React, { useState } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Wrapping");
  const [tab, setTab] = useState("dashboard");

  const addJob = () => {
    if (!newJob.trim()) return;

    setJobs([
      ...jobs,
      {
        task: newJob,
        type: jobType,
        created: new Date().toLocaleDateString()
      }
    ]);

    setNewJob("");
  };

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

  const COLORS = ["#2563eb","#22c55e","#f59e0b","#ef4444","#6366f1"];

  return (
    <>
      <div className="background"></div>

      <div className="page">
        <div className="card">
          <h1>INTRAL OPERATIONS CONTROL PANEL</h1>

          <div className="tabs">
            <button onClick={() => setTab("dashboard")}>Dashboard</button>
            <button onClick={() => setTab("jobs")}>Jobs</button>
          </div>

          {tab === "dashboard" && (
            <>
              <h3>Total Jobs: {jobs.length}</h3>

              {jobs.length === 0 ? (
                <p>No data yet</p>
              ) : (
                <div className="charts">

                  {/* ✅ FIX: REMOVE ResponsiveContainer */}
                  <div className="chart-box">
                    <h3>Jobs Over Time</h3>
                    <LineChart width={350} height={200} data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line dataKey="jobs" stroke="#2563eb" />
                    </LineChart>
                  </div>

                  {/* ✅ FIX: REMOVE ResponsiveContainer */}
                  <div className="chart-box">
                    <h3>Job Distribution</h3>
                    <PieChart width={350} height={200}>
                      <Pie data={pieData} dataKey="value" nameKey="name" label>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>

                </div>
              )}
            </>
          )}

          {tab === "jobs" && (
            <>
              <input
                value={newJob}
                onChange={(e) => setNewJob(e.target.value)}
                placeholder="Enter job"
              />

              <select onChange={(e) => setJobType(e.target.value)}>
                <option>Wrapping</option>
                <option>Movement</option>
                <option>Picking</option>
              </select>

              <button onClick={addJob}>Add Job</button>

              <ul>
                {jobs.map((job, i) => (
                  <li key={i}>{job.task} — {job.type}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="footer">
          Jobs: {jobs.length}
        </div>
      </div>
    </>
  );
}

export default App;