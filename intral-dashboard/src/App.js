import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [role, setRole] = useState(() => localStorage.getItem("intralRole") || "");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [tab, setTab] = useState("home");
  const [opsData, setOpsData] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [dateFilter, setDateFilter] = useState("All Time");
  const [workFilter, setWorkFilter] = useState("All");
  const [now, setNow] = useState(new Date());

  const isManager = role === "Manager";
  const isEmployee = role === "INTRAL Employee";
  const isCustomer = role === "Customer";
  const canManageWork = isManager || isEmployee;

  const credentials = {
    manager: { password: "admin123", role: "Manager" },
    intral: { password: "intral123", role: "INTRAL Employee" },
    customer: { password: "customer123", role: "Customer" }
  };

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem("intralJobs");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    jobNumber: "",
    chargeNumber: "",
    requestorName: "",
    requestSource: "Customer",
    requestCategory: "Shipping Request",
    jobType: "",
    chargeable: false,
    chargeCode: "",
    location: "A&M",
    notes: ""
  });

  useEffect(() => {
    localStorage.setItem("intralJobs", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (role) localStorage.setItem("intralRole", role);
  }, [role]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    const username = loginForm.username.trim().toLowerCase();
    const user = credentials[username];

    if (!user || user.password !== loginForm.password) {
      setLoginError("Invalid username or password");
      return;
    }

    setRole(user.role);
    setTab("home");
    setLoginError("");
    setLoginForm({ username: "", password: "" });
  };

  const logout = () => {
    localStorage.removeItem("intralRole");
    setRole("");
    setTab("home");
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        setOpsData((prev) => [...prev, ...jsonData]);
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, rows: jsonData.length }
        ]);
      };

      reader.readAsArrayBuffer(file);
    });

    e.target.value = "";
  };

  const clearUploadedData = () => {
    if (window.confirm("Clear all uploaded Excel data?")) {
      setOpsData([]);
      setUploadedFiles([]);
    }
  };

  const addJob = () => {
    const newJob = {
      id: Date.now(),
      ...form,
      jobNumber: form.jobNumber.trim() || `JOB-${Date.now()}`,
      chargeNumber: form.chargeNumber || "",
      requestorName: form.requestorName || "Unknown",
      jobType: form.jobType || "Not Specified",
      requestSource: isCustomer ? "Customer" : form.requestSource,
      chargeable: isCustomer ? false : form.chargeable,
      chargeCode: isCustomer ? "" : form.chargeCode,
      status: "Open",
      createdAt: new Date().toISOString(),
      startTime: null,
      completeTime: null,
      actualMinutes: 0
    };

    setJobs([...jobs, newJob]);

    setForm({
      jobNumber: "",
      chargeNumber: "",
      requestorName: "",
      requestSource: "Customer",
      requestCategory: "Shipping Request",
      jobType: "",
      chargeable: false,
      chargeCode: "",
      location: "A&M",
      notes: ""
    });
  };

  const startJob = (id) => {
    setJobs(
      jobs.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "In Progress",
              startTime: j.startTime || new Date().toISOString()
            }
          : j
      )
    );
  };

  const completeJob = (id) => {
    setJobs(
      jobs.map((j) => {
        if (j.id !== id) return j;

        const end = new Date();
        const start = j.startTime ? new Date(j.startTime) : end;
        const minutes = Math.max(1, Math.round((end - start) / 60000));

        return {
          ...j,
          status: "Complete",
          completeTime: end.toISOString(),
          actualMinutes: minutes
        };
      })
    );
  };

  const deleteJob = (id) => {
    if (!isManager) return;
    setJobs(jobs.filter((j) => j.id !== id));
  };

  const getType = (row) =>
    String(row.TRANSACTION_TYPE || "").trim().toLowerCase();

  const accepted = opsData.filter((r) => getType(r) === "accepted").length;
  const delivery = opsData.filter((r) => getType(r) === "delivery").length;
  const kitComplete = opsData.filter((r) => getType(r) === "kit complete").length;
  const pickList = opsData.filter((r) => getType(r) === "pick list").length;
  const receiving = opsData.filter((r) => getType(r) === "receiving").length;
  const xferPick = opsData.filter((r) => getType(r) === "xfer pick").length;
  const xferStock = opsData.filter((r) => getType(r) === "xfer stock").length;
  const totalTransactions = opsData.length;

  const getHoursOpen = (job) => {
    if (!job.createdAt) return "0.0";

    const end =
      job.status === "Complete" && job.completeTime
        ? new Date(job.completeTime)
        : new Date();

    const created = new Date(job.createdAt);
    return Math.max(0, (end - created) / (1000 * 60 * 60)).toFixed(1);
  };

  const isOpenOver24Hours = (job) =>
    job.status !== "Complete" && Number(getHoursOpen(job)) > 24;

  const applyFilters = () => {
    let filtered = [...jobs];

    if (dateFilter === "Today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (j) => new Date(j.createdAt).toDateString() === today
      );
    }

    if (dateFilter === "This Week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((j) => new Date(j.createdAt) >= weekAgo);
    }

    if (workFilter === "Active Only") {
      filtered = filtered.filter((j) => j.status !== "Complete");
    }

    if (workFilter === "Over 24 Hrs") {
      filtered = filtered.filter((j) => isOpenOver24Hours(j));
    }

    return filtered;
  };

  const filteredJobs = applyFilters();
  const activeJobs = jobs.filter((j) => j.status !== "Complete");
  const openOver24Hours = jobs.filter((j) => isOpenOver24Hours(j)).length;

  const openCratingRequests = jobs.filter(
    (j) =>
      j.requestSource === "A&M" &&
      j.requestCategory === "Crating Request" &&
      j.status !== "Complete"
  ).length;

  const totalMinutes = jobs.reduce(
    (sum, j) => sum + Number(j.actualMinutes || 0),
    0
  );

  const chargeableMinutes = jobs
    .filter((j) => j.chargeable)
    .reduce((sum, j) => sum + Number(j.actualMinutes || 0), 0);

  const nonChargeableMinutes = jobs
    .filter((j) => !j.chargeable)
    .reduce((sum, j) => sum + Number(j.actualMinutes || 0), 0);

  const totalLaborHours = totalMinutes / 60;
  const chargeableLaborHours = chargeableMinutes / 60;
  const nonChargeableLaborHours = nonChargeableMinutes / 60;

  const transactionsPerLaborHour =
    totalLaborHours > 0
      ? (totalTransactions / totalLaborHours).toFixed(1)
      : "0.0";

  const filteredCompleted = filteredJobs.filter(
    (j) => j.status === "Complete"
  ).length;

  const filteredOpen = filteredJobs.filter(
    (j) => j.status !== "Complete"
  ).length;

  const filteredOver24 = filteredJobs.filter((j) =>
    isOpenOver24Hours(j)
  ).length;

  const topOldestRequests = [...activeJobs]
    .sort((a, b) => Number(getHoursOpen(b)) - Number(getHoursOpen(a)))
    .slice(0, 5);

  const countByField = (field) => {
    const counts = {};

    filteredJobs.forEach((job) => {
      const key = job[field] || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const workloadBySource = countByField("requestSource");
  const workloadByJobType = countByField("jobType").slice(0, 5);

  const systemKpiData = [
    { name: "Accepted", value: accepted },
    { name: "Delivery", value: delivery },
    { name: "Kit Complete", value: kitComplete },
    { name: "Pick List", value: pickList },
    { name: "Receiving", value: receiving },
    { name: "Xfer Pick", value: xferPick },
    { name: "Xfer Stock", value: xferStock }
  ];

  const requestStatusData = [
    { name: "Completed", value: filteredCompleted },
    { name: "Open", value: filteredOpen },
    { name: "Over 24 Hrs", value: filteredOver24 }
  ];

  const laborData = [
    { name: "Chargeable", value: chargeableLaborHours },
    { name: "Non-Chargeable", value: nonChargeableLaborHours }
  ];

  const riskData = [
    { name: "Open >24 Hrs", value: openOver24Hours },
    { name: "Open Crating", value: openCratingRequests },
    { name: "Active Requests", value: activeJobs.length }
  ];

  const trendByCreatedDate = (() => {
    const buckets = {};

    filteredJobs.forEach((job) => {
      const date = new Date(job.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });

      buckets[date] = (buckets[date] || 0) + 1;
    });

    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  })();

  const maxValue = (items) =>
    Math.max(...items.map((item) => Number(item.value) || 0), 1);

  const BarChart = ({ title, data, suffix = "" }) => {
    const max = maxValue(data);

    return (
      <div className="card">
        <h3>{title}</h3>
        {data.length === 0 ? (
          <p>No data available.</p>
        ) : (
          data.map((item) => {
            const value = Number(item.value) || 0;
            const width = `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`;

            return (
              <div key={item.name} style={{ marginBottom: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginBottom: "5px"
                  }}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {suffix === " hrs" ? value.toFixed(2) : value.toFixed(0)}
                    {suffix}
                  </span>
                </div>

                <div
                  style={{
                    height: "13px",
                    background: "#e2e8f0",
                    borderRadius: "999px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width,
                      height: "100%",
                      background: "#2563eb",
                      borderRadius: "999px"
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const DonutChart = ({ title, data }) => {
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const firstPct =
      total > 0 ? (Number(data[0]?.value || 0) / total) * 100 : 0;

    return (
      <div className="card">
        <h3>{title}</h3>

        <div
          style={{
            width: "170px",
            height: "170px",
            borderRadius: "50%",
            margin: "18px auto",
            background: `conic-gradient(#2563eb 0% ${firstPct}%, #dc2626 ${firstPct}% 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f172a",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            {total.toFixed(2)} hrs
          </div>
        </div>

        {data.map((item) => (
          <p key={item.name}>
            {item.name}: {Number(item.value || 0).toFixed(2)} hrs
          </p>
        ))}
      </div>
    );
  };

  const LineChart = ({ title, data }) => {
    const width = 520;
    const height = 220;
    const padding = 30;
    const max = maxValue(data);

    const points =
      data.length <= 1
        ? []
        : data.map((item, index) => {
            const x =
              padding +
              (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
            const y =
              height -
              padding -
              ((Number(item.value) || 0) / max) * (height - padding * 2);

            return { x, y, ...item };
          });

    const path = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    return (
      <div className="card">
        <h3>{title}</h3>

        {data.length < 2 ? (
          <p>Need at least two dates to show a trend.</p>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "240px" }}
          >
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            <path d={path} fill="none" stroke="#2563eb" strokeWidth="4" />

            {points.map((point) => (
              <g key={`${point.name}-${point.x}`}>
                <circle cx={point.x} cy={point.y} r="5" fill="#dc2626" />
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#0f172a"
                >
                  {point.value}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    );
  };

  const exportCSV = () => {
    const headers = [
      "Job #",
      "Charge Number",
      "Requestor",
      "Source",
      "Category",
      "Job Type",
      "Chargeable",
      "Charge Code",
      "Location",
      "Status",
      "Minutes",
      "Hours Open",
      "Over 24 Hours",
      "Notes"
    ];

    const rows = filteredJobs.map((j) => [
      j.jobNumber,
      j.chargeNumber,
      j.requestorName,
      j.requestSource,
      j.requestCategory,
      j.jobType,
      j.chargeable ? "Yes" : "No",
      j.chargeCode,
      j.location,
      j.status,
      j.actualMinutes,
      getHoursOpen(j),
      isOpenOver24Hours(j) ? "Yes" : "No",
      j.notes
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "intral_work_capture.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!role) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: "520px", margin: "80px auto" }}>
          <h1>🚚 INTRAL 3PL Control Tower</h1>
          <p>Enter your credentials:</p>

          <input
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value })
            }
          />

          <input
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />

          {loginError && (
            <div className="card red" style={{ marginTop: "12px" }}>
              {loginError}
            </div>
          )}

          <button onClick={handleLogin}>Login</button>

          <div style={{ marginTop: "18px", fontSize: "13px" }}>
            <strong>Demo credentials:</strong>
            <br />
            Manager/Admin: manager / admin123
            <br />
            INTRAL Employee: intral / intral123
            <br />
            Customer: customer / customer123
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>🚚 INTRAL 3PL CONTROL TOWER</h1>
          <div>Warehouse Operations • Logistics Visibility • Customer Request Portal</div>
          <div style={{ marginTop: "6px" }}>
            Logged in as: <strong>{role}</strong>{" "}
            <button onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="clock-card">
          <div className="clock-time">
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZoneName: "short"
            })}
          </div>

          <div className="clock-date">
            {now.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric"
            })}
          </div>
        </div>
      </div>

      {(openOver24Hours > 0 || openCratingRequests > 0) && (
        <div className="card red">
          🚨 Control Tower Alert: {openOver24Hours} request(s) open longer than
          24 hours | {openCratingRequests} open crating request(s)
        </div>
      )}

      <div className="tabs">
        <button onClick={() => setTab("home")}>Home</button>
        <button onClick={() => setTab("capture")}>Work Capture</button>
      </div>

      <div className="filters">
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option>All Time</option>
          <option>Today</option>
          <option>This Week</option>
        </select>

        <select value={workFilter} onChange={(e) => setWorkFilter(e.target.value)}>
          <option>All</option>
          <option>Active Only</option>
          <option>Over 24 Hrs</option>
        </select>
      </div>

      {tab === "home" && (
        <div>
          {isManager && (
            <div className="card">
              <h3>Upload Weekly Operations Reports</h3>
              <input type="file" accept=".xlsx, .xls" multiple onChange={handleFileUpload} />
              <p>Total Files Uploaded: {uploadedFiles.length}</p>
              <p>Total Rows Loaded: {totalTransactions}</p>
              <button onClick={clearUploadedData}>Clear Uploaded Excel Data</button>
            </div>
          )}

          <h2>Executive Command Center</h2>

          <div className="grid">
            <div className="card red">Open &gt; 24 Hours: {openOver24Hours}</div>
            <div className="card red">Open Crating Requests: {openCratingRequests}</div>
            <div className="card">Active Requests: {activeJobs.length}</div>
            <div className="card">Filtered Requests: {filteredJobs.length}</div>
            {isManager && (
              <div className="card">Transactions per Labor Hour: {transactionsPerLaborHour}</div>
            )}
          </div>

          <h2>Executive Charts</h2>

          <div className="grid">
            {isManager && <BarChart title="System Transaction KPIs" data={systemKpiData} />}
            <BarChart title="Request Status" data={requestStatusData} />
            {isManager && (
              <DonutChart title="Chargeable vs Non-Chargeable Labor" data={laborData} />
            )}
            <BarChart title="Risk / Attention KPIs" data={riskData} />
            <BarChart title="Workload by Source" data={workloadBySource} />
            {isManager && <BarChart title="Why Are We Busy?" data={workloadByJobType} />}
            <LineChart title="Request Trend" data={trendByCreatedDate} />
          </div>

          <h2>Daily Summary</h2>

          <div className="grid">
            <div className="card">Total Requests: {filteredJobs.length}</div>
            <div className="card">Completed: {filteredCompleted}</div>
            <div className="card">Open: {filteredOpen}</div>
            <div className="card red">Over 24 Hrs: {filteredOver24}</div>
            {isManager && (
              <div className="card red">
                Uncaptured Operational Labor: {nonChargeableLaborHours.toFixed(2)} hrs
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "capture" && (
        <div>
          <div className="card">
            <h2>{isCustomer ? "Customer Request Portal" : "Add Work Request"}</h2>

            <input
              placeholder="Job # (Optional)"
              value={form.jobNumber}
              onChange={(e) => setForm({ ...form, jobNumber: e.target.value })}
            />

            <input
              placeholder="Charge Number (Optional)"
              value={form.chargeNumber}
              onChange={(e) => setForm({ ...form, chargeNumber: e.target.value })}
            />

            <input
              placeholder="Requestor Name"
              value={form.requestorName}
              onChange={(e) => setForm({ ...form, requestorName: e.target.value })}
            />

            {canManageWork && (
              <select
                value={form.requestSource}
                onChange={(e) => setForm({ ...form, requestSource: e.target.value })}
              >
                <option>Customer</option>
                <option>UPS / IWW</option>
                <option>A&M</option>
                <option>Maxim</option>
                <option>Internal</option>
              </select>
            )}

            <select
              value={form.requestCategory}
              onChange={(e) => setForm({ ...form, requestCategory: e.target.value })}
            >
              <option>Shipping Request</option>
              <option>Crating Request</option>
              <option>Heavy Labor Support</option>
              <option>Movement Request</option>
              <option>Inventory Support</option>
              <option>Kitting Support</option>
              <option>Receiving Support</option>
              <option>General Support</option>
            </select>

            <select
              value={form.jobType}
              onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            >
              <option value="">Select Job Type (Optional)</option>
              <option>Wrapping</option>
              <option>Strapping</option>
              <option>Movement</option>
              <option>Crating</option>
              <option>Loading</option>
              <option>Pickup</option>
              <option>Delivery</option>
              <option>Putaway</option>
              <option>Search / Locate</option>
              <option>Staging Support</option>
              <option>Other</option>
            </select>

            {isManager && (
              <>
                <label>
                  Chargeable
                  <input
                    type="checkbox"
                    checked={form.chargeable}
                    onChange={(e) =>
                      setForm({ ...form, chargeable: e.target.checked })
                    }
                  />
                </label>

                <input
                  placeholder="Internal Charge Code"
                  value={form.chargeCode}
                  onChange={(e) => setForm({ ...form, chargeCode: e.target.value })}
                />
              </>
            )}

            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <input
              placeholder={isCustomer ? "Request Details" : "Notes / Internal Details"}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <button onClick={addJob}>
              {isCustomer ? "Submit Request" : "Add Request"}
            </button>
          </div>

          <h2>Work Request Table</h2>

          {isManager && <button onClick={exportCSV}>Export CSV</button>}

          <table>
            <thead>
              <tr>
                <th>Job #</th>
                <th>Charge #</th>
                <th>Requestor</th>
                <th>Source</th>
                <th>Category</th>
                <th>Job</th>
                {isManager && <th>Chargeable</th>}
                <th>Status</th>
                <th>Hours Open</th>
                <th>Alert</th>
                {isManager && <th>Minutes</th>}
                {canManageWork && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {filteredJobs.map((j) => (
                <tr key={j.id}>
                  <td>{j.jobNumber}</td>
                  <td>{j.chargeNumber}</td>
                  <td>{j.requestorName}</td>
                  <td>{j.requestSource}</td>
                  <td>{j.requestCategory}</td>
                  <td>{j.jobType}</td>
                  {isManager && <td>{j.chargeable ? "Yes" : "No"}</td>}
                  <td>{j.status}</td>
                  <td>{getHoursOpen(j)}</td>
                  <td>
                    {isOpenOver24Hours(j) ? (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        ⚠ Over 24 Hrs
                      </span>
                    ) : (
                      <span style={{ color: "green" }}>On Track</span>
                    )}
                  </td>
                  {isManager && <td>{j.actualMinutes}</td>}
                  {canManageWork && (
                    <td>
                      {j.status === "Open" && (
                        <button onClick={() => startJob(j.id)}>Start</button>
                      )}
                      {j.status === "In Progress" && (
                        <button onClick={() => completeJob(j.id)}>Complete</button>
                      )}
                      {isManager && (
                        <button onClick={() => deleteJob(j.id)}>Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;