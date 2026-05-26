import React, { useMemo, useState } from "react";
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
  ChevronDown,
  Ship,
  Star,
  Bell,
  Search,
  FileText,
  UserCircle,
} from "lucide-react";

import logo from "../assets/intral-logo.jpg";

import {
  moduleActions,
  getModuleKeyFromTab,
} from "../config/moduleActions";

const moduleLabels = {
  receiving: "Receiving",
  inventory: "Inventory",
  jobs: "Job Request",
  orders: "Order Central",
  shipping: "Shipping Operations",
};

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
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState("");
  const [quickSearch, setQuickSearch] = useState("");

  const role = String(profile?.role || "").toLowerCase();

  const cards = [
    {
      key: "dashboard",
      title: "Dashboard",
      subtitle: "Executive operational visibility and KPI overview",
      icon: <LayoutDashboard size={18} />,
      allowed: true,
      keywords: "dashboard kpi command center executive",
    },
    {
      key: "receiving",
      title: "Receiving",
      subtitle: "Inbound receiving and staging operations",
      icon: <Truck size={18} />,
      allowed: role !== "customer",
      keywords: "receiving inbound receipt putaway reprint label",
    },
    {
      key: "inventory",
      title: "Inventory",
      subtitle: "Inventory visibility, movement, and allocation",
      icon: <Package size={18} />,
      allowed: true,
      keywords: "inventory lookup move allocation transfer history",
    },
    {
      key: "jobs",
      title: "Job Request",
      subtitle: "Operational requests and workflow tracking",
      icon: <ClipboardList size={18} />,
      allowed: true,
      keywords: "job request movement shipping logistics track",
    },
    {
      key: "orders",
      title: "Order Central",
      subtitle: "Operational review and order release control",
      icon: <ShoppingCart size={18} />,
      allowed: true,
      keywords: "order central open active closed release additional work",
    },
    {
      key: "shipping",
      title: "Shipping Operations",
      subtitle: "Released order execution and outbound operations",
      icon: <Ship size={18} />,
      allowed: true,
      keywords: "shipping active started completed so orders",
    },
    {
      key: "scorecards",
      title: "Score Cards",
      subtitle: "Balanced scorecards and KPI analytics",
      icon: <BarChart3 size={18} />,
      allowed: role === "admin" || role === "manager",
      keywords: "score cards kpi analytics",
    },
    {
      key: "audit",
      title: "Audit Logs",
      subtitle: "Operational history and security logs",
      icon: <ShieldCheck size={18} />,
      allowed: role === "admin" || role === "manager",
      keywords: "audit logs history security",
    },
    {
      key: "admin",
      title: "Admin Menu",
      subtitle: "User management and system controls",
      icon: <Settings size={18} />,
      allowed: role === "admin",
      keywords: "admin user management settings",
    },
  ];

  const operations = cards.filter((card) => card.allowed);
  const moduleKey = getModuleKeyFromTab(tab);
  const currentActions = moduleKey ? moduleActions[moduleKey] : [];

  const allModuleActions = useMemo(() => {
    return Object.entries(moduleActions).flatMap(([moduleName, actions]) =>
      actions.flatMap((action) => {
        if (action.dropdown) {
          return action.items.map((item) => ({
            label: item.label,
            tab: item.tab,
            moduleName,
            groupLabel: action.label,
            keywords: `${item.label} ${action.label} ${moduleName}`,
          }));
        }

        return [
          {
            label: action.label,
            tab: action.tab,
            moduleName,
            groupLabel: "Dashboard",
            keywords: `${action.label} ${moduleName}`,
          },
        ];
      })
    );
  }, []);

  const defaultFavoriteTabs = [
    "receiving-putaway",
    "inventory-lookup",
    "inventory-move",
    "orders-action-release",
    "shipping",
    "jobs-track",
  ];

  const [favoriteTabs, setFavoriteTabs] = useState(() => {
    try {
      const saved = localStorage.getItem("intral-connect-favorites");
      return saved ? JSON.parse(saved) : defaultFavoriteTabs;
    } catch (error) {
      return defaultFavoriteTabs;
    }
  });

  const favoriteActions = useMemo(() => {
    return favoriteTabs
      .map((favoriteTab) =>
        allModuleActions.find((action) => action.tab === favoriteTab)
      )
      .filter(Boolean);
  }, [favoriteTabs, allModuleActions]);

  const searchResults = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();

    if (!query) return [];

    const moduleResults = operations
      .filter((item) => {
        const text = `${item.title} ${item.subtitle} ${item.key} ${
          item.keywords || ""
        }`.toLowerCase();
        return text.includes(query);
      })
      .map((item) => ({
        type: "Module",
        label: item.title,
        subtitle: item.subtitle,
        tab: item.key,
      }));

    const functionResults = allModuleActions
      .filter((item) => {
        const text = `${item.label} ${item.groupLabel} ${item.moduleName} ${
          item.keywords || ""
        }`.toLowerCase();
        return text.includes(query);
      })
      .slice(0, 8)
      .map((item) => ({
        type: "Function",
        label: item.label,
        subtitle: `${moduleLabels[item.moduleName] || item.moduleName} • ${
          item.groupLabel
        }`,
        tab: item.tab,
      }));

    return [...moduleResults, ...functionResults].slice(0, 10);
  }, [quickSearch, operations, allModuleActions]);

  const notifications = [
    {
      title: "New Job Requests",
      detail:
        "Notifications will connect to live request alerts in the next Supabase phase.",
      tab: "jobs",
    },
    {
      title: "Aging Work > 24 Hours",
      detail: "Use Dashboard to review open work aging and manager action queue.",
      tab: "dashboard",
    },
  ];

  const saveFavorites = (nextFavorites) => {
    setFavoriteTabs(nextFavorites);
    localStorage.setItem(
      "intral-connect-favorites",
      JSON.stringify(nextFavorites)
    );
  };

  const toggleFavorite = (favoriteTab) => {
    if (!favoriteTab) return;

    const nextFavorites = favoriteTabs.includes(favoriteTab)
      ? favoriteTabs.filter((item) => item !== favoriteTab)
      : [...favoriteTabs, favoriteTab];

    saveFavorites(nextFavorites);
  };

  const isFavorite = (favoriteTab) => favoriteTabs.includes(favoriteTab);

  const goToTab = (key) => {
    setFavoritesOpen(false);
    setNotificationOpen(false);
    setActionCenterOpen(false);
    setUserMenuOpen(false);
    setActionDropdownOpen("");
    setQuickSearch("");
    setTab(key);
  };

  const isActionActive = (action) => {
    if (action.tab && tab === action.tab) {
      return true;
    }

    if (action.items) {
      return action.items.some((item) => item.tab === tab);
    }

    return false;
  };

  const renderFavoriteStar = (favoriteTab, label) => {
    if (!favoriteTab) return null;

    return (
      <button
        type="button"
        className={
          isFavorite(favoriteTab)
            ? "favorite-star-button active"
            : "favorite-star-button"
        }
        title={`${isFavorite(favoriteTab) ? "Remove" : "Add"} ${label} favorite`}
        onClick={(event) => {
          event.stopPropagation();
          toggleFavorite(favoriteTab);
        }}
      >
        <Star size={13} />
      </button>
    );
  };

  return (
    <div className="workspace-portal">
      <div className="workspace-overlay oracle-layout-overlay">
        <header className="oracle-top-command-bar">
          <div className="oracle-top-left">
            <img src={logo} alt="INTRAL Logo" className="oracle-top-logo" />

            <div className="oracle-brand-text">
              <strong>INTRAL CONNECT</strong>
              <span>
                {currentDate || "Date"} • {liveTime || "Time"}
              </span>
            </div>
          </div>

          <div className="oracle-quick-search">
            <Search size={16} />

            <input
              value={quickSearch}
              onChange={(event) => setQuickSearch(event.target.value)}
              placeholder="Search modules, functions, jobs, inventory..."
            />

            {searchResults.length > 0 && (
              <div className="oracle-search-results">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.tab}-${result.label}`}
                    onClick={() => goToTab(result.tab)}
                  >
                    <span>{result.type}</span>
                    <strong>{result.label}</strong>
                    <small>{result.subtitle}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="oracle-top-icons">
            <button
              className={
                tab === "portal" ? "oracle-icon-button active" : "oracle-icon-button"
              }
              title="Home"
              onClick={() => goToTab("portal")}
            >
              <Home size={18} />
            </button>

            <div className="oracle-icon-menu">
              <button
                className="oracle-icon-button"
                title="Favorites"
                onClick={() => {
                  setFavoritesOpen((open) => !open);
                  setNotificationOpen(false);
                  setActionCenterOpen(false);
                  setUserMenuOpen(false);
                }}
              >
                <Star size={18} />
              </button>

              {favoritesOpen && (
                <div className="oracle-dropdown oracle-favorites-dropdown">
                  <div className="oracle-dropdown-header">
                    <strong>Favorites</strong>
                    <small>
                      Use star icons beside module functions to customize.
                    </small>
                  </div>

                  {favoriteActions.length === 0 ? (
                    <p className="oracle-empty-message">No favorites selected.</p>
                  ) : (
                    favoriteActions.map((item) => (
                      <button
                        key={item.tab}
                        className={tab === item.tab ? "active" : ""}
                        onClick={() => goToTab(item.tab)}
                      >
                        <strong>{item.label}</strong>
                        <small>
                          {moduleLabels[item.moduleName] || item.moduleName}
                          {item.groupLabel ? ` • ${item.groupLabel}` : ""}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="oracle-icon-menu">
              <button
                className="oracle-icon-button"
                title="New Job Request Notifications"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setFavoritesOpen(false);
                  setActionCenterOpen(false);
                  setUserMenuOpen(false);
                }}
              >
                <Bell size={18} />
              </button>

              {notificationOpen && (
                <div className="oracle-dropdown oracle-notification-dropdown">
                  <div className="oracle-dropdown-header">
                    <strong>Notifications</strong>
                    <small>Job request and operational alerts.</small>
                  </div>

                  {notifications.map((item) => (
                    <button key={item.title} onClick={() => goToTab(item.tab)}>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="oracle-icon-menu">
              <button
                className="oracle-icon-button"
                title="Operations Action Center"
                onClick={() => {
                  setActionCenterOpen((open) => !open);
                  setFavoritesOpen(false);
                  setNotificationOpen(false);
                  setUserMenuOpen(false);
                }}
              >
                <FileText size={18} />
              </button>

              {actionCenterOpen && (
                <div className="oracle-dropdown oracle-action-dropdown">
                  <div className="oracle-dropdown-header">
                    <strong>Operations Actions</strong>
                    <small>
                      Quick access to module dashboards and action screens.
                    </small>
                  </div>

                  {operations.map((item) => (
                    <button
                      key={item.key}
                      className={tab === item.key ? "active" : ""}
                      onClick={() => goToTab(item.key)}
                    >
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="oracle-user-menu">
              <button
                className="oracle-user-button"
                onClick={() => {
                  setUserMenuOpen((open) => !open);
                  setFavoritesOpen(false);
                  setNotificationOpen(false);
                  setActionCenterOpen(false);
                }}
              >
                <UserCircle size={18} />
                <span>{userEmail || String(profile?.role || "User")}</span>
                <ChevronDown size={14} />
              </button>

              {userMenuOpen && (
                <div className="oracle-dropdown oracle-user-dropdown">
                  <div className="oracle-dropdown-header">
                    <strong>{String(profile?.role || "USER").toUpperCase()}</strong>
                    <small>{userEmail || "No Email"}</small>
                  </div>

                  <button onClick={handleLogout}>
                    <LogOut size={15} />
                    <strong>Logout</strong>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {moduleKey && (
          <nav className="oracle-module-command-row">
            <div className="oracle-module-label">
              <span>Module</span>
              <strong>{moduleLabels[moduleKey]}</strong>
            </div>

            <div className="oracle-module-actions">
              {currentActions.map((action) => {
                if (action.dropdown) {
                  return (
                    <div
                      key={action.label}
                      className="module-action-menu oracle-module-action-menu"
                    >
                      <button
                        className={
                          isActionActive(action)
                            ? "topbar-button active-topbar-button"
                            : "topbar-button"
                        }
                        onClick={() =>
                          setActionDropdownOpen((open) =>
                            open === action.label ? "" : action.label
                          )
                        }
                      >
                        {action.label}
                        <ChevronDown size={15} />
                      </button>

                      {actionDropdownOpen === action.label && (
                        <div className="module-action-dropdown oracle-module-dropdown">
                          {action.items.map((item) => (
                            <button
                              key={item.tab}
                              className={tab === item.tab ? "active" : ""}
                              onClick={() => goToTab(item.tab)}
                            >
                              <span>{item.label}</span>
                              {renderFavoriteStar(item.tab, item.label)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={action.tab} className="oracle-inline-action">
                    <button
                      className={
                        tab === action.tab
                          ? "topbar-button active-topbar-button"
                          : "topbar-button"
                      }
                      onClick={() => goToTab(action.tab)}
                    >
                      {action.label}
                    </button>

                    {renderFavoriteStar(action.tab, action.label)}
                  </div>
                );
              })}
            </div>
          </nav>
        )}

        {tab === "portal" ? (
          <section className="workspace-grid oracle-home-grid">
            {cards
              .filter((card) => card.allowed)
              .map((card) => (
                <button
                  key={card.key}
                  className="workspace-card"
                  onClick={() => goToTab(card.key)}
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
