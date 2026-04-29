import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const USERS = {
    manager: { username: "manager", password: "3PL_Admin!" }
  };

  // ✅ LOAD USER FROM LOCAL STORAGE
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [login, setLogin] = useState({ username: "", password: "" });

  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");
  const [tab, setTab] = useState("dashboard");

  // ✅ SAVE USER WHEN IT CHANGES
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // ✅ LOGIN
  const loginUser = () => {
    const match = Object.values(USERS).find(
      u => u.username === login.username && u.password === login.password
    );
    if (!match) return alert("Invalid login");
    setUser(match);
  };

  const logout = () => setUser(null);

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

  const startJob = index => {
    const copy = [...jobs];
    copy[index].startTime = Date.now();
    setJobs(copy);
  };

  const closeJob = index => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    copy[index].endTime = Date.now();
    setJobs(copy);
  };

  if (!user) {
    return (
      <div className="container">
        <h2>Login</h2>

        <input
          placeholder="Username"
          onChange={e => setLogin({ ...login, username: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={e => setLogin({ ...login, password: e.target.value })}
        />

        <button onClick={loginUser}>Login</button>
      </div>
    );
  }

  return (
    <div className="container">

      <h1>3PL Operations Dashboard</h1>
      <button onClick={logout}>Logout</button>

      <div className="tabs">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <>
          <h3>Overview</h3>
          <p>Build charts here (next step)</p>
        </>
      )}

      {/* JOBS */}
      {tab === "jobs" && (
        <>
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

          <h3>Jobs</h3>

          <ul>
            {jobs.map((job, i) => (
              <li key={i}>
                {job.status === "Closed"
                  ? "✅ "
                  : job.startTime
                  ? "⏳ "
                  : "⏺ "}

                {job.task} — {job.type} — {job.status}

                {job.startTime && job.endTime && (
                  <>
                    {" — "}
                    {Math.floor((job.endTime - job.startTime) / 60000)}m
                  </>
                )}

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
        </>
      )}
    </div>
  );
}

export default App;