import React, { useEffect, useState } from "react";
import "./App.css";

import { supabase } from "./supabaseClient";
import WorkspacePortal from "./components/WorkspacePortal";
import DashboardWorkspace from "./components/DashboardWorkspace";
import InventoryWorkspace from "./components/InventoryWorkspace";
import ReceivingWorkspace from "./components/ReceivingWorkspace";
import JobRequestWorkspace from "./components/JobRequestWorkspace";
import OrderCentralWorkspace from "./components/OrderCentralWorkspace";
import ShippingOperationsWorkspace from "./components/ShippingOperationsWorkspace";
import ScoreCardsWorkspace from "./components/ScoreCardsWorkspace";
import AdminWorkspace from "./components/AdminWorkspace";
import ForgotPasswordWorkspace from "./components/ForgotPasswordWorkspace";
import AuditLogsWorkspace from "./components/AuditLogsWorkspace";
import CredentialRequestWorkspace from "./components/CredentialRequestWorkspace";

const initialOperationalOrders = [
  {
    joNumber: "JO-000100",
    requestor: "Oscar",
    jobType: "Movement",
    details: "Move inventory from 1K to A&M for crating support.",
    allocationRequired: true,
    allocationConfirmed: false,
    releaseStatus: "Open",
    soNumber: "",
    priority: "High",
    requestedDate: "2026-05-18",
    customer: "Gillette",
    shipTo: "A&M Crating",
    additionalWork: [],
    stagingLocation: "",
    originalLocation: "",
    startedAt: "",
    completedAt: "",
    pieces: "1",
    weight: "TBD",
    dimensions: "TBD",
    finalDestination: "Pending final destination confirmation",
    additionalDetails:
      "Material staged for A&M crating support after Order Central review.",
    inventoryDetails: {
      inventoryId: "INV-1001",
      partNumber: "PN-45882",
      customer: "Gillette",
      availableQty: 100,
      requestedQty: 20,
      subInventory: "1K",
      pullFromLocation: "1K-22-A1",
      destinationLocation: "A&M Crating",
      allocationStatus: "Pending Confirmation",
    },
  },
  {
    joNumber: "JO-000101",
    requestor: "Luis",
    jobType: "Shipping",
    details: "Outbound customer shipment.",
    allocationRequired: false,
    allocationConfirmed: false,
    releaseStatus: "Active",
    soNumber: "SO-000101",
    priority: "Normal",
    requestedDate: "2026-05-18",
    customer: "P&G",
    shipTo: "Customer Dock",
    additionalWork: [],
    stagingLocation: "STG-SO000101",
    originalLocation: "Shipping Dock",
    startedAt: "",
    completedAt: "",
    pieces: "3",
    weight: "450 LBS",
    dimensions: "48 x 40 x 42",
    finalDestination: "Customer Dock",
    additionalDetails: "SO generated from Order Central and waiting execution.",
    inventoryDetails: null,
  },
  {
    joNumber: "JO-000102",
    requestor: "Maria",
    jobType: "Logistics",
    details: "Forklift and labor support for staging area move.",
    allocationRequired: true,
    allocationConfirmed: false,
    releaseStatus: "Open",
    soNumber: "",
    priority: "Normal",
    requestedDate: "2026-05-18",
    customer: "INTRAL",
    shipTo: "Internal",
    additionalWork: [],
    stagingLocation: "",
    originalLocation: "",
    startedAt: "",
    completedAt: "",
    pieces: "1",
    weight: "TBD",
    dimensions: "TBD",
    finalDestination: "Internal Staging",
    additionalDetails: "Forklift and labor support requested.",
    inventoryDetails: {
      inventoryId: "INV-1003",
      partNumber: "PN-99021",
      customer: "P&G",
      availableQty: 250,
      requestedQty: 10,
      subInventory: "6K",
      pullFromLocation: "6K-88-D1",
      destinationLocation: "Internal Staging",
      allocationStatus: "Pending Confirmation",
    },
  },
  {
    joNumber: "JO-000103",
    requestor: "Anthony",
    jobType: "Shipping",
    details: "International shipment release with documentation review.",
    allocationRequired: false,
    allocationConfirmed: false,
    releaseStatus: "Closed",
    soNumber: "SO-000103",
    priority: "High",
    requestedDate: "2026-05-17",
    customer: "Gillette",
    shipTo: "International Customer",
    additionalWork: ["Completed export document review."],
    stagingLocation: "STG-SO000103",
    originalLocation: "",
    startedAt: "07:50 AM",
    completedAt: "10:25 AM",
    pieces: "2",
    weight: "TBD",
    dimensions: "TBD",
    finalDestination: "International Customer",
    additionalDetails: "Closed historical shipping record.",
    inventoryDetails: null,
  },
  {
    joNumber: "JO-000104",
    requestor: "P&G",
    jobType: "Movement",
    details: "Move inventory to DCIC staging area.",
    allocationRequired: true,
    allocationConfirmed: false,
    releaseStatus: "Open",
    soNumber: "",
    priority: "Normal",
    requestedDate: "2026-05-17",
    customer: "P&G",
    shipTo: "DCIC",
    additionalWork: [],
    stagingLocation: "",
    originalLocation: "",
    startedAt: "",
    completedAt: "",
    pieces: "1",
    weight: "TBD",
    dimensions: "TBD",
    finalDestination: "DCIC",
    additionalDetails: "Move request awaiting allocation.",
    inventoryDetails: {
      inventoryId: "INV-1003",
      partNumber: "PN-99021",
      customer: "P&G",
      availableQty: 250,
      requestedQty: 25,
      subInventory: "6K",
      pullFromLocation: "6K-88-D1",
      destinationLocation: "DCIC",
      allocationStatus: "Pending Confirmation",
    },
  },
  {
    joNumber: "JO-000105",
    requestor: "Gillette",
    jobType: "Shipping",
    details: "Outbound shipment ready for processing.",
    allocationRequired: false,
    allocationConfirmed: false,
    releaseStatus: "Active",
    soNumber: "SO-000105",
    priority: "Normal",
    requestedDate: "2026-05-16",
    customer: "Gillette",
    shipTo: "Customer Dock",
    additionalWork: [],
    stagingLocation: "STG-SO000105",
    originalLocation: "Outbound Staging",
    startedAt: "",
    completedAt: "",
    pieces: "2",
    weight: "220 LBS",
    dimensions: "40 x 40 x 36",
    finalDestination: "Customer Dock",
    additionalDetails: "SO generated from Order Central and waiting execution.",
    inventoryDetails: null,
  },
];

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [guestSession, setGuestSession] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authView, setAuthView] = useState("login");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  const [tab, setTab] = useState(() => {
    return localStorage.getItem("intral-connect-active-tab") || "portal";
  });

  const [orders, setOrders] = useState(initialOperationalOrders);
  const [operationalNotifications, setOperationalNotifications] = useState([]);

  const [liveTime, setLiveTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    localStorage.setItem("intral-connect-active-tab", tab);
  }, [tab]);

  useEffect(() => {
    const now = new Date();

    const alerts = [];

    orders.forEach((order) => {
      const requestedDate = order?.requestedDate
        ? new Date(`${order.requestedDate}T00:00:00`)
        : null;

      const ageHours =
        requestedDate && !Number.isNaN(requestedDate.getTime())
          ? Math.floor((now.getTime() - requestedDate.getTime()) / 36e5)
          : 0;

      if (order.releaseStatus === "Open") {
        alerts.push({
          id: `${order.joNumber}-open`,
          title: "Order Awaiting Review",
          detail: `${order.joNumber} • ${order.customer || "Customer"} • ${
            order.jobType || "Work Request"
          }`,
          tab: "orders-open",
          severity: order.priority === "High" ? "high" : "normal",
        });
      }

      if (order.releaseStatus === "Active") {
        alerts.push({
          id: `${order.joNumber}-active`,
          title: "Shipping Ready for Execution",
          detail: `${order.soNumber || order.joNumber} is active and ready for Shipping Operations.`,
          tab: "shipping",
          severity: "normal",
        });
      }

      if (order.releaseStatus !== "Closed" && ageHours >= 24) {
        alerts.push({
          id: `${order.joNumber}-aging`,
          title: "Aging Work > 24 Hours",
          detail: `${order.joNumber} has been open for approximately ${ageHours} hours.`,
          tab: "dashboard",
          severity: "high",
        });
      }

      if (order.allocationRequired && !order.allocationConfirmed) {
        alerts.push({
          id: `${order.joNumber}-allocation`,
          title: "Allocation Pending",
          detail: `${order.joNumber} requires inventory allocation confirmation.`,
          tab: "allocation",
          severity: "normal",
        });
      }
    });

    setOperationalNotifications(alerts.slice(0, 12));
  }, [orders]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setLiveTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateClock();

    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  };

  const handleGuestLogin = () => {
    setGuestSession(true);
    setProfile({
      id: "guest-user",
      role: "guest",
      email: "guest@intral.local",
      display_name: "Guest User",
      department: "Guest Portal",
      must_change_password: false,
    });
    setTab("jobs");
    localStorage.setItem("intral-connect-active-tab", "jobs");
  };

  const handleRequiredPasswordChange = async () => {
    setPasswordChangeMessage("");

    if (!newPassword.trim()) {
      setPasswordChangeMessage("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage("New password and confirmation do not match.");
      return;
    }

    if (!session?.user?.id) {
      setPasswordChangeMessage("Session not found. Please log out and log back in.");
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeMessage("Updating password...");

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      setPasswordChangeMessage(`Password update failed: ${passwordError.message}`);
      setPasswordChangeLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        must_change_password: false,
      })
      .eq("id", session.user.id);

    if (profileError) {
      setPasswordChangeMessage(
        `Password changed, but profile update failed: ${profileError.message}`
      );
      setPasswordChangeLoading(false);
      return;
    }

    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordChangeMessage("Password changed successfully. Loading workspace...");

    await loadProfile(session.user.id);

    setPasswordChangeLoading(false);
  };

  const handleLogout = async () => {
    if (guestSession) {
      setGuestSession(false);
      setTab("portal");
      localStorage.setItem("intral-connect-active-tab", "portal");
      setEmail("");
      setPassword("");
      setAuthView("login");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordChangeMessage("");
      setProfile(null);
      return;
    }

    await supabase.auth.signOut();
    setTab("portal");
    localStorage.setItem("intral-connect-active-tab", "portal");
    setEmail("");
    setPassword("");
    setAuthView("login");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordChangeMessage("");
    setProfile(null);
  };

  const handleLoginKeyDown = (event) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  const handlePasswordChangeKeyDown = (event) => {
    if (event.key === "Enter") {
      handleRequiredPasswordChange();
    }
  };

  const isGuest = guestSession || profile?.role === "guest";

  const enforceGuestTab = (requestedTab) => {
    const allowedGuestTabs = [
      "portal",
      "jobs",
      "jobs-request-movement",
      "jobs-request-shipping",
      "jobs-request-logistics",
      "jobs-track",
    ];

    if (!isGuest) {
      setTab(requestedTab);
      return;
    }

    if (allowedGuestTabs.includes(requestedTab)) {
      setTab(requestedTab);
      return;
    }

    alert("Guest access is limited to Job Request and Track Request.");
    setTab("jobs");
  };

  const renderGuestBlockedWorkspace = () => {
    return (
      <div className="module-panel">
        <div className="module-panel-header">
          <div>
            <h1>Guest Access Limited</h1>
            <p>Guest users can submit and track requests only.</p>
          </div>

          <button className="module-home-button" onClick={() => setTab("jobs")}>
            Go to Job Request
          </button>
        </div>

        <div className="module-placeholder-card">
          <h2>Restricted Workspace</h2>
          <p>
            Receiving, Inventory, Order Central, Shipping Operations, Score Cards,
            Audit Logs, and Admin are available only to authorized INTRAL users.
          </p>
        </div>
      </div>
    );
  };

  const renderWorkspace = () => {
    if (
      isGuest &&
      ![
        "portal",
        "jobs",
        "jobs-request-movement",
        "jobs-request-shipping",
        "jobs-request-logistics",
        "jobs-track",
      ].includes(tab)
    ) {
      return renderGuestBlockedWorkspace();
    }

    if (tab === "dashboard") return <DashboardWorkspace setTab={setTab} />;
    if (tab === "scorecards") return <ScoreCardsWorkspace />;
    if (tab === "admin") return <AdminWorkspace session={session} profile={profile} />;
    if (tab === "audit") return <AuditLogsWorkspace />;

    if (tab === "receiving") return <ReceivingWorkspace receivingView="dashboard" />;
    if (tab === "receiving-create") return <ReceivingWorkspace receivingView="create" />;
    if (tab === "receiving-putaway") return <ReceivingWorkspace receivingView="putaway" />;
    if (tab === "receiving-reprint") return <ReceivingWorkspace receivingView="reprint" />;

    if (tab === "inventory") return <InventoryWorkspace inventoryView="dashboard" />;
    if (tab === "inventory-lookup") return <InventoryWorkspace inventoryView="lookup" />;
    if (tab === "inventory-move") return <InventoryWorkspace inventoryView="move" />;
    if (tab === "allocation") return <InventoryWorkspace inventoryView="allocation" />;
    if (tab === "inventory-history") return <InventoryWorkspace inventoryView="history" />;

    if (tab === "jobs") {
      return <JobRequestWorkspace requestMode="dashboard" />;
    }

    if (tab === "jobs-request-movement") {
      return <JobRequestWorkspace requestMode="movement" />;
    }

    if (tab === "jobs-request-shipping") {
      return <JobRequestWorkspace requestMode="shipping" />;
    }

    if (tab === "jobs-request-logistics") {
      return <JobRequestWorkspace requestMode="logistics" />;
    }

    if (tab === "jobs-track") {
      return <JobRequestWorkspace requestMode="track" />;
    }

    if (tab === "orders") {
      return (
        <OrderCentralWorkspace
          orderMode="dashboard"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-open") {
      return (
        <OrderCentralWorkspace
          orderMode="open"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-released") {
      return (
        <OrderCentralWorkspace
          orderMode="released"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-closed") {
      return (
        <OrderCentralWorkspace
          orderMode="closed"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-action-view") {
      return (
        <OrderCentralWorkspace
          orderMode="view"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-action-add-work") {
      return (
        <OrderCentralWorkspace
          orderMode="addWork"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-action-picklist") {
      return (
        <OrderCentralWorkspace
          orderMode="pickList"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-action-invoice") {
      return (
        <OrderCentralWorkspace
          orderMode="invoice"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "orders-action-release") {
      return (
        <OrderCentralWorkspace
          orderMode="release"
          orders={orders}
          setOrders={setOrders}
        />
      );
    }

    if (tab === "shipping-dashboard") {
      return <ShippingOperationsWorkspace orders={orders} setOrders={setOrders} />;
    }

    if (
      tab === "shipping" ||
      tab === "shipping-started" ||
      tab === "shipping-complete"
    ) {
      return <ShippingOperationsWorkspace orders={orders} setOrders={setOrders} />;
    }

    return (
      <div className="module-panel">
        <div className="module-panel-header">
          <div>
            <h1>Workspace</h1>
            <p>Operational workspace shell active.</p>
          </div>

          <button className="module-home-button" onClick={() => setTab("portal")}>
            ← Back to Home
          </button>
        </div>

        <div className="module-placeholder-card">
          <h2>Workspace Active</h2>
          <p>Enterprise navigation shell is operational.</p>
        </div>
      </div>
    );
  };

  if (!session && !guestSession) {
    return (
      <div className="workspace-portal">
        <div className="workspace-overlay">
          {authView === "forgot-password" ? (
            <ForgotPasswordWorkspace onBackToLogin={() => setAuthView("login")} />
          ) : authView === "request-credentials" ? (
            <CredentialRequestWorkspace onBackToLogin={() => setAuthView("login")} />
          ) : (
            <div className="login-panel">
              <div className="login-header">
                <h1>INTRAL CONNECT</h1>
                <p>Warehouse Operations • Logistics Visibility • Customer Portal</p>
              </div>

              <div className="login-form">
                <input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleLoginKeyDown}
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleLoginKeyDown}
                />

                <button onClick={handleLogin}>Login</button>

                <button
                  type="button"
                  onClick={() => setAuthView("forgot-password")}
                  style={{
                    background: "rgba(15, 23, 42, 0.72)",
                    border: "1px solid rgba(147, 197, 253, 0.35)",
                  }}
                >
                  Forgot Password?
                </button>

                <button
                  type="button"
                  onClick={() => setAuthView("request-credentials")}
                  style={{
                    background: "rgba(15, 23, 42, 0.72)",
                    border: "1px solid rgba(147, 197, 253, 0.35)",
                  }}
                >
                  Request Credentials
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  style={{
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                    border: "1px solid rgba(134, 239, 172, 0.45)",
                  }}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (session && !guestSession && profile?.must_change_password === true) {
    return (
      <div className="workspace-portal">
        <div className="workspace-overlay">
          <div className="login-panel">
            <div className="login-header">
              <h1>INTRAL CONNECT</h1>
              <p>Password Change Required • Temporary Password Detected</p>
            </div>

            <div className="login-form">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={handlePasswordChangeKeyDown}
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onKeyDown={handlePasswordChangeKeyDown}
              />

              <button
                onClick={handleRequiredPasswordChange}
                disabled={passwordChangeLoading}
              >
                {passwordChangeLoading ? "Updating..." : "Change Password"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "rgba(15, 23, 42, 0.72)",
                  border: "1px solid rgba(147, 197, 253, 0.35)",
                }}
              >
                Logout
              </button>

              {passwordChangeMessage && (
                <p
                  style={{
                    marginTop: "4px",
                    color:
                      passwordChangeMessage.includes("failed") ||
                      passwordChangeMessage.includes("required") ||
                      passwordChangeMessage.includes("match") ||
                      passwordChangeMessage.includes("not found")
                        ? "#fecaca"
                        : "#dbeafe",
                    fontWeight: 800,
                    lineHeight: 1.45,
                  }}
                >
                  {passwordChangeMessage}
                </p>
              )}

              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  marginTop: "4px",
                }}
              >
                Your account was created with a temporary password. Create a new
                password before entering INTRAL CONNECT.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkspacePortal
      setTab={isGuest ? enforceGuestTab : setTab}
      tab={tab}
      profile={profile}
      liveTime={liveTime}
      currentDate={currentDate}
      userEmail={guestSession ? "guest@intral.local" : session?.user?.email}
      handleLogout={handleLogout}
      operationalNotifications={isGuest ? [] : operationalNotifications}
    >
      {renderWorkspace()}
    </WorkspacePortal>
  );
}

export default App;
