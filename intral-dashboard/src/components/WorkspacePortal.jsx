import React from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  ShoppingCart,
  ShieldCheck,
  Settings,
  BarChart3,
  Home,
  LogOut,
} from "lucide-react";

import logo from "../assets/intral-logo.jpg";

function WorkspacePortal({
  setTab,
  tab,
  profile,
  liveTime,
  currentDate,
  userEmail,
  handleLogout,
  children,
}) {
  const role = String(profile?.role || "").toLowerCase();

  const cards = [
    {
      key: "dashboard",
      title: "Dashboard",
      subtitle: "Executive operational visibility and KPI overview",
      icon: <LayoutDashboard size={38} />,
      allowed: true,
    },
    {
      key: "receiving",
      title: "Receiving",
      subtitle: "Inbound receiving and staging operations",
      icon: <Truck size={38} />,
      allowed: role !== "customer",
    },
    {
      key: "inventory",
      title: "Inventory",
      subtitle: "Inventory visibility, movement, and allocation",
      icon: <Package size={38} />,
      allowed: true,
    },
    {
      key: "jobs",
      title: "Job Request",
      subtitle: "Operational requests and workflow tracking",
      icon: <ClipboardList size={38} />,
      allowed: true,
    },
    {
      key: "orders",
      title: "Order Central",
      subtitle: "Customer orders and fulfillment operations",
      icon: <ShoppingCart size={38} />,
      allowed: true,
    },
    {
      key: "scorecards",
      title: "Score Cards",
      subtitle: "Balanced scorecards and KPI analytics",
      icon: <BarChart3 size={38} />,
      allowed: role === "admin" || role === "manager",
    },
    {
      key: "audit",
      title: "Audit Logs",
      subtitle: "Operational history and security logs",
      icon: <ShieldCheck size={38} />,
      allowed: role === "admin" || role === "manager",
    },
    {
      key: "admin",
      title: "Admin Menu",
      subtitle: "User management and system controls",
      icon: <Settings size={38} />,
      allowed: role === "admin",
    },
  ];

  return (
    <div className="workspace-portal">
      <div className="workspace-overlay">
        <header className="workspace-header">
          <img src={logo} alt="INTRAL Logo" className="workspace-logo" />

          <div>
            <h1>INTRAL CONNECT</h1>
            <p>Warehouse Operations • Logistics Visibility • Customer Portal</p>
          </div>
        </header>

        <nav className="workspace-topbar">
          <div className="workspace-topbar-left">
            <button className="topbar-button" onClick={() => setTab("portal")}>
              <Home size={18} />
              Home
            </button>
          </div>

          <div className="workspace-topbar-center">
            <strong>{currentDate}</strong>
            <span>{liveTime}</span>
          </div>

          <div className="workspace-topbar-right">
            <div className="workspace-user">
              <strong>{String(profile?.role || "USER").toUpperCase()}</strong>
              <span>{userEmail || "No Email"}</span>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </nav>

        {tab === "portal" ? (
          <section className="workspace-grid">
            {cards
              .filter((card) => card.allowed)
              .map((card) => (
                <button
                  key={card.key}
                  className="workspace-card"
                  onClick={() => setTab(card.key)}
                >
                  <div className="workspace-icon">{card.icon}</div>
                  <h2>{card.title}</h2>
                  <p>{card.subtitle}</p>
                </button>
              ))}
          </section>
        ) : (
          <section className="workspace-module">{children}</section>
        )}
      </div>
    </div>
  );
}

export default WorkspacePortal;