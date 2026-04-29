import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const USERS = {
    manager: { username: "manager", password: "3PL_Admin!", role: "manager" },
    operator: { username: "operator", password: "3PL_User!", role: "operator" }
  };

  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");

  // ✅ CRITICAL FLAG
  const [hydrated, setHydrated] = useState(false);

  /* ==========================
     LOAD SAVED DATA (ONCE)
     ========================== */
  useEffect(() => {
    const savedJobs = localStorage.getItem("jobs");
    const savedUser = localStorage.getItem("user");

    if (savedJobs) setJobs(JSON.parse(savedJobs));
    if (savedUser) setUser(JSON.parse(savedUser));

    setHydrated(true); // ✅ allows saving afterward
  }, []);

  /* ==========================
     SAVE JOBS (AFTER LOAD)
     ========================== */
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }, [jobs, hydrated]);

  /* ==========================
     SAVE USER SESSION
     ========================== */
  useEffect(() => {
    if (!hydrated) return;

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user, hydrated]);

  /* ==========================
     AUTH
     ========================== */
  const loginUser = () => {
    const match = Object.values(USERS).find(
      u =>
        u.username === login.username &&
        u.password === login.password
    );

    if (!match) {
      alert("Invalid login");
      return;
    }

    setUser(match);
  };

  const logout = () => setUser(null);

  /* ==========================
     JOB ACTIONS
     ========================== */
  const addJob = () => {
    if (!newJob.trim()) return;

    setJobs([
      ...jobs,
      {
        task: newJob,
        status: "Open",
        created: Date.now()
      }
    ]);
    setNewJob("");
  };

  const closeJob = index => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    setJobs(copy);
  };

  /* ==========================
     LOGIN SCREEN
     ========================== */
  if (!user) {
    return (
      <div className="App">
        <h2>3PL Login</h2>

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

  /* ==========================
     DASHBOARD
     ========================== */
  return (
    <div className="App">
      <h1>3PL Operations Dashboard</h1>

      <p>
        Logged in as <b>{user.username}</b>
      </p>

      <button onClick={logout}>Logout</button>

      <h3>New Job</h3>
      <input
        placeholder="Job description"
        value={newJob}
        onChange={e => setNewJob(e.target.value)}
      />
      <button onClick={addJob}>Add Job</button>

      <h3>Jobs</h3>
      <ul>
        {jobs.map((job, i) => (
          <li key={i}>
            {job.task} — {job.status}
            {job.status === "Open" && (
              <button onClick={() => closeJob(i)}>
                Close
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;