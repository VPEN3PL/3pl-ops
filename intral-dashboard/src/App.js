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
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const [tab, setTab] = useState(() => {
    return localStorage.getItem("intral-connect-active-tab") || "portal";
  });

  const [orders, setOrders] = useState([]);
  const [operationalNotifications, setOperationalNotifications] = useState([]);
  const [deepLinkTarget, setDeepLinkTarget] = useState(null);

  const [liveTime, setLiveTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    localStorage.setItem("intral-connect-active-tab", tab);
  }, [tab]);

  useEffect(() => {
    const now = new Date();

    const alerts = [];

    orders.forEach((order) => {
      const normalizedStatus = String(
        order?.releaseStatus ||
          order?.status ||
          order?.workflowStatus ||
          ""
      ).toLowerCase();

      const isClosedOrComplete =
        normalizedStatus === "closed" ||
        normalizedStatus === "shipped" ||
        normalizedStatus === "complete" ||
        normalizedStatus === "completed" ||
        normalizedStatus === "order complete" ||
        Boolean(order?.completedAt) ||
        Boolean(order?.closedAt);

      if (isClosedOrComplete) {
        return;
      }

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
          targetType: "order",
          targetId: order.joNumber,
          jobNumber: order.joNumber,
          severity: order.priority === "High" ? "high" : "normal",
        });
      }

      if (order.releaseStatus === "Active") {
        alerts.push({
          id: `${order.joNumber}-active`,
          title: "Shipping Ready for Execution",
          detail: `${order.soNumber || order.joNumber} is active and ready for Shipping Operations.`,
          tab: "shipping",
          targetType: "shipping",
          targetId: order.soNumber || order.joNumber,
          soNumber: order.soNumber || "",
          jobNumber: order.joNumber,
          severity: "normal",
        });
      }

      if (order.releaseStatus === "Open" && ageHours >= 24) {
        alerts.push({
          id: `${order.joNumber}-aging`,
          title: "Aging Work > 24 Hours",
          detail: `${order.joNumber} has been open for approximately ${ageHours} hours.`,
          tab: "orders-open",
          targetType: "order",
          targetId: order.joNumber,
          jobNumber: order.joNumber,
          severity: "high",
        });
      }

      if (
        order.releaseStatus === "Open" &&
        order.allocationRequired &&
        !order.allocationConfirmed
      ) {
        alerts.push({
          id: `${order.joNumber}-allocation`,
          title: "Allocation Pending",
          detail: `${order.joNumber} requires inventory allocation confirmation.`,
          tab: "orders-open",
          targetType: "order",
          targetId: order.joNumber,
          jobNumber: order.joNumber,
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryMode(true);
        setRecoveryMessage("Password recovery verified. Please create a new password.");
        setTab("portal");
        localStorage.setItem("intral-connect-active-tab", "portal");
      }

      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setPasswordRecoveryMode(false);
        setRecoveryPassword("");
        setConfirmRecoveryPassword("");
        setRecoveryMessage("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
  loadSupabaseJobs();
// eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getShippingWorkflowFromJob = (job) => {
    const directWorkflow = String(
      job?.shipping_workflow ||
        job?.shipping_type ||
        job?.shippingWorkflow ||
        job?.shippingType ||
        ""
    )
      .trim()
      .toLowerCase();

    if (directWorkflow) return directWorkflow;

    const notes = String(job?.notes || "");
    const match = notes.match(/Shipping Workflow:\s*([^\n]+)/i);

    return match ? match[1].trim().toLowerCase() : "";
  };

  const dedupeTextLines = (value) => {
    const seen = new Set();

    return String(value || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => {
        const key = line.replace(/\s+/g, " ").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const cleanJobNotes = (value) => dedupeTextLines(value).join("\n");

  const mapSupabaseJobToOperationalOrder = (job) => {
    const rawStatus = String(job?.status || "").trim();

    const normalizedStatus = rawStatus.toLowerCase();

    const releaseStatus =
      normalizedStatus.includes("closed") ||
      normalizedStatus.includes("complete") ||
      normalizedStatus.includes("shipped")
        ? "Closed"
        : normalizedStatus.includes("started") ||
          normalizedStatus.includes("in progress") ||
          normalizedStatus.includes("executing")
        ? "Started"
        : normalizedStatus.includes("active") ||
          normalizedStatus.includes("released") ||
          normalizedStatus.includes("shipping")
        ? "Active"
        : "Open";

    const createdDate = job?.created_at ? new Date(job.created_at) : null;
    const cleanNotes = cleanJobNotes(job?.notes || "");

    return {
      dbId: job?.id,
      joNumber: job?.job_number || `JO-${String(job?.id || "").slice(0, 6)}`,
      requestor: job?.requestor_name || "Requestor",
      jobType: job?.request_category || job?.job_type || "Work Request",
      details: cleanNotes,
      allocationRequired:
        String(job?.request_category || "").toLowerCase() === "movement",
      allocationConfirmed: false,
      releaseStatus,
      reviewStatus: rawStatus || "Pending Internal Review",
      soNumber:
        releaseStatus === "Active" ||
        releaseStatus === "Started" ||
        releaseStatus === "Closed"
          ? `SO-${job?.job_number || ""}`
          : "",
      priority: "Normal",
      requestedDate: createdDate
        ? createdDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      customer: job?.ship_to_company || job?.ship_from_company || "Customer",
      shipTo: job?.location || job?.ship_to_company || "Pending",
      additionalWork: [],
      stagingLocation: "",
      originalLocation: "",
      startedAt: job?.start_time || "",
      startedAtIso: job?.start_time || "",
      completedAt: job?.complete_time || "",
      completedAtIso: job?.complete_time || "",
      closedAt: job?.complete_time || "",
      closedAtIso: job?.complete_time || "",
      pieces: "1",
      weight: "TBD",
      dimensions: "TBD",
      finalDestination: job?.location || job?.ship_to_company || "Pending",
      additionalDetails: "",
      chargeNumber: job?.charge_number || "",
      chargeCode: job?.charge_code || job?.charge_number || "",
      chargeable: Boolean(job?.chargeable),
      requestSource: job?.request_source || "Internal Request",
      requestorEmail: job?.requestor_email || "",
      shippingWorkflow: getShippingWorkflowFromJob(job),
      shippingType: getShippingWorkflowFromJob(job),
      location: job?.location || "",
      inventoryDetails: null,
    };
  };

  const loadSupabaseJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Unable to load live jobs:", error.message);
      return;
    }

    setOrders((data || []).map(mapSupabaseJobToOperationalOrder));
  };

  const extractJobNumberValue = (jobNumber) => {
    const match = String(jobNumber || "").match(/^JO-(\d+)$/i);

    if (!match) return 0;

    return Number(match[1]) || 0;
  };

  const getNextJobNumber = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("job_number");

    if (error) {
      throw new Error(`Unable to generate next JO number: ${error.message}`);
    }

    const highestDatabaseNumber = (data || []).reduce((highest, job) => {
      return Math.max(highest, extractJobNumberValue(job.job_number));
    }, 99);

    const highestLoadedNumber = orders.reduce((highest, order) => {
      return Math.max(highest, extractJobNumberValue(order.joNumber));
    }, 99);

    const nextNumber = Math.max(highestDatabaseNumber, highestLoadedNumber) + 1;

    return `JO-${String(nextNumber).padStart(6, "0")}`;
  };

  const handleCreateJobRequest = async (requestPayload) => {
    let generatedJobNumber = "";

    try {
      generatedJobNumber = await getNextJobNumber();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    const requestTitle = String(requestPayload?.requestTitle || "Work Request").trim();
    const requestCategory = String(requestPayload?.requestMode || "work-request").trim();
    const requestor = requestPayload?.requestorForm || {};
    const movement = requestPayload?.movementForm || {};
    const shipping = requestPayload?.shippingForm || {};
    const logistics = requestPayload?.logisticsForm || {};
    const selectedInventory = requestPayload?.selectedInventory || null;
    const shippingWorkflow = requestPayload?.shippingType || "";
    const requestSource = isGuest ? "Guest Portal" : "Internal Request";
    const fallbackRequestorName = String(
      requestor.requestorName ||
        profile?.name ||
        profile?.full_name ||
        profile?.display_name ||
        session?.user?.email ||
        "Internal User"
    ).trim();
    const fallbackRequestorEmail = String(
      requestor.email || (!isGuest ? session?.user?.email || "" : "")
    ).trim();

    const detailLines = [
      `Request Type: ${requestTitle}`,
      requestCategory === "shipping" && shippingWorkflow
        ? `Shipping Workflow: ${shippingWorkflow}`
        : "",
      requestCategory === "movement"
        ? `Inventory ID: ${movement.inventoryId || ""}`
        : "",
      requestCategory === "movement"
        ? `Move Qty: ${movement.moveQty || ""}`
        : "",
      requestCategory === "movement"
        ? `Move To: ${movement.toLocation || ""}`
        : "",
      requestCategory === "movement"
        ? `Move Reason: ${movement.reason || ""}`
        : "",
      selectedInventory
        ? `Selected Inventory: ${selectedInventory.id || ""} | ${selectedInventory.partNumber || ""} | ${selectedInventory.location || ""}`
        : "",
      requestCategory === "shipping"
        ? `PCS: ${shipping.pcs || ""}`
        : "",
      requestCategory === "shipping"
        ? `Ship From: ${shipping.shipFromCompany || ""} | Address: ${shipping.shipFromAddress || ""} | City: ${shipping.shipFromStreet || ""} | State: ${shipping.shipFromState || ""} | Zip: ${shipping.shipFromZip || ""} | Country: ${shipping.shipFromCountry || ""}`
        : "",
      requestCategory === "shipping" && shippingWorkflow === "am-crating"
        ? `A&M Stored Address: ${shipping.amStoredAddress || ""}`
        : "",
      requestCategory === "shipping"
        ? `Ship To: ${shipping.shipToCompany || ""} | Address: ${shipping.shipToAddress || ""} | City: ${shipping.shipToStreet || ""} | State: ${shipping.shipToState || ""} | Zip: ${shipping.shipToZip || ""} | Country: ${shipping.shipToCountry || ""}`
        : "",
      requestCategory === "shipping"
        ? `Ship To Contact: ${shipping.shipToContactName || ""} | ${shipping.shipToTelephone || ""} | ${shipping.shipToEmail || ""}`
        : "",
      requestCategory === "logistics"
        ? `Support Type: ${logistics.supportType || ""}`
        : "",
      requestCategory === "logistics"
        ? `Current Location: ${logistics.currentLocation || ""}`
        : "",
      requestCategory === "logistics"
        ? `Support Destination: ${logistics.supportDestination || ""}`
        : "",
      requestCategory === "logistics"
        ? `Equipment / Labor Needed: ${logistics.equipmentNeeded || ""}`
        : "",
      requestCategory === "logistics"
        ? `Due Date: ${logistics.dueDate || ""}`
        : "",
      requestCategory === "logistics"
        ? `Logistics Notes: ${logistics.notes || ""}`
        : "",
      requestPayload?.additionalDetails
        ? `Additional Details: ${requestPayload.additionalDetails}`
        : "",
    ].filter(Boolean);

    const insertPayload = {
      job_number: generatedJobNumber,
      status: "Pending Internal Review",
      request_category: requestCategory,
      job_type: requestTitle,
      requestor_name: fallbackRequestorName,
      requestor_email: fallbackRequestorEmail,
      charge_number: String(requestor.chargeNumber || "").trim(),
      charge_code: String(requestor.chargeType || "").trim(),
      chargeable: Boolean(String(requestor.chargeNumber || "").trim()),
      request_source: requestSource,
      ship_from_company:
        requestCategory === "shipping"
          ? String(shipping.shipFromCompany || "").trim()
          : String(requestor.companyName || "").trim(),
      ship_to_company:
        requestCategory === "shipping"
          ? String(shipping.shipToCompany || "").trim()
          : String(requestor.companyName || "").trim(),
      location:
        requestCategory === "movement"
          ? String(movement.toLocation || "").trim()
          : requestCategory === "shipping"
          ? String(shipping.shipToCompany || shipping.shipToAddress || "").trim()
          : String(logistics.supportDestination || logistics.currentLocation || "").trim(),
      notes: dedupeTextLines(detailLines.join("\n")).join("\n"),
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    await loadSupabaseJobs();

    return {
      success: true,
      jobNumber: data?.job_number || generatedJobNumber,
      data,
    };
  };

  const handleRecoveryPasswordReset = async () => {
    setRecoveryMessage("");

    if (!recoveryPassword.trim()) {
      setRecoveryMessage("New password is required.");
      return;
    }

    if (recoveryPassword.length < 8) {
      setRecoveryMessage("New password must be at least 8 characters.");
      return;
    }

    if (recoveryPassword !== confirmRecoveryPassword) {
      setRecoveryMessage("New password and confirmation do not match.");
      return;
    }

    if (!session?.user?.id) {
      setRecoveryMessage("Recovery session not found. Please request a new password reset link.");
      return;
    }

    setRecoveryLoading(true);
    setRecoveryMessage("Updating password...");

    const { error: passwordError } = await supabase.auth.updateUser({
      password: recoveryPassword,
    });

    if (passwordError) {
      setRecoveryMessage(`Password reset failed: ${passwordError.message}`);
      setRecoveryLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        must_change_password: false,
      })
      .eq("id", session.user.id);

    setRecoveryPassword("");
    setConfirmRecoveryPassword("");
    setPasswordRecoveryMode(false);
    setRecoveryMessage("Password reset successfully. Loading workspace...");

    await loadProfile(session.user.id);

    setRecoveryLoading(false);
  };

  const handleRecoveryKeyDown = (event) => {
    if (event.key === "Enter") {
      handleRecoveryPasswordReset();
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
      setPasswordRecoveryMode(false);
      setRecoveryPassword("");
      setConfirmRecoveryPassword("");
      setRecoveryMessage("");
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
    setPasswordRecoveryMode(false);
    setRecoveryPassword("");
    setConfirmRecoveryPassword("");
    setRecoveryMessage("");
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



  const updateOperationalOrderStatus = async (targetOrder, status, extraFields = {}) => {
    if (!targetOrder) {
      return { success: false, error: "Missing order details." };
    }

    const nowIso = new Date().toISOString();
    const nextOrderFields = {
      releaseStatus: status,
      reviewStatus: status === "Closed" ? "Closed" : targetOrder.reviewStatus,
      ...extraFields,
    };

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.joNumber === targetOrder.joNumber ||
        order.soNumber === targetOrder.soNumber ||
        (targetOrder.dbId && order.dbId === targetOrder.dbId)
          ? {
              ...order,
              ...nextOrderFields,
            }
          : order
      )
    );

    const databaseStatus = status;
    const updatePayload = {
      status: databaseStatus,
    };

    if (status === "Started") {
      updatePayload.start_time = extraFields.startedAtIso || nowIso;
    }

    if (status === "Closed") {
      updatePayload.complete_time = extraFields.completedAtIso || nowIso;
    }

    let query = supabase.from("jobs").update(updatePayload);

    if (targetOrder.dbId) {
      query = query.eq("id", targetOrder.dbId);
    } else if (targetOrder.joNumber) {
      query = query.eq("job_number", targetOrder.joNumber);
    } else {
      return { success: true };
    }

    const { error } = await query;

    if (error) {
      console.warn("Unable to persist operational status update:", error.message);
      setOperationalNotifications((current) => [
        {
          id: `status-update-${targetOrder.joNumber || targetOrder.soNumber || Date.now()}`,
          title: "Status Update Not Saved",
          detail: error.message,
          tab: "shipping",
          severity: "high",
        },
        ...current,
      ].slice(0, 12));

      return { success: false, error: error.message };
    }

    await loadSupabaseJobs();

    return { success: true };
  };
  const handleNotificationDeepLink = (target) => {
    if (!target) return;

    const nextTarget = {
      ...target,
      deepLinkId: `${target.id || target.targetId || target.targetType || "notification"}-${Date.now()}`,
    };

    setDeepLinkTarget(nextTarget);

    if (target.tab) {
      setTab(target.tab);
    }
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

    if (tab === "receiving") return <ReceivingWorkspace receivingView="dashboard" deepLinkTarget={deepLinkTarget} />;
    if (tab === "receiving-create") return <ReceivingWorkspace receivingView="create" deepLinkTarget={deepLinkTarget} />;
    if (tab === "receiving-putaway") return <ReceivingWorkspace receivingView="putaway" deepLinkTarget={deepLinkTarget} />;
    if (tab === "receiving-reprint") return <ReceivingWorkspace receivingView="reprint" deepLinkTarget={deepLinkTarget} />;

    if (tab === "inventory") return <InventoryWorkspace inventoryView="dashboard" />;
    if (tab === "inventory-lookup") return <InventoryWorkspace inventoryView="lookup" />;
    if (tab === "inventory-move") return <InventoryWorkspace inventoryView="move" />;
    if (tab === "allocation") return <InventoryWorkspace inventoryView="allocation" />;
    if (tab === "inventory-history") return <InventoryWorkspace inventoryView="history" />;

    if (tab === "jobs") {
      return <JobRequestWorkspace requestMode="dashboard" isGuest={isGuest} />;
    }

    if (tab === "jobs-request-movement") {
      return <JobRequestWorkspace requestMode="movement" onCreateJobRequest={handleCreateJobRequest} isGuest={isGuest} onAfterSubmit={() => setTab("jobs")} />;
    }

    if (tab === "jobs-request-shipping") {
      return <JobRequestWorkspace requestMode="shipping" onCreateJobRequest={handleCreateJobRequest} isGuest={isGuest} onAfterSubmit={() => setTab("jobs")} />;
    }

    if (tab === "jobs-request-logistics") {
      return <JobRequestWorkspace requestMode="logistics" onCreateJobRequest={handleCreateJobRequest} isGuest={isGuest} onAfterSubmit={() => setTab("jobs")} />;
    }

    if (tab === "jobs-track") {
      return <JobRequestWorkspace requestMode="track" onCreateJobRequest={handleCreateJobRequest} isGuest={isGuest} />;
    }

    if (tab === "orders") {
      return (
        <OrderCentralWorkspace
          orderMode="dashboard"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-open") {
      return (
        <OrderCentralWorkspace
          orderMode="open"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-released") {
      return (
        <OrderCentralWorkspace
          orderMode="released"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-closed") {
      return (
        <OrderCentralWorkspace
          orderMode="closed"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-action-view") {
      return (
        <OrderCentralWorkspace
          orderMode="view"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-action-add-work") {
      return (
        <OrderCentralWorkspace
          orderMode="addWork"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-action-picklist") {
      return (
        <OrderCentralWorkspace
          orderMode="pickList"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-action-invoice") {
      return (
        <OrderCentralWorkspace
          orderMode="invoice"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "orders-action-release") {
      return (
        <OrderCentralWorkspace
          orderMode="release"
          orders={orders}
          setOrders={setOrders}
          deepLinkTarget={deepLinkTarget}
        />
      );
    }

    if (tab === "shipping-dashboard") {
      return <ShippingOperationsWorkspace orders={orders} setOrders={setOrders} onUpdateOrderStatus={updateOperationalOrderStatus} deepLinkTarget={deepLinkTarget} />;
    }

    if (
      tab === "shipping" ||
      tab === "shipping-started" ||
      tab === "shipping-complete"
    ) {
      return <ShippingOperationsWorkspace orders={orders} setOrders={setOrders} onUpdateOrderStatus={updateOperationalOrderStatus} deepLinkTarget={deepLinkTarget} />;
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

  if (session && !guestSession && passwordRecoveryMode) {
    return (
      <div className="workspace-portal">
        <div className="workspace-overlay">
          <div className="login-panel">
            <div className="login-header">
              <h1>INTRAL CONNECT</h1>
              <p>Password Recovery • Create New Password</p>
            </div>

            <div className="login-form">
              <input
                type="password"
                placeholder="New Password"
                value={recoveryPassword}
                onChange={(e) => setRecoveryPassword(e.target.value)}
                onKeyDown={handleRecoveryKeyDown}
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmRecoveryPassword}
                onChange={(e) => setConfirmRecoveryPassword(e.target.value)}
                onKeyDown={handleRecoveryKeyDown}
              />

              <button
                onClick={handleRecoveryPasswordReset}
                disabled={recoveryLoading}
              >
                {recoveryLoading ? "Updating..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "rgba(15, 23, 42, 0.72)",
                  border: "1px solid rgba(147, 197, 253, 0.35)",
                }}
              >
                Cancel / Logout
              </button>

              {recoveryMessage && (
                <p
                  style={{
                    marginTop: "4px",
                    color:
                      recoveryMessage.includes("failed") ||
                      recoveryMessage.includes("required") ||
                      recoveryMessage.includes("match") ||
                      recoveryMessage.includes("not found")
                        ? "#fecaca"
                        : "#dbeafe",
                    fontWeight: 800,
                    lineHeight: 1.45,
                  }}
                >
                  {recoveryMessage}
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
                Your recovery link was verified. Create a new password before
                entering INTRAL CONNECT.
              </p>
            </div>
          </div>
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
      onNotificationDeepLink={handleNotificationDeepLink}
    >
      {renderWorkspace()}
    </WorkspacePortal>
  );
}

export default App;
