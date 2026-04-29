import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const USERS = {
    manager: { username: "manager", password: "3PL_Admin!" },
    operator: { username: "operator", password: "3PL_User!" }
  };

  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const savedJobs = localStorage.getItem("jobs");
    const savedUser = localStorage.getItem("user");

    if (savedJobs) setJobs(JSON.parse(savedJobs));
    if (savedUser) setUser(JSON.parse(savedUser));

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }, [jobs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    user
      ? localStorage.setItem("user", JSON.stringify(user))
      : localStorage.removeItem("user");
  }, [user, hydrated]);

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
    setJobs([...jobs, { task: newJob, status: "Open" }]);
    setNewJob("");
  };

  const closeJob = index => {
    const copy = [...jobs];
    copy[index].status = "Closed";
    setJobs(copy);
  };

  const openJobs = jobs.filter(j => j.status === "Open").length;
  const closedJobs = jobs.filter(j => j.status === "Closed").length;

  // ✅ EXPORT FUNCTION
  const exportToCSV = () => {
    const headers = ["Task", "Status"];
    const rows = jobs.map(job => [job.task, job.status]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "jobs.csv";

    document.body.appendChild(link);
    link.click();
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2>3PL Login</h2>
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
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>3PL Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="tabs">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("jobs")}>Jobs</button>
        <button onClick={() => setTab("upload")}>Upload</button>
      </div>

      {tab === "dashboard" && (
        <div className="kpi-row">
          <div className="kpi-card">
            <h3>Open Jobs</h3>
            <p>{openJobs}</p>
          </div>
          <div className="kpi-card">
            <h3>Closed Jobs</h3>
            <p>{closedJobs}</p>
          </div>
        </div>
      )}

      {tab === "jobs" && (
        <>
          <div className="card">
            <h3>New Job</h3>
            <input
              value={newJob}
              onChange={e => setNewJob(e.target.value)}
            />
            <button onClick={addJob}>Add Job</button>
          </div>

          <div className="card">
            <h3>Jobs</h3>

            ✅ THIS IS THE BUTTON YOU WERE MISSING
            <button onClick={exportToCSV}>
              Download Jobs (Excel)
            </button>

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
        </>
      )}

      {tab === "upload" && (
        <div className="card">
          <h3>Upload (Coming Soon)</h3>
          <p>CSV / Excel upload will go here</p>
        </div>
      )}
    </div>
  );
}

export default App;