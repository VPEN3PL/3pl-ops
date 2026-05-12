import LabelGenerator from "./components/LabelGenerator";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./auth/Login";
import InventoryForm from "./components/InventoryForm";
import intralLogo from "./assets/intral-logo.jpg";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const EMAIL_FUNCTION_URL =
    "https://yykbaayqwnewqljrywit.supabase.co/functions/v1/smart-service";

  const ORDER_STATUSES = {
    NOT_RELEASED: "Not Released",
    ORDER_RELEASED: "Order Released",
    PICK_CONFIRMED: "Pick Confirmed",
    ORDER_COMPLETE: "Order Complete",
    SHIPPED: "Shipped",
  };

  const transferScanRef = useRef(null);

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const userRole = String(profile?.role || "").toLowerCase().trim();
  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isEmployee = userRole === "employee";
  const isCustomer = userRole === "customer";

  const canManageUsers = isAdmin;
  const canSeeKpis = isAdmin || isManager;
  const canUploadReports = isAdmin || isManager;
  const canAddJobs = isAdmin || isManager || isEmployee || isCustomer;
  const canStartJobs = isAdmin || isManager || isEmployee;
  const canCloseJobs = isAdmin || isManager || isEmployee;
  const canDeleteJobs = isAdmin;
  const canManageWork = isAdmin || isManager || isEmployee;
  const canReceiveInventory = isAdmin || isManager || isEmployee;
  const canMoveInventory = isAdmin || isManager || isEmployee;
  const canSeeInventory = isAdmin || isManager || isEmployee || isCustomer;

  const [tab, setTab] = useState("home");
  const [inventorySection, setInventorySection] = useState("list");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [workFilter, setWorkFilter] = useState("All");
  const [now, setNow] = useState(new Date());
  const [lastKpiRefresh, setLastKpiRefresh] = useState(new Date());

  const [jobs, setJobs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedOrderJobId, setSelectedOrderJobId] = useState(null);
  const [jobWorkSelections, setJobWorkSelections] = useState({});

  const [inventoryMoveQueue, setInventoryMoveQueue] = useState(() => {
    const saved = localStorage.getItem("intralInventoryMoveQueue");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    jobNumber: "",
    chargeNumber: "",
    requestorName: "",
    requestorEmail: "",
    requestSource: "Customer",
    requestCategory: "",
    jobType: "",
    chargeable: false,
    chargeCode: "",
    location: "",
    notes: "",
    shipFromCompany: "",
    shipFromAddress: "",
    shipFromZip: "",
    shipToCompany: "",
    shipToAddress: "",
    shipToZip: "",
    shipToContactName: "",
    shipToContactPhone: "",
    shipToContactEmail: "",
  });

  const [lastSubmittedJob, setLastSubmittedJob] = useState(null);

  const [addressBook, setAddressBook] = useState(() => {
    const saved = localStorage.getItem("intralAddressBook");
    return saved ? JSON.parse(saved) : [];
  });

  const [inventoryItems, setInventoryItems] = useState(() => {
    const saved = localStorage.getItem("intralInventoryItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [labelData, setLabelData] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");

  const [moveForm, setMoveForm] = useState({
    inventoryId: "",
    moveQty: "",
    moveToSite: "",
    moveToLocation: "",
    moveReason: "Storage relocation",
  });

  const [scanStep, setScanStep] = useState("item");
  const [transferScanInput, setTransferScanInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [allocationForm, setAllocationForm] = useState({
    jobNumber: "",
    inventoryId: "",
    allocateQty: "",
  });

  const [opsData, setOpsData] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uncapturedWorkOptions = [
    "Wrapping",
    "Strapping",
    "Movement",
    "Search / Locate",
    "Staging",
    "Crating",
    "Loading",
    "Pickup / Delivery",
    "Inventory Verification",
    "Other",
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!error) setProfile(data);
    }

    loadProfile();
  }, [session]);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTab("home");
  };

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Jobs load error:", error.message);
        return;
      }

      setJobs(data || []);
      setLastKpiRefresh(new Date());
    }

    if (session) fetchJobs();
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("realtime-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          setJobs((prev) => {
            let updated = [...prev];

            if (payload.eventType === "INSERT") {
              if (!updated.some((j) => j.id === payload.new.id)) {
                updated.unshift(payload.new);
              }
            }

            if (payload.eventType === "UPDATE") {
              updated = updated.map((j) =>
                j.id === payload.new.id ? payload.new : j
              );
            }

            if (payload.eventType === "DELETE") {
              updated = updated.filter((j) => j.id !== payload.old.id);
            }

            return updated;
          });

          setLastKpiRefresh(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    async function fetchAuditLogs() {
      if (!session || !(isAdmin || isManager)) return;

      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.log("Audit log load error:", error.message);
        return;
      }

      setAuditLogs(data || []);
    }

    fetchAuditLogs();
  }, [session, isAdmin, isManager, jobs, inventoryMoveQueue]);

  useEffect(() => {
    localStorage.setItem("intralInventoryItems", JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  useEffect(() => {
    localStorage.setItem(
      "intralInventoryMoveQueue",
      JSON.stringify(inventoryMoveQueue)
    );
  }, [inventoryMoveQueue]);

  useEffect(() => {
    localStorage.setItem("intralAddressBook", JSON.stringify(addressBook));
  }, [addressBook]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      isCustomer &&
      (tab === "home" || tab === "orders" || tab === "audit" || tab === "admin")
    ) {
      setTab("capture");
    }
  }, [isCustomer, tab]);

  useEffect(() => {
    if (tab === "inventory" && inventorySection === "moving") {
      setTimeout(() => transferScanRef.current?.focus(), 100);
    }
  }, [tab, inventorySection, scanStep]);

  const sendJobEmail = async ({ email, subject, message }) => {
    if (!email || !session?.access_token) return;

    try {
      const emailResponse = await fetch(EMAIL_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, subject, message }),
      });

      const emailResult = await emailResponse.json();
      console.log("EMAIL FUNCTION STATUS:", emailResponse.status);
      console.log("EMAIL FUNCTION RESULT:", emailResult);
    } catch (error) {
      console.warn("Email failed, but job action completed:", error.message);
    }
  };

  const logAudit = async ({
    action,
    module = "",
    jobId = null,
    jobNumber = "",
    inventoryId = "",
    moveId = "",
    oldStatus = "",
    newStatus = "",
    quantity = null,
    notes = "",
  }) => {
    if (!session?.user) return;

    const { error } = await supabase.from("audit_logs").insert([
      {
        user_id: session.user.id,
        user_email: session.user.email,
        user_role: profile?.role || "",
        action,
        module,
        job_id: jobId,
        job_number: jobNumber,
        inventory_id: inventoryId,
        move_id: moveId,
        old_status: oldStatus,
        new_status: newStatus,
        quantity,
        notes,
      },
    ]);

    if (error) console.warn("Audit log failed:", error.message);
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const isCustomerInventorySupportJob = (job) => {
    const source = String(job?.request_source || "").toLowerCase();
    const category = String(job?.request_category || "").toLowerCase();
    return source === "customer" && category.includes("inventory support");
  };

  const getHoursOpen = (job) => {
    if (!job.created_at) return "0.0";

    const isClosed =
      job.status === ORDER_STATUSES.ORDER_COMPLETE ||
      job.status === ORDER_STATUSES.SHIPPED;

    const end =
      isClosed && job.complete_time ? new Date(job.complete_time) : new Date();

    const created = new Date(job.created_at);
    return Math.max(0, (end - created) / (1000 * 60 * 60)).toFixed(1);
  };

  const isOpenOver24Hours = (job) =>
    job.status !== ORDER_STATUSES.SHIPPED && Number(getHoursOpen(job)) > 24;

  const saveAddressIfNew = (type, address) => {
    const company = address.company?.trim();
    const fullAddress = address.address?.trim();
    const zip = address.zip?.trim();

    if (!company || !fullAddress || !zip) return;

    const exists = addressBook.some(
      (entry) =>
        entry.type === type &&
        entry.company === company &&
        entry.address === fullAddress &&
        entry.zip === zip
    );

    if (!exists) {
      setAddressBook((prev) => [
        ...prev,
        {
          id: `${type}-${Date.now()}`,
          type,
          company,
          address: fullAddress,
          zip,
          contactName: address.contactName || "",
          contactPhone: address.contactPhone || "",
          contactEmail: address.contactEmail || "",
        },
      ]);
    }
  };

  const getNextInventoryId = (items) => {
    const maxNumber = items.reduce((max, item) => {
      const number = Number(String(item.id || "").replace("INV-", ""));
      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 0);

    return `INV-${String(maxNumber + 1).padStart(6, "0")}`;
  };

  const getNextJobNumber = (items) => {
    const maxNumber = items.reduce((max, item) => {
      const number = Number(String(item.jobNumber || "").replace("JOB-", ""));
      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 0);

    return `JOB-${String(maxNumber + 1).padStart(6, "0")}`;
  };

  const getJobWorkSelections = (jobId) => jobWorkSelections[jobId] || [];

  const toggleJobWorkSelection = (jobId, option) => {
    setJobWorkSelections((prev) => {
      const current = prev[jobId] || [];
      const exists = current.includes(option);

      return {
        ...prev,
        [jobId]: exists
          ? current.filter((item) => item !== option)
          : [...current, option],
      };
    });
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
          { name: file.name, rows: jsonData.length },
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

  const addJob = async () => {
    if (!canAddJobs) {
      alert("You do not have permission to add job requests.");
      return;
    }

    if (!form.requestCategory) {
      alert("Please select a job request type.");
      return;
    }

    if (!form.jobType && !isCustomer) {
      alert("Please select a job type.");
      return;
    }

    const newJob = {
      jobNumber: form.jobNumber.trim() || `JOB-${Date.now()}`,
      chargeNumber: form.chargeNumber || "",
      requestorName: form.requestorName || "Unknown",
      requestorEmail: form.requestorEmail || "",
      jobType: isCustomer ? "" : form.jobType || "Not Specified",
      requestSource: isCustomer ? "Customer" : form.requestSource,
      requestCategory: form.requestCategory,
      chargeable: isCustomer ? false : form.chargeable,
      chargeCode: isCustomer ? "" : form.chargeCode,
      location: form.location || "",
      notes: form.notes || "",
      status: ORDER_STATUSES.NOT_RELEASED,
    };

    saveAddressIfNew("from", {
      company: form.shipFromCompany,
      address: form.shipFromAddress,
      zip: form.shipFromZip,
    });

    saveAddressIfNew("to", {
      company: form.shipToCompany,
      address: form.shipToAddress,
      zip: form.shipToZip,
      contactName: form.shipToContactName,
      contactPhone: form.shipToContactPhone,
      contactEmail: form.shipToContactEmail,
    });

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          job_number: newJob.jobNumber,
          charge_number: newJob.chargeNumber,
          requestor_name: newJob.requestorName,
          requestor_email: newJob.requestorEmail,
          request_source: newJob.requestSource,
          request_category: newJob.requestCategory,
          job_type: newJob.jobType,
          chargeable: newJob.chargeable,
          charge_code: newJob.chargeCode,
          location: newJob.location,
          notes: newJob.notes,
          ship_from_company: form.shipFromCompany,
          ship_from_address: form.shipFromAddress,
          ship_from_zip: form.shipFromZip,
          ship_to_company: form.shipToCompany,
          ship_to_address: form.shipToAddress,
          ship_to_zip: form.shipToZip,
          ship_to_contact_name: form.shipToContactName,
          ship_to_contact_phone: form.shipToContactPhone,
          ship_to_contact_email: form.shipToContactEmail,
          status: newJob.status,
          user_id: session.user.id,
        },
      ])
      .select();

    if (error) {
      alert(error.message);
      return;
    }

    setJobs((prev) => {
      const alreadyExists = prev.some((j) => j.id === data[0].id);
      return alreadyExists ? prev : [data[0], ...prev];
    });

    setLastSubmittedJob(data[0]);

    await logAudit({
      action: "Customer request submitted",
      module: "Jobs",
      jobId: data[0].id,
      jobNumber: data[0].job_number,
      newStatus: ORDER_STATUSES.NOT_RELEASED,
      notes: data[0].request_category,
    });

    await sendJobEmail({
      email: newJob.requestorEmail,
      subject: "Job Request Submitted",
      message: `Your job request (${newJob.jobNumber}) has been submitted. Status: Not Released.`,
    });

    setForm({
      jobNumber: "",
      chargeNumber: "",
      requestorName: "",
      requestorEmail: "",
      requestSource: "Customer",
      requestCategory: "",
      jobType: "",
      chargeable: false,
      chargeCode: "",
      location: "",
      notes: "",
      shipFromCompany: "",
      shipFromAddress: "",
      shipFromZip: "",
      shipToCompany: "",
      shipToAddress: "",
      shipToZip: "",
      shipToContactName: "",
      shipToContactPhone: "",
      shipToContactEmail: "",
    });

    alert("Job request submitted successfully.");
  };

  const addInventoryItem = (item) => {
    const generatedInventoryId = getNextInventoryId(inventoryItems);

    const newItem = {
      id: generatedInventoryId,
      inventoryId: generatedInventoryId,
      jobNumber: getNextJobNumber(inventoryItems),
      status: "Available",
      createdAt: new Date().toISOString(),
      moveHistory: [],
      pickHistory: [],
      allocations: [],
      ...item,
      quantity: Number(item.quantity || 0),
    };

    setInventoryItems((prev) => [...prev, newItem]);

    setLabelData({
      inventoryId: newItem.inventoryId,
      customer: newItem.customer || "",
      partNumber: newItem.partNumber || "",
      quantity: newItem.quantity || "",
      description: newItem.description || "",
      poNumber: newItem.poNumber || "",
      countryOfOrigin: newItem.countryOfOrigin || "",
      site: newItem.site || "INTRAL",
      amTag: newItem.amTag || "",
      squareFeet: newItem.squareFeet || "",
      date: new Date().toISOString().slice(0, 10),
    });

    setInventorySection("labels");
  };

  const validateLocation = (site, location) => {
    if (!site || site.trim() === "") return "Please select a destination site.";
    if (!location || location.trim() === "") return "Location cannot be empty.";

    const cleanSite = site.trim().toUpperCase();
    const cleanLocation = location.trim().toUpperCase();

    if (cleanSite === "AM") {
      if (!cleanLocation.startsWith("AM-TAG-")) {
        return "Invalid A&M Tag format. Use AM-TAG-XXXXX";
      }
      return null;
    }

    if (cleanSite === "INTRAL") {
      const validSites = ["1K", "6K", "BASE", "M", "DCIC"];
      const parts = cleanLocation.split("-");
      const [siteCode] = parts;

      if (parts.length !== 5) {
        return "Invalid format. Use SITE-ZONE-AISLE-RACK-LEVEL. Example: 1K-A-01-02-03";
      }

      if (!validSites.includes(siteCode)) {
        return "Invalid site prefix. Use 1K, 6K, BASE, M, or DCIC.";
      }

      return null;
    }

    if (cleanSite === "CUSTOMER" || cleanSite === "TRANSIT") return null;

    return "Invalid destination site.";
  };

  const performMoveInventoryItem = (formData = moveForm, autoMode = false) => {
    const inventoryId = formData.inventoryId.trim();
    const moveQty = Number(formData.moveQty);

    if (!inventoryId || !formData.moveToSite || !formData.moveToLocation || !moveQty) {
      alert("Please enter Inventory ID, transfer quantity, new site, and new location.");
      return false;
    }

    const locationError = validateLocation(formData.moveToSite, formData.moveToLocation);

    if (locationError) {
      alert(locationError);
      return false;
    }

    const sourceItem = inventoryItems.find(
      (item) => item.id === inventoryId || item.inventoryId === inventoryId
    );

    if (!sourceItem) {
      alert("Inventory ID not found.");
      return false;
    }

    const currentQty = Number(sourceItem.quantity || 0);

    if (moveQty <= 0) {
      alert("Transfer quantity must be greater than zero.");
      return false;
    }

    if (moveQty > currentQty) {
      alert("Transfer quantity cannot be greater than current available quantity.");
      return false;
    }

    const newInventoryId = getNextInventoryId(inventoryItems);
    const newJobNumber = getNextJobNumber(inventoryItems);

    const moveRecord = {
      movedAt: new Date().toISOString(),
      movedQty: moveQty,
      movedFromInventoryId: sourceItem.id,
      movedFromSite: sourceItem.site,
      movedFromLocation:
        sourceItem.site === "AM"
          ? `A&M Tag: ${sourceItem.amTag}`
          : sourceItem.locationDetail,
      movedToSite: formData.moveToSite,
      movedToLocation: formData.moveToLocation,
      reason: formData.moveReason,
    };

    if (moveQty === currentQty) {
      setInventoryItems(
        inventoryItems.map((item) => {
          if (item.id !== sourceItem.id) return item;

          return {
            ...item,
            site: formData.moveToSite,
            locationDetail: formData.moveToLocation,
            amTag: formData.moveToSite === "AM" ? formData.moveToLocation : "",
            moveHistory: [...(item.moveHistory || []), moveRecord],
          };
        })
      );
    } else {
      const remainingItem = {
        ...sourceItem,
        quantity: currentQty - moveQty,
        moveHistory: [
          ...(sourceItem.moveHistory || []),
          {
            ...moveRecord,
            note: `Partial transfer. Remaining quantity kept on original ID ${sourceItem.id}.`,
          },
        ],
      };

      const movedItem = {
        ...sourceItem,
        id: newInventoryId,
        inventoryId: newInventoryId,
        jobNumber: newJobNumber,
        quantity: moveQty,
        site: formData.moveToSite,
        locationDetail: formData.moveToLocation,
        amTag: formData.moveToSite === "AM" ? formData.moveToLocation : "",
        createdAt: new Date().toISOString(),
        status: "Available",
        moveHistory: [
          {
            ...moveRecord,
            movedToInventoryId: newInventoryId,
            note: `Partial quantity transferred from ${sourceItem.id} into new inventory ID ${newInventoryId}.`,
          },
        ],
      };

      setInventoryItems(
        inventoryItems
          .map((item) => (item.id === sourceItem.id ? remainingItem : item))
          .concat(movedItem)
      );
    }

    alert(autoMode ? "Scan transfer completed successfully." : "Inventory transferred successfully.");

    setMoveForm({
      inventoryId: "",
      moveQty: "",
      moveToSite: "",
      moveToLocation: "",
      moveReason: "Storage relocation",
    });

    setTransferScanInput("");
    setScanStep("item");
    setSelectedLocation(null);
    setInventorySection("list");

    return true;
  };

  const moveInventoryItem = () => {
    performMoveInventoryItem(moveForm, false);
  };

  const handleTransferScan = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const scannedValue = transferScanInput.trim();
    if (!scannedValue) return;

    if (scanStep === "item") {
      const foundItem = inventoryItems.find(
        (item) => item.id === scannedValue || item.inventoryId === scannedValue
      );

      if (!foundItem) {
        alert("Inventory not found.");
        setTransferScanInput("");
        return;
      }

      setMoveForm({
        inventoryId: foundItem.inventoryId || foundItem.id,
        moveQty: foundItem.quantity || "",
        moveToSite: "",
        moveToLocation: "",
        moveReason: "Storage relocation",
      });

      setTransferScanInput("");
      setScanStep("location");
      setTimeout(() => transferScanRef.current?.focus(), 50);
      return;
    }

    if (scanStep === "location") {
      const currentItem = inventoryItems.find(
        (item) =>
          item.id === moveForm.inventoryId ||
          item.inventoryId === moveForm.inventoryId
      );

      if (!currentItem) {
        alert("Scan an Inventory ID first.");
        setTransferScanInput("");
        setScanStep("item");
        return;
      }

      const updatedMoveForm = {
        ...moveForm,
        moveToSite: "INTRAL",
        moveToLocation: scannedValue,
        moveQty: moveForm.moveQty || currentItem.quantity || "",
      };

      setMoveForm(updatedMoveForm);
      setTransferScanInput("");

      setTimeout(() => performMoveInventoryItem(updatedMoveForm, true), 100);
    }
  };

  const filteredInventoryItems = inventoryItems.filter((item) => {
    const search = inventorySearch.toLowerCase();

    return (
      item.id?.toLowerCase().includes(search) ||
      item.inventoryId?.toLowerCase().includes(search) ||
      item.jobNumber?.toLowerCase().includes(search) ||
      item.customer?.toLowerCase().includes(search) ||
      item.partNumber?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.amTag?.toLowerCase().includes(search) ||
      item.locationDetail?.toLowerCase().includes(search) ||
      item.site?.toLowerCase().includes(search) ||
      item.allocatedJobNumber?.toLowerCase().includes(search) ||
      item.sourceInventoryId?.toLowerCase().includes(search)
    );
  });

  const selectedItem = inventoryItems.find(
    (item) =>
      item.id === moveForm.inventoryId.trim() ||
      item.inventoryId === moveForm.inventoryId.trim()
  );

  const selectedAllocationItem = inventoryItems.find(
    (item) =>
      item.id === allocationForm.inventoryId.trim() ||
      item.inventoryId === allocationForm.inventoryId.trim()
  );

  const locationSummary = Object.values(
    inventoryItems.reduce((acc, item) => {
      const location =
        item.site === "AM"
          ? item.amTag || "UNKNOWN"
          : item.locationDetail || "UNASSIGNED";

      const key = `${item.site}-${location}`;

      if (!acc[key]) {
        acc[key] = {
          site: item.site,
          location,
          totalQty: 0,
          itemCount: 0,
        };
      }

      acc[key].totalQty += Number(item.quantity || 0);
      acc[key].itemCount += 1;

      return acc;
    }, {})
  );

  const totalLocations = locationSummary.length;
  const totalUnits = locationSummary.reduce((sum, loc) => sum + loc.totalQty, 0);
  const overloadedLocations = locationSummary.filter((loc) => loc.totalQty > 100).length;

  const pendingCustomerRequests = jobs.filter(
    (job) =>
      job.status === ORDER_STATUSES.NOT_RELEASED &&
      job.request_source === "Customer"
  );

  const openOrderJobs = jobs.filter(
    (job) => job.status !== ORDER_STATUSES.SHIPPED
  );

  const allocateInventoryToJob = async (overrideJobNumber = "") => {
    const jobNumber = (overrideJobNumber || allocationForm.jobNumber).trim();
    const inventoryId = allocationForm.inventoryId.trim();
    const allocateQty = Number(allocationForm.allocateQty);

    if (!jobNumber || !inventoryId || !allocateQty) {
      alert("Enter Job #, Inventory ID, and quantity to allocate.");
      return;
    }

    const job = jobs.find(
      (j) =>
        String(j.job_number || "").trim() === jobNumber &&
        j.status !== ORDER_STATUSES.SHIPPED
    );

    if (!job) {
      alert("Open job not found. Inventory can only be allocated to an active job.");
      return;
    }

    const item = inventoryItems.find(
      (i) => i.id === inventoryId || i.inventoryId === inventoryId
    );

    if (!item) {
      alert("Inventory ID not found.");
      return;
    }

    if (item.status === "Allocated") {
      alert("This inventory record is already allocated.");
      return;
    }

    const availableQty = Number(item.quantity || 0);

    if (allocateQty <= 0) {
      alert("Allocated quantity must be greater than zero.");
      return;
    }

    if (allocateQty > availableQty) {
      alert("Allocated quantity cannot exceed available quantity.");
      return;
    }

    const timestamp = Date.now();
    const sourceInventoryId = item.inventoryId || item.id;
    const allocatedInventoryId = `${sourceInventoryId}-ALLOC-${timestamp}`;

    const allocationRecord = {
      allocationId: `ALLOC-${timestamp}`,
      jobId: job.id,
      jobNumber: job.job_number,
      sourceInventoryId,
      allocatedInventoryId,
      allocatedQty: allocateQty,
      allocatedAt: new Date().toISOString(),
      allocatedBy: session?.user?.email || "",
      status: "Allocated",
    };

    setInventoryItems((prev) =>
      prev
        .map((i) => {
          if (i.id !== item.id) return i;

          const remainingQty = availableQty - allocateQty;

          return {
            ...i,
            quantity: remainingQty,
            status: remainingQty === 0 ? "Fully Allocated" : "Available",
            allocations: [...(i.allocations || []), allocationRecord],
          };
        })
        .concat({
          ...item,
          id: allocatedInventoryId,
          inventoryId: allocatedInventoryId,
          quantity: allocateQty,
          status: "Allocated",
          allocatedJobNumber: job.job_number,
          allocatedJobId: job.id,
          allocatedAt: new Date().toISOString(),
          sourceInventoryId,
          allocations: [allocationRecord],
          moveHistory: [],
          pickHistory: [],
        })
    );

    setInventoryMoveQueue((prev) => [
      {
        id: `MOVE-${timestamp}`,
        jobNumber: job.job_number,
        jobId: job.id,
        inventoryId: allocatedInventoryId,
        customer: item.customer || "",
        partNumber: item.partNumber || "",
        description: item.description || "",
        site: item.site || "",
        location:
          item.site === "AM"
            ? `A&M Tag: ${item.amTag}`
            : item.locationDetail || "",
        availableQty,
        requestedQty: allocateQty,
        movedQty: allocateQty,
        status: "Verified",
        shortage: false,
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        movingAt: "",
        stagedAt: "",
        completedAt: "",
      },
      ...prev,
    ]);

    await logAudit({
      action: "Inventory allocated to job",
      module: "Inventory Allocation",
      jobId: job.id,
      jobNumber: job.job_number,
      inventoryId: allocatedInventoryId,
      newStatus: "Allocated",
      quantity: allocateQty,
      notes: `Allocated ${allocateQty} from ${sourceInventoryId}`,
    });

    setAllocationForm({
      jobNumber: "",
      inventoryId: "",
      allocateQty: "",
    });

    alert("Inventory allocated successfully.");
  };

  const updateInventoryMoveStatus = (moveId, status) => {
    const existingMove = inventoryMoveQueue.find((move) => move.id === moveId);

    setInventoryMoveQueue((prev) =>
      prev.map((move) => {
        if (move.id !== moveId) return move;

        const updates = { status };

        if (status === "Verified") updates.verifiedAt = new Date().toISOString();
        if (status === "Moving") updates.movingAt = new Date().toISOString();
        if (status === "Staged") updates.stagedAt = new Date().toISOString();
        if (status === "Complete") updates.completedAt = new Date().toISOString();

        return { ...move, ...updates };
      })
    );

    if (existingMove) {
      logAudit({
        action: `Inventory move status changed to ${status}`,
        module: "Inventory Move Queue",
        jobNumber: existingMove.jobNumber,
        inventoryId: existingMove.inventoryId,
        moveId: existingMove.id,
        oldStatus: existingMove.status,
        newStatus: status,
        quantity: existingMove.requestedQty,
      });
    }
  };

  const deleteInventoryMoveQueueItem = (moveId) => {
    if (!window.confirm("Delete this inventory move queue item?")) return;
    setInventoryMoveQueue((prev) => prev.filter((move) => move.id !== moveId));
  };

  const generateJobReleaseDocument = (job) => {
    if (!job) return;

    const documentNumber = `JR-${String(job.id || Date.now())
      .slice(-6)
      .padStart(6, "0")}`;

    const releaseLines = inventoryItems.filter(
      (item) =>
        item.allocatedJobNumber === job.job_number ||
        String(item.jobNumber || "").trim() === String(job.job_number || "").trim()
    );

    const lineRows =
      releaseLines.length === 0
        ? `<tr><td colspan="8">No inventory has been assigned to this job request yet.</td></tr>`
        : releaseLines
            .map(
              (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(item.quantity || "")}</td>
                  <td>${escapeHtml(item.uom || "EA")}</td>
                  <td>${escapeHtml(item.partNumber || "")}</td>
                  <td>${escapeHtml(item.inventoryId || item.id || "")}</td>
                  <td>${escapeHtml(item.description || "")}</td>
                  <td>${escapeHtml(formatDate(item.createdAt || item.allocatedAt) || "")}</td>
                  <td>*${escapeHtml(item.inventoryId || item.id || "")}*</td>
                </tr>
              `
            )
            .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>INTRAL Job Release / Pick Authorization</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 28px; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #111827; padding-bottom: 12px; margin-bottom: 18px; }
            .title { font-size: 24px; font-weight: 800; }
            .subtitle, .meta, p { font-size: 13px; line-height: 1.4; }
            .section { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
            th, td { border: 1px solid #94a3b8; padding: 7px; text-align: left; vertical-align: top; word-break: break-word; }
            th { background: #e2e8f0; font-weight: 800; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 28px; font-size: 12px; }
            .sig-box { border-top: 1px solid #111827; padding-top: 8px; }
            @media print { button { display: none; } body { margin: 18px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">INTRAL Job Release / Pick Authorization</div>
              <div class="subtitle">
                1900 Crown Colony Drive, Suite 407<br />
                Quincy, MA 02169<br />
                (617) 439-5880
              </div>
            </div>
            <div class="meta">
              <strong>Document #:</strong> ${escapeHtml(documentNumber)}<br />
              <strong>Job #:</strong> ${escapeHtml(job.job_number || "")}<br />
              <strong>Date:</strong> ${new Date().toLocaleDateString()}<br />
              <strong>Status:</strong> ${escapeHtml(job.status || "")}
            </div>
          </div>

          <div class="section">
            <h3>Ship From</h3>
            <p>${escapeHtml(job.ship_from_company || job.request_source || "INTRAL")}</p>
            <p>${escapeHtml(job.ship_from_address || job.location || "Warehouse / Staging")}</p>
          </div>

          <div class="section">
            <h3>Ship To</h3>
            <p>${escapeHtml(job.ship_to_company || job.requestor_name || "")}</p>
            <p>${escapeHtml(job.ship_to_address || "")}</p>
            <p>${escapeHtml(job.ship_to_contact_email || job.requestor_email || "")}</p>
          </div>

          <div class="section">
            <h3>Description of Request</h3>
            <p>${escapeHtml(job.notes || "Pull, verify, stage, and complete requested warehouse activity.")}</p>
          </div>

          <div class="section">
            <h3>Pick / Material Body</h3>
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>PN</th>
                  <th>System Inventory ID</th>
                  <th>Description</th>
                  <th>Storage Date</th>
                  <th>Barcode / Scan</th>
                </tr>
              </thead>
              <tbody>${lineRows}</tbody>
            </table>
          </div>

          <div class="signatures">
            <div class="sig-box">Picker Name / Signature</div>
            <div class="sig-box">Scanner Confirmation</div>
            <div class="sig-box">Date / Time Closed</div>
          </div>

          <button onclick="window.print()">Print / Save PDF</button>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1100,height=850");
    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups for this site.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const acceptJob = async (id) => {
    if (!canStartJobs) {
      alert("You do not have permission to accept jobs.");
      return;
    }

    const job = jobs.find((j) => j.id === id);

    if (!job) {
      alert("Job not found.");
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .update({
        status: ORDER_STATUSES.ORDER_RELEASED,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      alert(`Accept Job failed: ${error.message}`);
      return;
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)));

    await logAudit({
      action: "Job accepted",
      module: "Order Central",
      jobId: data.id,
      jobNumber: data.job_number,
      oldStatus: job.status,
      newStatus: ORDER_STATUSES.ORDER_RELEASED,
    });

    alert("Job accepted.");
  };

  const startJob = async (id) => {
    if (!canStartJobs) {
      alert("You do not have permission to start jobs.");
      return;
    }

    const job = jobs.find((j) => j.id === id);

    if (!job) {
      alert("Job not found.");
      return;
    }

    if (isCustomerInventorySupportJob(job)) {
      const hasAllocatedInventory = inventoryItems.some(
        (item) =>
          item.allocatedJobNumber === job.job_number &&
          item.status === "Allocated"
      );

      if (!hasAllocatedInventory) {
        alert("Allocate inventory before starting this inventory support job.");
        return;
      }
    }

    const startTime = new Date().toISOString();

    const { data, error } = await supabase
      .from("jobs")
      .update({
        status: ORDER_STATUSES.PICK_CONFIRMED,
        start_time: startTime,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      alert(`Start Job failed: ${error.message}`);
      return;
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)));

    await logAudit({
      action: "Job started",
      module: "Order Central",
      jobId: data.id,
      jobNumber: data.job_number,
      oldStatus: job.status,
      newStatus: ORDER_STATUSES.PICK_CONFIRMED,
      notes: `Start time recorded: ${formatDateTime(startTime)}`,
    });

    alert("Job started. Start time recorded.");
  };

  const completeJob = async (id) => {
    if (!canCloseJobs) {
      alert("You do not have permission to complete jobs.");
      return;
    }

    const job = jobs.find((j) => j.id === id);

    if (!job) {
      alert("Job not found.");
      return;
    }

    const end = new Date();
    const start = job.start_time ? new Date(job.start_time) : end;
    const minutes = Math.max(1, Math.round((end - start) / 60000));

    const { data, error } = await supabase
      .from("jobs")
      .update({
        status: ORDER_STATUSES.ORDER_COMPLETE,
        complete_time: end.toISOString(),
        actual_minutes: minutes,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      alert(`Complete Job failed: ${error.message}`);
      return;
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)));

    await logAudit({
      action: "Job completed",
      module: "Order Central",
      jobId: data.id,
      jobNumber: data.job_number,
      oldStatus: job.status,
      newStatus: ORDER_STATUSES.ORDER_COMPLETE,
      quantity: minutes,
      notes: "Actual labor minutes",
    });

    alert(`Job completed. Minutes recorded: ${minutes}`);
  };

  const closeJob = async (id) => {
    if (!canCloseJobs) {
      alert("You do not have permission to close jobs.");
      return;
    }

    const job = jobs.find((j) => j.id === id);

    if (!job) {
      alert("Job not found.");
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .update({
        status: ORDER_STATUSES.SHIPPED,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      alert(`Close Job failed: ${error.message}`);
      return;
    }

    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)));

    await logAudit({
      action: "Job closed / shipped",
      module: "Order Central",
      jobId: data.id,
      jobNumber: data.job_number,
      oldStatus: job.status,
      newStatus: ORDER_STATUSES.SHIPPED,
    });

    alert("Job closed.");
  };

  const deleteJob = async (id) => {
    if (!canDeleteJobs) return;

    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

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

  const applyFilters = () => {
    let filtered = [...jobs];

    if (dateFilter === "Today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (j) => new Date(j.created_at).toDateString() === today
      );
    }

    if (dateFilter === "This Week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((j) => new Date(j.created_at) >= weekAgo);
    }

    if (workFilter === "Active Only") {
      filtered = filtered.filter((j) => j.status !== ORDER_STATUSES.SHIPPED);
    }

    if (workFilter === "Over 24 Hrs") {
      filtered = filtered.filter((j) => isOpenOver24Hours(j));
    }

    return filtered;
  };

  const filteredJobs = applyFilters();
  const activeJobs = jobs.filter((j) => j.status !== ORDER_STATUSES.SHIPPED);
  const openOver24Hours = jobs.filter((j) => isOpenOver24Hours(j)).length;

  const openCratingRequests = jobs.filter(
    (j) =>
      j.request_source === "A&M" &&
      j.request_category === "Crating Request" &&
      j.status !== ORDER_STATUSES.SHIPPED
  ).length;

  const totalMinutes = jobs.reduce(
    (sum, j) => sum + Number(j.actual_minutes || 0),
    0
  );

  const totalLaborHours = totalMinutes / 60;

  const chargeableLaborHours =
    jobs
      .filter((j) => j.chargeable)
      .reduce((sum, j) => sum + Number(j.actual_minutes || 0), 0) / 60;

  const nonChargeableLaborHours =
    jobs
      .filter((j) => !j.chargeable)
      .reduce((sum, j) => sum + Number(j.actual_minutes || 0), 0) / 60;

  const transactionsPerLaborHour =
    totalLaborHours > 0
      ? (totalTransactions / totalLaborHours).toFixed(1)
      : "0.0";

  const filteredCompleted = filteredJobs.filter(
    (j) =>
      j.status === ORDER_STATUSES.ORDER_COMPLETE ||
      j.status === ORDER_STATUSES.SHIPPED
  ).length;

  const filteredOpen = filteredJobs.filter(
    (j) => j.status !== ORDER_STATUSES.SHIPPED
  ).length;

  const filteredOver24 = filteredJobs.filter((j) => isOpenOver24Hours(j)).length;

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

  const workloadBySource = countByField("request_source");
  const workloadByJobType = countByField("job_type").slice(0, 5);

  const systemKpiData = [
    { name: "Accepted", value: accepted },
    { name: "Delivery", value: delivery },
    { name: "Kit Complete", value: kitComplete },
    { name: "Pick List", value: pickList },
    { name: "Receiving", value: receiving },
    { name: "Xfer Pick", value: xferPick },
    { name: "Xfer Stock", value: xferStock },
  ];

  const requestStatusData = [
    { name: "Completed", value: filteredCompleted },
    { name: "Open", value: filteredOpen },
    { name: "Over 24 Hrs", value: filteredOver24 },
  ];

  const laborData = [
    { name: "Chargeable", value: chargeableLaborHours },
    { name: "Non-Chargeable", value: nonChargeableLaborHours },
  ];

  const riskData = [
    { name: "Open >24 Hrs", value: openOver24Hours },
    { name: "Open Crating", value: openCratingRequests },
    { name: "Active Requests", value: activeJobs.length },
  ];

  const trendByCreatedDate = (() => {
    const buckets = {};

    filteredJobs.forEach((job) => {
      const date = new Date(job.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
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
                    marginBottom: "5px",
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
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width,
                      height: "100%",
                      background: "#0057b8",
                      borderRadius: "999px",
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
            background: `conic-gradient(#0057b8 0% ${firstPct}%, #dc2626 ${firstPct}% 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              textAlign: "center",
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
            <path d={path} fill="none" stroke="#0057b8" strokeWidth="4" />
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
      "Requestor Email",
      "Source",
      "Category",
      "Job Type",
      "Chargeable",
      "Charge Code",
      "Location",
      "Status",
      "Submitted Date",
      "Started Date",
      "Completed Date",
      "Minutes",
      "Hours Open",
      "Over 24 Hours",
      "Notes",
    ];

    const rows = filteredJobs.map((j) => [
      j.job_number,
      j.charge_number,
      j.requestor_name,
      j.requestor_email,
      j.request_source,
      j.request_category,
      j.job_type,
      j.chargeable ? "Yes" : "No",
      j.charge_code,
      j.location,
      j.status,
      formatDateTime(j.created_at),
      formatDateTime(j.start_time),
      formatDateTime(j.complete_time),
      j.actual_minutes,
      getHoursOpen(j),
      isOpenOver24Hours(j) ? "Yes" : "No",
      j.notes,
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

  if (!session) {
    return <Login />;
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo-container">
          <img src={intralLogo} alt="Intral Logo" />
          <h2>INTRAL 3PL</h2>
        </div>

        {!isCustomer && (
          <button
            className={tab === "home" ? "active" : ""}
            onClick={() => setTab("home")}
          >
            📊 Home
          </button>
        )}

        <button
          className={tab === "capture" ? "active" : ""}
          onClick={() => setTab("capture")}
        >
          🧾 Job Request
        </button>

        {canSeeInventory && (
          <button
            className={tab === "inventory" ? "active" : ""}
            onClick={() => setTab("inventory")}
          >
            📦 Inventory
          </button>
        )}

        {!isCustomer && (
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            📋 Order Central
            {pendingCustomerRequests.length > 0 && (
              <span
                style={{
                  marginLeft: "6px",
                  color: "red",
                  fontWeight: "bold",
                }}
              >
                ●
              </span>
            )}
          </button>
        )}

        {(isAdmin || isManager) && (
          <button
            className={tab === "audit" ? "active" : ""}
            onClick={() => setTab("audit")}
          >
            🧾 Audit Logs
          </button>
        )}

        {canManageUsers && (
          <button
            className={tab === "admin" ? "active" : ""}
            onClick={() => setTab("admin")}
          >
            👤 Admin
          </button>
        )}
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h1>🚚 INTRAL 3PL CONTROL TOWER</h1>
            <div>
              Warehouse Operations • Logistics Visibility • Customer Request Portal
            </div>
            <div style={{ marginTop: "6px" }}>
              Logged in as:{" "}
              <strong>
                {profile?.role ? profile.role.toUpperCase() : "USER"}
              </strong>{" "}
              <button onClick={logout}>Logout</button>
            </div>
          </div>

          <div className="clock-card">
            <div className="clock-time">
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
              })}
            </div>
            <div className="clock-date">
              {now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {(openOver24Hours > 0 ||
          openCratingRequests > 0 ||
          pendingCustomerRequests.length > 0) &&
          !isCustomer && (
            <div className="card red">
              🚨 Control Tower Alert: {openOver24Hours} request(s) open longer
              than 24 hours | {openCratingRequests} open crating request(s) |{" "}
              {pendingCustomerRequests.length} new customer request(s)
            </div>
          )}

        {!isCustomer && (
          <div className="filters">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
            </select>

            <select
              value={workFilter}
              onChange={(e) => setWorkFilter(e.target.value)}
            >
              <option>All</option>
              <option>Active Only</option>
              <option>Over 24 Hrs</option>
            </select>
          </div>
        )}

        {tab === "audit" && (isAdmin || isManager) && (
          <div className="card">
            <h2>Audit Logs</h2>
            <p>
              Tracks user actions, job status changes, and inventory movement
              activity.
            </p>

            <div className="scroll-table">
              <table>
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Job #</th>
                    <th>Inventory ID</th>
                    <th>Move ID</th>
                    <th>Old Status</th>
                    <th>New Status</th>
                    <th>Qty / Minutes</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="12">No audit logs found.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.created_at)}</td>
                        <td>{log.user_email}</td>
                        <td>{log.user_role}</td>
                        <td>{log.action}</td>
                        <td>{log.module}</td>
                        <td>{log.job_number}</td>
                        <td>{log.inventory_id}</td>
                        <td>{log.move_id}</td>
                        <td>{log.old_status}</td>
                        <td>{log.new_status}</td>
                        <td>{log.quantity}</td>
                        <td>{log.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "admin" && canManageUsers && (
          <div className="card">
            <h2>Admin User Management</h2>
            <p>
              Admin-only area. Later we will add employee creation, role
              updates, and user removal here.
            </p>
          </div>
        )}

        {tab === "orders" && !isCustomer && (
          <div>
            <div className="card">
              <h2>Order Central</h2>
              <p>
                Manage customer requests, release orders, allocate inventory,
                confirm pick, complete work, and close shipped orders.
              </p>
            </div>

            <div className="card">
              <h3>Open Job Queue</h3>
              {openOrderJobs.length === 0 ? (
                <p>No open jobs.</p>
              ) : (
                <div className="scroll-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Job #</th>
                        <th>Requestor</th>
                        <th>Source</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Started</th>
                        <th>Completed</th>
                        <th>Hours Open</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openOrderJobs.map((job) => (
                        <tr key={job.id}>
                          <td>{job.job_number}</td>
                          <td>{job.requestor_name}</td>
                          <td>{job.request_source}</td>
                          <td>{job.request_category}</td>
                          <td>{job.status}</td>
                          <td>{formatDateTime(job.created_at)}</td>
                          <td>{formatDateTime(job.start_time)}</td>
                          <td>{formatDateTime(job.complete_time)}</td>
                          <td>{getHoursOpen(job)}</td>
                          <td>
                            <button onClick={() => setSelectedOrderJobId(job.id)}>
                              Review
                            </button>

                            <button onClick={() => generateJobReleaseDocument(job)}>
                              Generate Release
                            </button>

                            <button onClick={() => acceptJob(job.id)}>
                              Accept Job
                            </button>

                            <button onClick={() => startJob(job.id)}>
                              Start Job
                            </button>

                            <button onClick={() => completeJob(job.id)}>
                              Complete Job
                            </button>

                            <button onClick={() => closeJob(job.id)}>
                              Close Job
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3>Customer Inventory Move Queue</h3>
              <p>
                Queue items are created automatically when inventory is
                allocated to a job.
              </p>

              {inventoryMoveQueue.length === 0 ? (
                <p>No inventory move queue items yet.</p>
              ) : (
                <div className="scroll-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Move ID</th>
                        <th>Job #</th>
                        <th>Status</th>
                        <th>Inventory ID</th>
                        <th>Customer</th>
                        <th>Part #</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Available</th>
                        <th>Requested</th>
                        <th>Moved</th>
                        <th>Shortage</th>
                        <th>Created</th>
                        <th>Verified</th>
                        <th>Moving</th>
                        <th>Staged</th>
                        <th>Completed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryMoveQueue.map((move) => (
                        <tr key={move.id}>
                          <td>{move.id}</td>
                          <td>{move.jobNumber}</td>
                          <td>{move.status}</td>
                          <td>{move.inventoryId}</td>
                          <td>{move.customer}</td>
                          <td>{move.partNumber}</td>
                          <td>{move.description}</td>
                          <td>{move.location}</td>
                          <td>{move.availableQty}</td>
                          <td>{move.requestedQty}</td>
                          <td>{move.movedQty}</td>
                          <td>
                            {move.shortage ? (
                              <span style={{ color: "red", fontWeight: "bold" }}>
                                Short
                              </span>
                            ) : (
                              "OK"
                            )}
                          </td>
                          <td>{formatDateTime(move.createdAt)}</td>
                          <td>{formatDateTime(move.verifiedAt)}</td>
                          <td>{formatDateTime(move.movingAt)}</td>
                          <td>{formatDateTime(move.stagedAt)}</td>
                          <td>{formatDateTime(move.completedAt)}</td>
                          <td>
                            {move.status === "Open" && (
                              <button
                                onClick={() =>
                                  updateInventoryMoveStatus(move.id, "Verified")
                                }
                              >
                                Verify
                              </button>
                            )}
                            {move.status === "Verified" && (
                              <button
                                onClick={() =>
                                  updateInventoryMoveStatus(move.id, "Moving")
                                }
                              >
                                Start Move
                              </button>
                            )}
                            {move.status === "Moving" && (
                              <button
                                onClick={() =>
                                  updateInventoryMoveStatus(move.id, "Staged")
                                }
                              >
                                Stage
                              </button>
                            )}
                            {move.status === "Staged" && (
                              <button
                                onClick={() =>
                                  updateInventoryMoveStatus(move.id, "Complete")
                                }
                              >
                                Complete
                              </button>
                            )}
                            {canDeleteJobs && (
                              <button
                                onClick={() =>
                                  deleteInventoryMoveQueueItem(move.id)
                                }
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedOrderJobId && (
              <div className="card">
                {(() => {
                  const selectedJob = jobs.find(
                    (job) => job.id === selectedOrderJobId
                  );
                  const selectedWork = getJobWorkSelections(selectedOrderJobId);

                  if (!selectedJob) return <p>Selected job not found.</p>;

                  return (
                    <>
                      <h3>Pre-Start Review: {selectedJob.job_number}</h3>
                      <p>
                        <strong>Requestor:</strong> {selectedJob.requestor_name}
                      </p>
                      <p>
                        <strong>Category:</strong> {selectedJob.request_category}
                      </p>
                      <p>
                        <strong>Notes:</strong> {selectedJob.notes}
                      </p>

                      <h4>Inventory Allocation</h4>
                      <p>
                        Allocate inventory to this job before Pick Confirmed.
                        Quantity cannot exceed available inventory.
                      </p>

                      <div className="grid">
                        <div>
                          <label>Job #</label>
                          <input
                            value={
                              allocationForm.jobNumber || selectedJob.job_number
                            }
                            onChange={(e) =>
                              setAllocationForm({
                                ...allocationForm,
                                jobNumber: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>Inventory ID</label>
                          <input
                            placeholder="Scan or enter Inventory ID"
                            value={allocationForm.inventoryId}
                            onChange={(e) =>
                              setAllocationForm({
                                ...allocationForm,
                                inventoryId: e.target.value.trim(),
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>
                            Allocate Qty{" "}
                            {selectedAllocationItem &&
                              `(Available: ${selectedAllocationItem.quantity})`}
                          </label>
                          <input
                            type="number"
                            value={allocationForm.allocateQty}
                            onChange={(e) =>
                              setAllocationForm({
                                ...allocationForm,
                                allocateQty: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {selectedAllocationItem && (
                        <div className="inventory-preview">
                          <strong>Selected Inventory</strong>
                          <p>Customer: {selectedAllocationItem.customer}</p>
                          <p>Part #: {selectedAllocationItem.partNumber}</p>
                          <p>
                            Description: {selectedAllocationItem.description}
                          </p>
                          <p>Available Qty: {selectedAllocationItem.quantity}</p>
                          <p>
                            Location:{" "}
                            {selectedAllocationItem.site === "AM"
                              ? `A&M Tag: ${selectedAllocationItem.amTag}`
                              : selectedAllocationItem.locationDetail}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          allocateInventoryToJob(selectedJob.job_number)
                        }
                      >
                        Allocate Inventory
                      </button>

                      <h4>Uncaptured Work Functions</h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        {uncapturedWorkOptions.map((option) => (
                          <label
                            key={option}
                            style={{
                              border: "1px solid #cbd5e1",
                              padding: "8px",
                              borderRadius: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWork.includes(option)}
                              onChange={() =>
                                toggleJobWorkSelection(
                                  selectedOrderJobId,
                                  option
                                )
                              }
                            />{" "}
                            {option}
                          </label>
                        ))}
                      </div>

                      <div style={{ marginTop: "15px" }}>
                        <button
                          onClick={() => generateJobReleaseDocument(selectedJob)}
                        >
                          Generate INTRAL Job Release / Pick Authorization
                        </button>
                        <button onClick={() => setSelectedOrderJobId(null)}>
                          Close Review
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {tab === "inventory" && canSeeInventory && (
          <div>
            <div className="card">
              <h2>Inventory Control Center</h2>
              <div className="inventory-subtabs">
                <button
                  className={inventorySection === "list" ? "active" : ""}
                  onClick={() => setInventorySection("list")}
                >
                  Inventory List
                </button>
                <button
                  className={
                    inventorySection === "locationView" ? "active" : ""
                  }
                  onClick={() => setInventorySection("locationView")}
                >
                  📍 Location View
                </button>
                {canReceiveInventory && (
                  <button
                    className={inventorySection === "labels" ? "active" : ""}
                    onClick={() => setInventorySection("labels")}
                  >
                    Labels
                  </button>
                )}
                {canReceiveInventory && (
                  <button
                    className={inventorySection === "receiving" ? "active" : ""}
                    onClick={() => setInventorySection("receiving")}
                  >
                    Receiving
                  </button>
                )}
                {canMoveInventory && (
                  <button
                    className={inventorySection === "moving" ? "active" : ""}
                    onClick={() => setInventorySection("moving")}
                  >
                    Transfer
                  </button>
                )}
                {!isCustomer && (
                  <button
                    className={inventorySection === "history" ? "active" : ""}
                    onClick={() => setInventorySection("history")}
                  >
                    History
                  </button>
                )}
              </div>
            </div>

            {inventorySection === "list" && (
              <div className="card">
                <h3>Inventory List</h3>
                <input
                  type="text"
                  placeholder="Search by Part Number, Customer, Inventory ID, Job #, Allocated Job #, or A&M Tag"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />

                <div className="scroll-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Inventory ID</th>
                        <th>Job #</th>
                        <th>Customer</th>
                        <th>Part #</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Site</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Allocated Job #</th>
                        <th>Source Inventory ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventoryItems.length === 0 ? (
                        <tr>
                          <td colSpan="11">
                            No matching inventory records found.
                          </td>
                        </tr>
                      ) : (
                        filteredInventoryItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.inventoryId || item.id}</td>
                            <td>{item.jobNumber}</td>
                            <td>{item.customer}</td>
                            <td>{item.partNumber}</td>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{item.site}</td>
                            <td>
                              {item.site === "AM"
                                ? `A&M Tag: ${item.amTag}`
                                : item.locationDetail}
                            </td>
                            <td>{item.status}</td>
                            <td>{item.allocatedJobNumber || "-"}</td>
                            <td>{item.sourceInventoryId || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {inventorySection === "locationView" && (
              <div className="card">
                <h3>📍 Inventory by Location</h3>
                <p>
                  Total Locations: {totalLocations} | Total Units: {totalUnits} |
                  Overloaded: {overloadedLocations}
                </p>

                <div className="scroll-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th>Location</th>
                        <th>Total Quantity</th>
                        <th># of Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationSummary.map((loc, index) => (
                        <tr
                          key={`${loc.site}-${loc.location}-${index}`}
                          onClick={() => setSelectedLocation(loc)}
                        >
                          <td>{loc.site}</td>
                          <td>
                            {loc.site === "AM"
                              ? `A&M Tag: ${loc.location}`
                              : loc.location}
                          </td>
                          <td>{loc.totalQty}</td>
                          <td>{loc.itemCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedLocation && (
                  <div className="card" style={{ marginTop: "20px" }}>
                    <h4>Items in {selectedLocation.location}</h4>
                    <button onClick={() => setSelectedLocation(null)}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}

            {inventorySection === "labels" && canReceiveInventory && (
              <LabelGenerator initialData={labelData} />
            )}

            {inventorySection === "receiving" && canReceiveInventory && (
              <div className="card">
                <h3>Inventory Receiving</h3>
                <InventoryForm onAddInventory={addInventoryItem} />
              </div>
            )}

            {inventorySection === "moving" && canMoveInventory && (
              <div className="card">
                <h3>Inventory Transfer</h3>

                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    background: scanStep === "item" ? "#e0f2fe" : "#dcfce7",
                  }}
                >
                  <strong>
                    {scanStep === "item"
                      ? "🔵 Step 1: Scan Inventory ID"
                      : "🟢 Step 2: Scan Destination Location"}
                  </strong>
                  <input
                    ref={transferScanRef}
                    type="text"
                    placeholder={
                      scanStep === "item"
                        ? "Scan Inventory ID..."
                        : "Scan Destination Location..."
                    }
                    value={transferScanInput}
                    onChange={(e) => setTransferScanInput(e.target.value.trim())}
                    onKeyDown={handleTransferScan}
                  />
                </div>

                {selectedItem && (
                  <div className="inventory-preview">
                    <strong>Inventory Details</strong>
                    <p>Inventory ID: {selectedItem.inventoryId || selectedItem.id}</p>
                    <p>Customer: {selectedItem.customer}</p>
                    <p>Part #: {selectedItem.partNumber}</p>
                    <p>Description: {selectedItem.description}</p>
                    <p>Available Qty: {selectedItem.quantity}</p>
                  </div>
                )}

                <label>Inventory ID</label>
                <input
                  value={moveForm.inventoryId}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      inventoryId: e.target.value.trim(),
                    })
                  }
                />

                <label>
                  Transfer Quantity {selectedItem && `(Max: ${selectedItem.quantity})`}
                </label>
                <input
                  type="number"
                  value={moveForm.moveQty}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      moveQty: e.target.value,
                    })
                  }
                />

                <label>Transfer To Site</label>
                <select
                  value={moveForm.moveToSite}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      moveToSite: e.target.value,
                    })
                  }
                >
                  <option value="">Select New Site</option>
                  <option value="AM">A&M</option>
                  <option value="INTRAL">Intral</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="TRANSIT">In Transit</option>
                </select>

                <label>
                  {moveForm.moveToSite === "AM"
                    ? "New A&M Tag #"
                    : "New Location / Rack / Bin / Area"}
                </label>
                <input
                  value={moveForm.moveToLocation}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      moveToLocation: e.target.value,
                    })
                  }
                />

                <label>Transfer Reason</label>
                <select
                  value={moveForm.moveReason}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      moveReason: e.target.value,
                    })
                  }
                >
                  <option>Storage relocation</option>
                  <option>Customer request</option>
                  <option>Pick staging</option>
                  <option>Correction</option>
                </select>

                <button onClick={moveInventoryItem}>Submit Transfer</button>
              </div>
            )}

            {inventorySection === "history" && !isCustomer && (
              <div className="card">
                <h3>Inventory Transfer History</h3>
                {inventoryItems.every(
                  (item) => !item.moveHistory || item.moveHistory.length === 0
                ) ? (
                  <p>No inventory transfers recorded yet.</p>
                ) : (
                  <div className="scroll-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Inventory ID</th>
                          <th>Qty</th>
                          <th>From</th>
                          <th>To Site</th>
                          <th>To Location</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryItems.flatMap((item) =>
                          (item.moveHistory || []).map((move, index) => (
                            <tr key={`${item.id}-${index}`}>
                              <td>{new Date(move.movedAt).toLocaleString()}</td>
                              <td>{move.movedFromInventoryId}</td>
                              <td>{move.movedQty}</td>
                              <td>{move.movedFromLocation}</td>
                              <td>{move.movedToSite}</td>
                              <td>{move.movedToLocation}</td>
                              <td>{move.reason}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "home" && !isCustomer && (
          <div>
            <div className="card">
              <h2>Live KPI Status</h2>
              <p>
                <strong>Status:</strong> Connected to Supabase realtime
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {lastKpiRefresh.toLocaleString()}
              </p>
              <p>
                <strong>Live Data Source:</strong> Jobs table
              </p>
            </div>

            {canSeeKpis && (
              <div className="grid">
                <div className="card">
                  <h3>Total Transactions</h3>
                  <h1>{totalTransactions}</h1>
                </div>
                <div className="card">
                  <h3>Active Requests</h3>
                  <h1>{activeJobs.length}</h1>
                </div>
                <div className="card">
                  <h3>Over 24 Hrs</h3>
                  <h1>{openOver24Hours}</h1>
                </div>
                <div className="card">
                  <h3>Open Crating</h3>
                  <h1>{openCratingRequests}</h1>
                </div>
                <div className="card">
                  <h3>Total Labor Hours</h3>
                  <h1>{totalLaborHours.toFixed(2)}</h1>
                </div>
                <div className="card">
                  <h3>Txns / Labor Hr</h3>
                  <h1>{transactionsPerLaborHour}</h1>
                </div>
              </div>
            )}

            {canUploadReports && (
              <div className="card">
                <h2>Excel KPI Upload Center</h2>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  multiple
                  onChange={handleFileUpload}
                />
                <button onClick={clearUploadedData}>Clear Uploaded Data</button>
                {uploadedFiles.length > 0 && (
                  <ul>
                    {uploadedFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        {file.name} — {file.rows} rows
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {canSeeKpis && (
              <div className="grid">
                <BarChart title="System Transaction KPIs" data={systemKpiData} />
                <BarChart title="Request Status" data={requestStatusData} />
                <DonutChart title="Labor Hours" data={laborData} />
                <BarChart title="Risk Dashboard" data={riskData} />
                <LineChart
                  title="Request Trend by Submitted Date"
                  data={trendByCreatedDate}
                />
                <BarChart title="Workload by Source" data={workloadBySource} />
                <BarChart title="Top Job Types" data={workloadByJobType} />
              </div>
            )}

            <div className="card">
              <h2>Daily Manager Summary</h2>
              <p>Completed: {filteredCompleted}</p>
              <p>Open / Active: {filteredOpen}</p>
              <p>Over 24 Hours: {filteredOver24}</p>
            </div>

            <div className="card">
              <h2>Top Oldest Active Requests</h2>
              {topOldestRequests.length === 0 ? (
                <p>No active requests.</p>
              ) : (
                <div className="scroll-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Job #</th>
                        <th>Source</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Hours Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topOldestRequests.map((job) => (
                        <tr key={job.id}>
                          <td>{job.job_number}</td>
                          <td>{job.request_source}</td>
                          <td>{job.request_category}</td>
                          <td>{job.status}</td>
                          <td>{getHoursOpen(job)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "capture" && (
          <div>
            {isCustomer && (
              <div className="card">
                <strong>Customer Portal:</strong> Submit requests, track status,
                and view inventory.
              </div>
            )}

            {isCustomer && lastSubmittedJob && (
              <div className="card green">
                <h3>Request Submitted Successfully</h3>
                <p>
                  <strong>Job #:</strong> {lastSubmittedJob.job_number}
                </p>
                <p>
                  <strong>Requestor:</strong> {lastSubmittedJob.requestor_name}
                </p>
                <p>
                  <strong>Status:</strong> {lastSubmittedJob.status}
                </p>
              </div>
            )}

            <div className="card">
              <h2>{isCustomer ? "Customer Request Portal" : "Add Work Request"}</h2>

              <input
                placeholder="Job # (Optional)"
                value={form.jobNumber}
                onChange={(e) =>
                  setForm({ ...form, jobNumber: e.target.value })
                }
              />

              <input
                placeholder="Charge Number (Optional)"
                value={form.chargeNumber}
                onChange={(e) =>
                  setForm({ ...form, chargeNumber: e.target.value })
                }
              />

              <input
                placeholder="Requestor Name"
                value={form.requestorName}
                onChange={(e) =>
                  setForm({ ...form, requestorName: e.target.value })
                }
              />

              <input
                placeholder="Requestor Email"
                type="email"
                value={form.requestorEmail}
                onChange={(e) =>
                  setForm({ ...form, requestorEmail: e.target.value })
                }
              />

              <h3>Ship From</h3>

              <input
                placeholder="Ship From Company / Contact"
                value={form.shipFromCompany}
                onChange={(e) =>
                  setForm({ ...form, shipFromCompany: e.target.value })
                }
              />

              <input
                placeholder="Ship From Address"
                value={form.shipFromAddress}
                onChange={(e) =>
                  setForm({ ...form, shipFromAddress: e.target.value })
                }
              />

              <input
                placeholder="Ship From Zip Code"
                value={form.shipFromZip}
                onChange={(e) =>
                  setForm({ ...form, shipFromZip: e.target.value })
                }
              />

              <h3>Ship To</h3>

              <input
                placeholder="Ship To Company / Contact"
                value={form.shipToCompany}
                onChange={(e) =>
                  setForm({ ...form, shipToCompany: e.target.value })
                }
              />

              <input
                placeholder="Ship To Address"
                value={form.shipToAddress}
                onChange={(e) =>
                  setForm({ ...form, shipToAddress: e.target.value })
                }
              />

              <input
                placeholder="Ship To Zip Code"
                value={form.shipToZip}
                onChange={(e) =>
                  setForm({ ...form, shipToZip: e.target.value })
                }
              />

              <input
                placeholder="Ship To Contact Name"
                value={form.shipToContactName}
                onChange={(e) =>
                  setForm({ ...form, shipToContactName: e.target.value })
                }
              />

              <input
                placeholder="Ship To Contact Phone"
                value={form.shipToContactPhone}
                onChange={(e) =>
                  setForm({ ...form, shipToContactPhone: e.target.value })
                }
              />

              <input
                placeholder="Ship To Contact Email"
                type="email"
                value={form.shipToContactEmail}
                onChange={(e) =>
                  setForm({ ...form, shipToContactEmail: e.target.value })
                }
              />

              {canManageWork && (
                <select
                  value={form.requestSource}
                  onChange={(e) =>
                    setForm({ ...form, requestSource: e.target.value })
                  }
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
                onChange={(e) =>
                  setForm({ ...form, requestCategory: e.target.value })
                }
              >
                <option value="">Select Job Request</option>
                <option>Shipping Request</option>
                <option>Crating Request</option>
                <option>Heavy Labor Support</option>
                <option>Movement Request</option>
                <option>Inventory Support</option>
                <option>Kitting Support</option>
                <option>Receiving Support</option>
                <option>General Support</option>
              </select>

              {!isCustomer && (
                <select
                  value={form.jobType}
                  onChange={(e) =>
                    setForm({ ...form, jobType: e.target.value })
                  }
                >
                  <option value="">Select Job Type</option>
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
              )}

              {canSeeKpis && (
                <>
                  <label>
                    Chargeable
                    <input
                      type="checkbox"
                      checked={form.chargeable}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          chargeable: e.target.checked,
                        })
                      }
                    />
                  </label>

                  <input
                    placeholder="Internal Charge Code"
                    value={form.chargeCode}
                    onChange={(e) =>
                      setForm({ ...form, chargeCode: e.target.value })
                    }
                  />
                </>
              )}

              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />

              <input
                placeholder={
                  isCustomer ? "Request Details" : "Notes / Internal Details"
                }
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
              />

              <button onClick={addJob}>
                {isCustomer ? "Submit Request" : "Add Request"}
              </button>
            </div>

            <h2>{isCustomer ? "My Open Job Requests" : "Work Request Table"}</h2>

            {canSeeKpis && <button onClick={exportCSV}>Export CSV</button>}

            <div className="scroll-table">
              <table>
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Charge #</th>
                    <th>Requestor</th>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Category</th>
                    {!isCustomer && <th>Job</th>}
                    {canSeeKpis && <th>Chargeable</th>}
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Hours Open</th>
                    {!isCustomer && <th>Alert</th>}
                    {canSeeKpis && <th>Minutes</th>}
                    {canManageWork && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs
                    .filter((j) => j.status !== ORDER_STATUSES.SHIPPED)
                    .map((j) => (
                      <tr key={j.id}>
                        <td>{j.job_number}</td>
                        <td>{j.charge_number}</td>
                        <td>{j.requestor_name}</td>
                        <td>{j.requestor_email}</td>
                        <td>{j.request_source}</td>
                        <td>{j.request_category}</td>
                        {!isCustomer && <td>{j.job_type}</td>}
                        {canSeeKpis && <td>{j.chargeable ? "Yes" : "No"}</td>}
                        <td>{j.status}</td>
                        <td>{formatDateTime(j.created_at)}</td>
                        <td>{formatDateTime(j.start_time)}</td>
                        <td>{formatDateTime(j.complete_time)}</td>
                        <td>{getHoursOpen(j)}</td>

                        {!isCustomer && (
                          <td>
                            {isOpenOver24Hours(j) ? (
                              <span
                                style={{
                                  color: "red",
                                  fontWeight: "bold",
                                }}
                              >
                                ⚠ Over 24 Hrs
                              </span>
                            ) : (
                              <span style={{ color: "green" }}>On Track</span>
                            )}
                          </td>
                        )}

                        {canSeeKpis && <td>{j.actual_minutes}</td>}

                        {canManageWork && (
                          <td>
                            <button onClick={() => acceptJob(j.id)}>
                              Accept Job
                            </button>

                            <button onClick={() => startJob(j.id)}>
                              Start Job
                            </button>

                            <button onClick={() => completeJob(j.id)}>
                              Complete Job
                            </button>

                            <button onClick={() => closeJob(j.id)}>
                              Close Job
                            </button>

                            {canDeleteJobs && (
                              <button onClick={() => deleteJob(j.id)}>
                                Delete
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
