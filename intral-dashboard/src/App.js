import React, { useEffect, useState } from "react";
import "./App.css";

import { supabase } from "./supabaseClient";
import WorkspacePortal from "./components/WorkspacePortal";

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

  const getModuleTitle = () => {
    const names = {
      dashboard: "Dashboard",
      receiving: "Receiving",
      inventory: "Inventory",
      jobs: "Job Request",
      orders: "Order Central",
      scorecards: "Score Cards",
      audit: "Audit Logs",
      admin: "Admin Menu",
    };

    return names[tab] || "Workspace";
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
      <div className="module-panel">
        <div className="module-panel-header">
          <div>
            <h1>{getModuleTitle()}</h1>
            <p>
              This workspace will connect to the existing INTRAL CONNECT module
              during the next layout integration step.
            </p>
          </div>

          <button className="module-home-button" onClick={() => setTab("portal")}>
            ← Back to Home
          </button>
        </div>

        <div className="module-placeholder-card">
          <h2>{getModuleTitle()} Workspace</h2>
          <p>
            Layout shell is active. Background, logo, and navigation remain fixed
            while moving between modules.
          </p>
        </div>
      </div>
    </WorkspacePortal>
  );
}

export default App;