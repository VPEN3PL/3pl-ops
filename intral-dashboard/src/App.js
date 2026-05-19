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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tab, setTab] = useState(() => {
    return localStorage.getItem("intral-connect-active-tab") || "portal";
  });

  const [orders, setOrders] = useState(initialOperationalOrders);

  const [liveTime, setLiveTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    localStorage.setItem("intral-connect-active-tab", tab);
  }, [tab]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTab("portal");
    localStorage.setItem("intral-connect-active-tab", "portal");
    setEmail("");
    setPassword("");
    setProfile(null);
  };

  const renderWorkspace = () => {
    if (tab === "dashboard") return <DashboardWorkspace />;

    if (tab === "receiving") return <ReceivingWorkspace receivingView="dashboard" />;
    if (tab === "receiving-inbound") return <ReceivingWorkspace receivingView="inbound" />;
    if (tab === "receiving-putaway") return <ReceivingWorkspace receivingView="putaway" />;
    if (tab === "receiving-reprint") return <ReceivingWorkspace receivingView="reprint" />;
    if (tab === "receiving-dock") return <ReceivingWorkspace receivingView="dock" />;

    if (tab === "inventory") return <InventoryWorkspace inventoryView="dashboard" />;
    if (tab === "inventory-lookup") return <InventoryWorkspace inventoryView="lookup" />;
    if (tab === "inventory-move") return <InventoryWorkspace inventoryView="move" />;
    if (tab === "allocation") return <InventoryWorkspace inventoryView="allocation" />;
    if (tab === "inventory-history") return <InventoryWorkspace inventoryView="history" />;

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

    if (tab === "orders-action-release") {
      return (
        <OrderCentralWorkspace
          orderMode="release"
          orders={orders}
          setOrders={setOrders}
        />
      );
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

  if (!session) {
    return (
      <div className="workspace-portal">
        <div className="workspace-overlay">
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
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button onClick={handleLogin}>Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkspacePortal
      setTab={setTab}
      tab={tab}
      profile={profile}
      liveTime={liveTime}
      currentDate={currentDate}
      userEmail={session?.user?.email}
      handleLogout={handleLogout}
    >
      {renderWorkspace()}
    </WorkspacePortal>
  );
}

export default App;
