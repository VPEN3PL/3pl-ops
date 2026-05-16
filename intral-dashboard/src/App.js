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

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("portal");
  const [liveTime, setLiveTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

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

    if (
      tab === "orders" ||
      tab === "orders-open" ||
      tab === "orders-active" ||
      tab === "orders-closed" ||
      tab === "orders-release"
    ) {
      return <OrderCentralWorkspace />;
    }

    if (
      tab === "shipping" ||
      tab === "shipping-started" ||
      tab === "shipping-complete"
    ) {
      return <ShippingOperationsWorkspace />;
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
