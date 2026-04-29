import React, { useState } from "react";
import "./App.css";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");

  const addJob = () => {
    if (!newJob.trim()) return;

    setJobs([
      ...jobs,
      {
        task: newJob,
        type: jobType,
        status: "Open",
        startTime: null,
        endTime: null
      }
    ]);

    setNewJob("");
  };

  const startJob = (index) => {
    const copy = [...jobs];
    copy[index].startTime = Date.now();
    setJobs(copy);
  };

  const closeJob = (index) => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    copy[index].endTime = Date.now();
    setJobs(copy);
  };

  const exportToCSV = () => {
    const headers = ["Task", "Type", "Status", "Duration"];

    const rows = jobs.map((job) => {
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
      [headers, ...rows].map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "jobs.csv";
    document.body.appendChild(link);
    link.click();
  };

  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.startTime && j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  return (
    <>
      <div className="background-layer"></div>

      <div className="container">

        <h1>INTRAL OPERATIONS CONTROL PANEL</h1>

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
          </div>
        )}

        {/* ✅ JOBS */}
        {tab === "jobs" && (
          <div>

            <h3>New Job</h3>

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
              <option>Other</option>
            </select>

            <button onClick={addJob}>Add Job</button>
            <button onClick={exportToCSV}>Export CSV</button>

            <ul>
              {jobs.map((job, i) => (
                <li key={i}>

                  {job.status === "Closed"
                    ? "✅"
                    : job.startTime
                    ? "⏳"
                    : "⏺"}{" "}

                  {job.task} — {job.type} — {job.status}

                  {job.startTime && job.endTime &&
                    ` — ${Math.floor((job.endTime - job.startTime) / 60000)}m`
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

          </div>
        )}

      </div>
    </>
  );
}

export default App;
``