import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");
  const [timeNow, setTimeNow] = useState(new Date());

  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState("");

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  // ✅ LIVE CLOCK
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(new Date());
    }, 1000);
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
        startTime: null,
        endTime: null
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

  // ✅ EXPORT
  const exportToCSV = () => {
    const headers = ["Task", "Type", "Status", "Duration"];
    const rows = jobs.map((job) => {
      let duration = "";
      if (job.startTime && job.endTime) {
        const diff = job.endTime - job.startTime;
        duration = `${Math.floor(diff / 60000)}m`;
      }
      return [job.task, job.type, job.status, duration];
    });

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(r => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "jobs.csv";
    link.click();
  };

  // ✅ KPI
  const openJobs = jobs.filter(j => j.status === "Open").length;
  const activeJobs = jobs.filter(j => j.startTime && j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ AVG TIME PER TYPE
  const avgTimes = {};
  jobs.forEach(j => {
    if (j.startTime && j.endTime) {
      const duration = j.endTime - j.startTime;
      if (!avgTimes[j.type]) avgTimes[j.type] = [];
      avgTimes[j.type].push(duration);
    }
  });

  const avgDisplay = Object.entries(avgTimes).map(([type, arr]) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return `${type}: ${Math.floor(avg / 60000)}m`;
  });

  // ✅ VALUE VS NON VALUE
  const movementTime = avgTimes["Movement"] || [];
  const totalTime = Object.values(avgTimes).flat();
  const movementPercent = totalTime.length
    ? Math.round(
        (movementTime.reduce((a, b) => a + b, 0) /
          totalTime.reduce((a, b) => a + b, 0)) * 100
      )
    : 0;

  return (
    <>
      <div className="background-layer"></div>

      <div className="container">

        <h1>INTRAL OPERATIONS CONTROL PANEL</h1>
        <p>{timeNow.toLocaleString()}</p>

        <div className="tabs">
          <button onClick={() => setTab("dashboard")}>Dashboard</button>
          <button onClick={() => setTab("jobs")}>Jobs</button>
          <button onClick={() => setTab("requests")}>Requests</button>
          <button onClick={() => setTab("notes")}>Notes</button>
        </div>

        {/* ✅ DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <h3>Operations Overview</h3>

            <div className="kpi-row">
              <div className="kpi-card"><h3>Open</h3><p>{openJobs}</p></div>
              <div className="kpi-card"><h3>Active</h3><p>{activeJobs}</p></div>
              <div className="kpi-card"><h3>Closed</h3><p>{closedJobs}</p></div>
            </div>

            <h3>Average Time by Activity</h3>
            <ul>
              {avgDisplay.map((t, i) => <li key={i}>{t}</li>)}
            </ul>

            <h3>Movement vs Value-Add</h3>
            <p>Movement Work: {movementPercent}%</p>
          </>
        )}

        {/* ✅ JOBS */}
        {tab === "jobs" && (
          <>
            <input value={newJob} onChange={e => setNewJob(e.target.value)} />

            <select value={jobType} onChange={e => setJobType(e.target.value)}>
              <option>Outbound</option>
              <option>Inbound</option>
              <option>Receiving</option>
              <option>Kitting</option>
              <option>Wrapping</option>
              <option>Movement</option>
              <option>Picking</option>
            </select>

            <button onClick={addJob}>Add Job</button>
            <button onClick={exportToCSV}>Export</button>

            <ul>
              {jobs.map((job, i) => {
                let liveTime = "";
                if (job.startTime && !job.endTime) {
                  const diff = timeNow - job.startTime;
                  liveTime = `${Math.floor(diff / 60000)}m running`;
                }

                return (
                  <li key={i}>
                    {job.status === "Closed" ? "✅" : job.startTime ? "⏳" : "⏺"}

                    {job.task} — {job.type} — {job.status} {liveTime}

                    {!job.startTime && job.status === "Open" && (
                      <button onClick={() => startJob(i)}>Start</button>
                    )}

                    {job.startTime && job.status === "Open" && (
                      <button onClick={() => closeJob(i)}>Close</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* ✅ REQUESTS */}
        {tab === "requests" && (
          <>
            <h3>Upcoming Requests</h3>

            <input
              value={newRequest}
              onChange={e => setNewRequest(e.target.value)}
            />

            <button
              onClick={() => {
                setRequests([...requests, newRequest]);
                setNewRequest("");
              }}
            >
              Add Request
            </button>

            <ul>
              {requests.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        )}

        {/* ✅ NOTES */}
        {tab === "notes" && (
          <>
            <h3>Ops Notes / Insights</h3>

            <input
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />

            <button
              onClick={() => {
                setNotes([...notes, newNote]);
                setNewNote("");
              }}
            >
              Add Note
            </button>

            <ul>
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </>
        )}

      </div>
    </>
  );
}

export default App;