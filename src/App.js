import React, { useState } from "react";
import "./App.css";

function App() {
  const USERS = {
    manager: { username: "manager", password: "3PL_Admin!" }
  };

  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });

  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [jobType, setJobType] = useState("Outbound");

  // ✅ LOGIN
  const loginUser = () => {
    const match = Object.values(USERS).find(
      u => u.username === login.username && u.password === login.password
    );
    if (!match) return alert("Invalid login");
    setUser(match);
  };

  const logout = () => setUser(null);

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

  // ✅ START TIMER
  const startJob = index => {
    const copy = [...jobs];
    copy[index].startTime = Date.now();
    setJobs(copy);
  };

  // ✅ CLOSE JOB
  const closeJob = index => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    copy[index].endTime = Date.now();
    setJobs(copy);
  };

  // ✅ LOGIN SCREEN
  if (!user) {
    return (
      <div className="container">
        <h2>Login</h2>

        <input
          placeholder="Username"
          onChange={e =>
            setLogin({ ...login, username: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={e =>
            setLogin({ ...login, password: e.target.value })
          }
        />

        <button onClick={loginUser}>Login</button>
      </div>
    );
  }

  // ✅ MAIN APP
  return (
    <div className="container">
      <h1>Job Tracker</h1>
      <button onClick={logout}>Logout</button>

      <h3>New Job</h3>

      <input
        value={newJob}
