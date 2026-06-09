import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/intral-logo.jpg";

const additionalWorkOptions = [
  "Add forklift support",
  "Add labor support",
  "Add stretch wrap / strap work",
  "Add crating review",
  "Add carrier coordination",
  "Add special handling instructions",
];

function OrderCentralWorkspace({ orderMode = "dashboard", orders = [], setOrders }) {
  const [selectedJobNumber, setSelectedJobNumber] = useState(() => {
    return localStorage.getItem("intral-connect-selected-jo") || "";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedWorkItems, setCheckedWorkItems] = useState([]);
  const [message, setMessage] = useState("");
  const [expandedSection, setExpandedSection] = useState("queue");
  const [savedInvoices, setSavedInvoices] = useState({});
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    invoiceAmount: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    billingNotes: "",
  });

  const ordersPerPage = 5;

  useEffect(() => {
    if (selectedJobNumber) {
      localStorage.setItem("intral-connect-selected-jo", selectedJobNumber);
    } else {
      localStorage.removeItem("intral-connect-selected-jo");
    }
  }, [selectedJobNumber]);

  useEffect(() => {
    setCurrentPage(1);

    if (orderMode === "open" || orderMode === "released" || orderMode === "closed") {
      setExpandedSection("queue");
    }

    if (orderMode === "view") setExpandedSection("governance");
    if (orderMode === "addWork") setExpandedSection("additionalWork");
    if (orderMode === "pickList") setExpandedSection("pickList");
    if (orderMode === "invoice") setExpandedSection("invoice");
    if (orderMode === "release") setExpandedSection("release");
  }, [orderMode]);

  const openOrders = useMemo(() => {
    return orders.filter((item) => item.releaseStatus === "Open");
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter((item) => item.releaseStatus === "Active");
  }, [orders]);

  const closedOrders = useMemo(() => {
    return orders.filter((item) => item.releaseStatus === "Closed");
  }, [orders]);

  const selectedJob = useMemo(() => {
    return orders.find((item) => item.joNumber === selectedJobNumber) || null;
  }, [orders, selectedJobNumber]);

  const activeList = useMemo(() => {
    if (orderMode === "released") return activeOrders;
    if (orderMode === "closed") return closedOrders;
    return openOrders;
  }, [orderMode, openOrders, activeOrders, closedOrders]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return activeList.slice(startIndex, endIndex);
  }, [activeList, currentPage]);

  const totalPages = Math.ceil(activeList.length / ordersPerPage);

  const getDefaultSectionForMode = () => {
    if (orderMode === "addWork") return "additionalWork";
    if (orderMode === "pickList") return "pickList";
    if (orderMode === "invoice") return "invoice";
    if (orderMode === "release") return "release";
    return "governance";
  };

  const selectJob = (job) => {
    setSelectedJobNumber((current) =>
      current === job.joNumber ? "" : job.joNumber
    );
    setExpandedSection(getDefaultSectionForMode());
  };

  const updateInvoiceForm = (field, value) => {
    setInvoiceForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getActiveInvoice = () => {
    if (!selectedJob) return invoiceForm;

    return {
      ...invoiceForm,
      ...(savedInvoices[selectedJob.joNumber] || {}),
    };
  };

  const getInvoiceNumber = () => {
    if (!selectedJob) return invoiceForm.invoiceNumber;

    const activeInvoice = getActiveInvoice();

    if (activeInvoice.invoiceNumber) return activeInvoice.invoiceNumber;

    const source = String(selectedJob.joNumber || "000000").replace(/\D/g, "");
    return `INV-${source.padStart(6, "0").slice(-6)}`;
  };

  const getInvoiceAmountDisplay = (value) => {
    const amount = Number(value || 0);

    if (!amount) return "$0.00 USD";

    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    }) + " USD";
  };

  const getViewTitle = () => {
    if (orderMode === "released") return "Active Orders";
    if (orderMode === "closed") return "Closed Orders";
    return "Open Orders";
  };

  const getAllocationDisplay = (job) => {
    if (!job.allocationRequired) return "Not Required";
    if (job.allocationConfirmed) return "Confirmed";
    return "Required - Pending Confirmation";
  };

  const getRequestSource = (job) => {
    if (!job) return "Internal";
    return job.requestSource || job.source || (job.isGuestRequest ? "Guest Portal" : "Internal");
  };

  const getReviewStatus = (job) => {
    if (!job) return "Pending";
    return job.reviewStatus || job.governanceStatus || "Approved";
  };

  const isPendingInternalReview = (job) => {
    return getReviewStatus(job) === "Pending Internal Review";
  };

  const isCustomerRequest = (job) => {
    const source = getRequestSource(job).toLowerCase();
    return source.includes("guest") || source.includes("customer");
  };

  const customerRequestOrders = orders
    .filter((item) => isCustomerRequest(item))
    .sort((a, b) => {
      const aPending = isPendingInternalReview(a) ? 0 : 1;
      const bPending = isPendingInternalReview(b) ? 0 : 1;

      if (aPending !== bPending) return aPending - bPending;

      return String(a.joNumber || "").localeCompare(String(b.joNumber || ""));
    });

  const pendingCustomerReviewCount = customerRequestOrders.filter((job) =>
    isPendingInternalReview(job)
  ).length;

  const getGovernanceBadgeStyle = (type) => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "999px",
      padding: "5px 9px",
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    };

    if (type === "customer") {
      return {
        ...baseStyle,
        background: "#2563eb",
border: "1px solid #60a5fa",
color: "#ffffff",
      };
    }

    if (type === "pending") {
      return {
        ...baseStyle,
        background: "#f59e0b",
border: "1px solid #fbbf24",
color: "#111827",
      };
    }

    if (type === "approved") {
      return {
        ...baseStyle,
        background: "#16a34a",
border: "1px solid #86efac",
color: "#ffffff",
      };
    }

    if (type === "released") {
      return {
        ...baseStyle,
        background: "#7c3aed",
border: "1px solid #c4b5fd",
color: "#ffffff",
      };
    }

    return {
      ...baseStyle,
      background: "rgba(71, 85, 105, 0.18)",
      border: "1px solid rgba(148, 163, 184, 0.35)",
      color: "#cbd5e1",
    };
  };

  const getReviewBadgeType = (job) => {
    if (!job) return "default";
    if (job.releaseStatus === "Active") return "released";
    if (job.releaseStatus === "Closed") return "released";
    if (isPendingInternalReview(job)) return "pending";
    if (getReviewStatus(job) === "Approved") return "approved";
    return "default";
  };

  const renderGovernanceBadge = (label, type = "default") => {
    return <span style={getGovernanceBadgeStyle(type)}>{label}</span>;
  };

  const approveSelectedJobReview = () => {
    if (!selectedJob) {
      alert("Select one JO before approving internal review.");
      return;
    }

    if (!isPendingInternalReview(selectedJob)) {
      alert("This job is not pending internal review.");
      return;
    }

    const confirmed = window.confirm(
      `Approve internal review for ${selectedJob.joNumber}?\n\nThis will allow the request to continue through allocation and release governance.`
    );

    if (!confirmed) return;

    const updatedOrders = orders.map((item) =>
      item.joNumber === selectedJob.joNumber
        ? {
            ...item,
            reviewStatus: "Approved",
            reviewedAt: new Date().toISOString(),
          }
        : item
    );

    setOrders(updatedOrders);
    setMessage(`${selectedJob.joNumber} internal review approved.`);
    setExpandedSection("allocation");
  };

  const canReleaseJob = (job) => {
    if (!job) return false;
    if (job.releaseStatus !== "Open") return false;
    if (isPendingInternalReview(job)) return false;
    if (job.allocationRequired && !job.allocationConfirmed) return false;
    return true;
  };

  const generateSoNumber = () => {
    const nextNumber = orders.filter((item) => item.soNumber).length + 100;
    return `SO-${String(nextNumber).padStart(6, "0")}`;
  };

  const formatStgLocation = (soNumber) => {
    return `STG-${String(soNumber || "").replace("-", "")}`;
  };

  const getSoPreview = () => {
    if (!selectedJob) return "-";
    if (selectedJob.soNumber) return selectedJob.soNumber;
    return generateSoNumber();
  };

  const confirmAllocation = () => {
    if (!selectedJob) {
      alert("Select one job first from View Orders.");
      return;
    }

    if (!selectedJob.allocationRequired) {
      alert("This job order does not require allocation.");
      return;
    }

    if (selectedJob.allocationConfirmed) {
      alert("Allocation is already confirmed for this job order.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm allocation for Job Order # ${selectedJob.joNumber}?`
    );

    if (!confirmed) return;

    const updatedOrders = orders.map((item) =>
      item.joNumber === selectedJob.joNumber
        ? {
            ...item,
            allocationConfirmed: true,
            inventoryDetails: item.inventoryDetails
              ? {
                  ...item.inventoryDetails,
                  allocationStatus: "Confirmed",
                }
              : item.inventoryDetails,
          }
        : item
    );

    setOrders(updatedOrders);
    setExpandedSection("release");
    setMessage(`${selectedJob.joNumber} allocation confirmed. Release is now allowed.`);
  };

  const releaseSelectedJob = () => {
    if (!selectedJob) {
      alert("Select one job first from View Orders, then choose Action > Release.");
      return;
    }

    if (selectedJob.releaseStatus !== "Open") {
      alert("This job has already been released or closed. It cannot be released again.");
      return;
    }

    if (isPendingInternalReview(selectedJob)) {
      alert("Internal review must be approved before this job can be released.");
      setExpandedSection("governance");
      return;
    }

    if (selectedJob.soNumber) {
      alert("SO number already exists for this job. Duplicate release is blocked.");
      return;
    }

    if (selectedJob.allocationRequired && !selectedJob.allocationConfirmed) {
      alert("Allocation must be confirmed before release.");
      return;
    }

    if (checkedWorkItems.length > 0) {
      alert(
        "Additional work selections are pending submission. Please submit additional work before releasing this job."
      );
      setExpandedSection("additionalWork");
      return;
    }

    const confirmed = window.confirm(
      `Confirm Job Release\n\nPlease verify:\n\n• All additional work has been included\n• Allocation is confirmed if required\n• Shipping destination details are complete\n• Special handling / crating instructions are attached\n• Documentation is accurate for operational execution\n\nThis action will generate the SO number, assign staging, and release work into Shipping Operations.\n\nRelease Job Order # ${selectedJob.joNumber}?`
    );

    if (!confirmed) return;

    const newSoNumber = selectedJob.soNumber || generateSoNumber();
    const newStagingLocation =
      selectedJob.stagingLocation || formatStgLocation(newSoNumber);
    const originalPullLocation =
      selectedJob.originalLocation ||
      selectedJob.inventoryDetails?.pullFromLocation ||
      "";

    const updatedOrders = orders.map((item) =>
      item.joNumber === selectedJob.joNumber
        ? {
            ...item,
            releaseStatus: "Active",
            soNumber: newSoNumber,
            stagingLocation: newStagingLocation,
            originalLocation: originalPullLocation,
            releasedAt: new Date().toISOString(),
          }
        : item
    );

    setOrders(updatedOrders);
    setSelectedJobNumber(selectedJob.joNumber);
    setExpandedSection("queue");
    setMessage(
      `${newSoNumber} generated and staged to ${newStagingLocation}. Release is locked and work is waiting for Active Orders confirmation.`
    );
  };

  const toggleWorkItem = (workItem) => {
    setCheckedWorkItems((prev) =>
      prev.includes(workItem)
        ? prev.filter((item) => item !== workItem)
        : [...prev, workItem]
    );
  };

  const saveAdditionalWork = () => {
    if (!selectedJob) {
      alert("Select one job first from View Orders, then choose Action > Add Additional Work.");
      return;
    }

    if (checkedWorkItems.length === 0) {
      alert("Select at least one additional work item.");
      return;
    }

    const updatedOrders = orders.map((item) =>
      item.joNumber === selectedJob.joNumber
        ? {
            ...item,
            additionalWork: [
              ...(item.additionalWork || []),
              ...checkedWorkItems,
            ],
          }
        : item
    );

    setOrders(updatedOrders);
    setCheckedWorkItems([]);
    setExpandedSection("governance");
    setMessage(`Additional work added to ${selectedJob.joNumber}.`);
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection((current) => (current === sectionKey ? "" : sectionKey));
  };

  const getSectionStatus = (sectionKey) => {
    if (sectionKey === "queue") return `${activeList.length} Records`;
    if (sectionKey === "customerQueue") return `${customerRequestOrders.length} Records`;
    if (!selectedJob) return "Waiting";
    if (sectionKey === "governance") return isPendingInternalReview(selectedJob) ? "Review Required" : selectedJob.releaseStatus;
    if (sectionKey === "allocation") return getAllocationDisplay(selectedJob);
    if (sectionKey === "additionalWork") {
      return selectedJob.additionalWork?.length > 0 ? "Attached" : "Optional";
    }
    if (sectionKey === "pickList") return "Printable";
    if (sectionKey === "invoice") return savedInvoices[selectedJob.joNumber] ? "Saved" : "Optional";
    if (sectionKey === "release") return canReleaseJob(selectedJob) ? "Allowed" : "Blocked";
    return "";
  };

  const renderAccordionHeader = (sectionKey, title, subtitle) => {
    const isOpen = expandedSection === sectionKey;

    return (
      <button
        type="button"
        className={isOpen ? "phase17-accordion-header open" : "phase17-accordion-header"}
        onClick={() => toggleSection(sectionKey)}
      >
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>

        <div className="phase17-accordion-right">
          <small>{getSectionStatus(sectionKey)}</small>
          <b>{isOpen ? "−" : "+"}</b>
        </div>
      </button>
    );
  };

  const renderKpisOnly = () => {
    return (
      <div className="inventory-kpi-grid order-workbench-kpi-grid">
        <div className="inventory-kpi-card">
          <span>Open Orders</span>
          <h2>{openOrders.length}</h2>
          <p>Pending release review</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Active Orders</span>
          <h2>{activeOrders.length}</h2>
          <p>SO generated and staged for execution</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Closed Orders</span>
          <h2>{closedOrders.length}</h2>
          <p>Completed order records</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Customer Requests</span>
          <h2>{customerRequestOrders.length}</h2>
          <p>Guest / customer submitted work</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Pending Customer Reviews</span>
          <h2>{pendingCustomerReviewCount}</h2>
          <p>Customer requests awaiting approval</p>
        </div>
      </div>
    );
  };

  const renderCustomerRequestQueueSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "customerQueue",
          "Customer Request Queue",
          "Guest and customer submitted requests requiring governance review"
        )}

        {expandedSection === "customerQueue" && (
          <div className="phase17-accordion-body">
            <table className="inventory-table order-workbench-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>JO #</th>
                  <th>Customer</th>
                  <th>Requestor</th>
                  <th>Source</th>
                  <th>Review Status</th>
                  <th>Job Type</th>
                  <th>Release Status</th>
                </tr>
              </thead>

              <tbody>
                {customerRequestOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8">No customer requests found.</td>
                  </tr>
                ) : (
                  customerRequestOrders.map((job) => (
                    <tr
                      key={`customer-${job.joNumber}`}
                      className={selectedJobNumber === job.joNumber ? "selected-row" : ""}
                      onClick={() => selectJob(job)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedJobNumber === job.joNumber}
                          onChange={() => selectJob(job)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>

                      <td>{job.joNumber}</td>
                      <td>{job.customer || "-"}</td>
                      <td>{job.requestor || "-"}</td>
                      <td>
                        {renderGovernanceBadge(
                          getRequestSource(job),
                          isCustomerRequest(job) ? "customer" : "default"
                        )}
                      </td>
                      <td>
                        {renderGovernanceBadge(
                          getReviewStatus(job),
                          getReviewBadgeType(job)
                        )}
                      </td>
                      <td>{job.jobType || "-"}</td>
                      <td>
                        {renderGovernanceBadge(
                          job.releaseStatus || "-",
                          job.releaseStatus === "Active" || job.releaseStatus === "Closed"
                            ? "released"
                            : "default"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderOrderQueueSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "queue",
          getViewTitle(),
          "Select one JO to review, govern, add work, or release"
        )}

        {expandedSection === "queue" && (
          <div className="phase17-accordion-body">
            <table className="inventory-table order-workbench-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>JO #</th>
                  <th>Requestor</th>
                  <th>Job Type</th>
                  <th>Details</th>
                  <th>Source</th>
                  <th>Review Status</th>
                  <th>Allocation</th>
                  <th>Inventory ID</th>
                  <th>Original Pull From</th>
                  <th>STG Location</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11">No orders found.</td>
                  </tr>
                ) : (
                  paginatedOrders.map((job) => (
                    <tr
                      key={job.joNumber}
                      className={selectedJobNumber === job.joNumber ? "selected-row" : ""}
                      onClick={() => selectJob(job)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedJobNumber === job.joNumber}
                          onChange={() => selectJob(job)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>

                      <td>{job.joNumber}</td>
                      <td>{job.requestor}</td>
                      <td>{job.jobType}</td>
                      <td>{job.details}</td>
                      <td>{getRequestSource(job)}</td>
                      <td>{getReviewStatus(job)}</td>
                      <td>{getAllocationDisplay(job)}</td>
                      <td>{job.inventoryDetails?.inventoryId || "-"}</td>
                      <td>{job.inventoryDetails?.pullFromLocation || "-"}</td>
                      <td>{job.stagingLocation || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {activeList.length > ordersPerPage && (
              <div className="order-pagination-row">
                <button
                  className="inventory-primary-button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages || 1}
                </span>

                <button
                  className="inventory-primary-button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSelectedGovernanceSection = () => {
    if (!selectedJob) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "governance",
          "Selected JO Governance",
          "Review request identity, status, customer, and release readiness"
        )}

        {expandedSection === "governance" && (
          <div className="phase17-accordion-body">
            {isCustomerRequest(selectedJob) && (
              <div
                className="dashboard-message"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                {renderGovernanceBadge("Customer Request", "customer")}
                {renderGovernanceBadge(
                  getReviewStatus(selectedJob),
                  getReviewBadgeType(selectedJob)
                )}
                <span style={{ fontWeight: 900 }}>
                  Internal review required before release.
                </span>
              </div>
            )}

            <div className="order-release-summary-grid order-workbench-field-grid">
              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{selectedJob.joNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>Requestor</span>
                <strong>{selectedJob.requestor}</strong>
              </div>

              <div className="order-detail-field">
                <span>Customer</span>
                <strong>{selectedJob.customer}</strong>
              </div>

              <div className="order-detail-field">
                <span>Request Source</span>
                <strong>
                  {renderGovernanceBadge(
                    getRequestSource(selectedJob),
                    isCustomerRequest(selectedJob) ? "customer" : "default"
                  )}
                </strong>
              </div>

              <div className="order-detail-field">
                <span>Review Status</span>
                <strong>
                  {renderGovernanceBadge(
                    getReviewStatus(selectedJob),
                    getReviewBadgeType(selectedJob)
                  )}
                </strong>
              </div>

              <div className="order-detail-field">
                <span>Request Origin</span>
                <strong>
                  {renderGovernanceBadge(
                    isCustomerRequest(selectedJob) ? "Customer Request" : "Internal Request",
                    isCustomerRequest(selectedJob) ? "customer" : "default"
                  )}
                </strong>
              </div>

              <div className="order-detail-field">
                <span>Job Type</span>
                <strong>{selectedJob.jobType}</strong>
              </div>

              <div className="order-detail-field">
                <span>Priority</span>
                <strong>{selectedJob.priority}</strong>
              </div>

              <div className="order-detail-field">
                <span>Status</span>
                <strong>{selectedJob.releaseStatus}</strong>
              </div>

              <div className="order-detail-field">
                <span>Ship To / Destination</span>
                <strong>{selectedJob.shipTo}</strong>
              </div>

              <div className="order-detail-field">
                <span>SO Number</span>
                <strong>{selectedJob.soNumber || "Not Released"}</strong>
              </div>

              <div className="order-detail-field">
                <span>STG Location</span>
                <strong>{selectedJob.stagingLocation || "Generated at release"}</strong>
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Request Details</h3>
              <p>{selectedJob.details}</p>
            </div>

            {isPendingInternalReview(selectedJob) && (
              <div className="order-detail-section compact-order-section">
                <h3>Pending Internal Review</h3>
                <p>
                  This request originated from a customer / guest workflow and must
                  be reviewed before allocation or release.
                </p>

                <button
                  className="inventory-primary-button"
                  onClick={approveSelectedJobReview}
                >
                  Approve Internal Review
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAllocationSection = () => {
    if (!selectedJob) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "allocation",
          "Allocation Gate",
          "Confirm inventory allocation before release when required"
        )}

        {expandedSection === "allocation" && (
          <div className="phase17-accordion-body">
            {selectedJob.inventoryDetails && (
              <div className="order-release-mini-grid order-workbench-mini-grid">
                <div>
                  <span>Inventory ID</span>
                  <strong>{selectedJob.inventoryDetails.inventoryId}</strong>
                </div>

                <div>
                  <span>Part #</span>
                  <strong>{selectedJob.inventoryDetails.partNumber}</strong>
                </div>

                <div>
                  <span>Sub-Inventory</span>
                  <strong>{selectedJob.inventoryDetails.subInventory}</strong>
                </div>

                <div>
                  <span>Original Pull From</span>
                  <strong>{selectedJob.inventoryDetails.pullFromLocation}</strong>
                </div>

                <div>
                  <span>Qty</span>
                  <strong>{selectedJob.inventoryDetails.requestedQty}</strong>
                </div>

                <div>
                  <span>Deliver To</span>
                  <strong>{selectedJob.inventoryDetails.destinationLocation}</strong>
                </div>
              </div>
            )}

            {!selectedJob.allocationRequired && (
              <div className="order-detail-section compact-order-section">
                <h3>Allocation Not Required</h3>
                <p>Release is allowed for this job order.</p>
              </div>
            )}

            {selectedJob.allocationRequired && selectedJob.allocationConfirmed && (
              <div className="order-detail-section compact-order-section">
                <h3>Allocation Confirmed</h3>
                <p>Allocation has been confirmed. Release is allowed.</p>
              </div>
            )}

            {selectedJob.allocationRequired && !selectedJob.allocationConfirmed && (
              <div className="order-detail-section compact-order-section">
                <h3>Allocation Required</h3>
                <p>
                  This job order requires allocation. Confirm allocation before SO/STG release.
                </p>

                <button className="inventory-primary-button" onClick={confirmAllocation}>
                  Confirm Allocation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isAMCratingJob = (job) => {
    if (!job) return false;

    const searchableText = [
      job.shipTo,
      job.finalDestination,
      job.details,
      job.additionalDetails,
      ...(job.additionalWork || []),
      job.inventoryDetails?.destinationLocation,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes("a&m") || searchableText.includes("crating");
  };

  const getPickListNumber = (job) => {
    const source = String(job?.joNumber || "000000").replace(/\D/g, "");
    return `PL-${source.padStart(6, "0").slice(-6)}`;
  };

  const getJobNumberNumeric = (job) => {
    const source = String(job?.joNumber || "000000").replace(/\D/g, "");
    return source.padStart(6, "0").slice(-6);
  };

  const getPickRows = (job) => {
    if (!job) return [];

    const inventory = job.inventoryDetails;

    if (inventory) {
      return [
        {
          line: 1,
          qty: inventory.requestedQty || job.pieces || "1",
          uom: job.jobType === "Shipping" ? "PLT" : "EA",
          partNumber: inventory.partNumber || "-",
          inventoryId: inventory.inventoryId || "-",
          description:
            job.details ||
            job.additionalDetails ||
            "Customer material staged for operational request.",
          storageDate: job.requestedDate || "-",
          barcode: inventory.inventoryId || job.joNumber || "-",
        },
      ];
    }

    return [
      {
        line: 1,
        qty: job.pieces || "1",
        uom: "EA",
        partNumber: job.jobType || "-",
        inventoryId: job.joNumber || "-",
        description:
          job.details ||
          job.additionalDetails ||
          "Operational request pending inventory assignment.",
        storageDate: job.requestedDate || "-",
        barcode: job.soNumber || job.joNumber || "-",
      },
    ];
  };

  const buildPickListDocumentHtml = (job, autoPrint = false) => {
    if (!job) return "";

    const rows = getPickRows(job);
    const amJob = isAMCratingJob(job);

    const shipFromName = amJob ? "A&M Warehouse" : "INTRAL Warehouse";
    const shipFromLines = [
      amJob
        ? `Tag Location: A&M; ${job.inventoryDetails?.destinationLocation || "TAG / Location pending"}`
        : `Warehouse / STG: ${job.stagingLocation || "Generated at Release"}`,
      `Warehouse Zone: ${job.inventoryDetails?.subInventory || job.originalLocation || "INTRAL STG"}`,
      `Sq Ft: ${job.squareFeet || "N/A"}`,
      "Contact: Warehouse Receiving Team",
    ];

    const shipToName = job.customer || "Customer / Project Site";
    const shipToLines = [
      job.shipTo || job.finalDestination || "Destination pending",
      job.finalDestination && job.finalDestination !== job.shipTo
        ? job.finalDestination
        : "",
      job.additionalDetails?.includes("Attn:")
        ? job.additionalDetails
        : "Attn: Receiving / Project Contact",
      "Address pending final confirmation",
    ].filter(Boolean);

    const additionalWork =
      job.additionalWork && job.additionalWork.length > 0
        ? job.additionalWork.map((item) => `<li>${item}</li>`).join("")
        : "<li>No additional work attached.</li>";

    const rowHtml = rows
      .map(
        (row) => `
          <tr>
            <td class="line-col">${row.line}</td>
            <td class="qty-col">${row.qty}</td>
            <td class="uom-col">${row.uom}</td>
            <td class="pn-col">${row.partNumber}</td>
            <td class="inv-col">${row.inventoryId}</td>
            <td class="desc-col">${row.description}</td>
            <td class="date-col">${row.storageDate}</td>
            <td class="scan-col">*${row.barcode}*</td>
          </tr>
        `
      )
      .join("");

    const amChecklist = amJob
      ? `
        <div class="section checklist-section">
          <div class="section-title">A&M CRATING CHECKLIST</div>
          <div class="checklist-grid">
            <span>□ Plywood</span>
            <span>□ Heat Treat Lumber Spec</span>
            <span>□ Skid</span>
            <span>□ Net Weight Required</span>
            <span>□ Verify Parts / Packing List</span>
            <span>□ P&G Crating Specifications</span>
          </div>
        </div>
      `
      : "";

    return `
      <!doctype html>
      <html>
        <head>
          <title>INTRAL Pick List - ${getPickListNumber(job)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .page { width: 8.5in; min-height: 11in; margin: 0 auto; padding: 0.55in 0.62in; background: #ffffff; }
            .top { display: grid; grid-template-columns: 1fr 1.15fr 1.4fr; gap: 18px; align-items: start; margin-bottom: 14px; }
            .logo { width: 92px; height: 92px; object-fit: cover; display: block; margin-bottom: 10px; }
            .company-info { font-size: 12px; line-height: 1.25; }
            .pick-meta { font-size: 13px; line-height: 1.25; margin-top: 102px; }
            .pick-meta strong { font-weight: 800; }
            .title { text-align: right; color: #00615f; font-weight: 900; font-size: 24px; line-height: 1.12; letter-spacing: 0.02em; text-transform: uppercase; margin-top: 2px; }
            .rule { border: 0; border-top: 2px solid #00615f; margin: 12px 0 14px; }
            .two-col-section { border: 1px solid #cbd5e1; margin-bottom: 12px; }
            .two-col-header { display: grid; grid-template-columns: 1fr 1fr; background: #00615f; color: #ffffff; font-weight: 900; font-size: 13px; text-transform: uppercase; }
            .two-col-header div, .two-col-body div { padding: 9px 10px; }
            .two-col-body { display: grid; grid-template-columns: 1fr 1fr; font-size: 12.5px; line-height: 1.25; }
            .section { border: 1px solid #cbd5e1; margin-bottom: 12px; }
            .section-title { background: #00615f; color: #ffffff; font-weight: 900; font-size: 13px; text-transform: uppercase; padding: 9px 10px; }
            .section-body { padding: 11px 10px; font-size: 12.5px; line-height: 1.28; }
            .section-body p { margin: 0 0 4px; }
            .pick-body-title { font-weight: 900; font-size: 13px; margin: 8px 0 4px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
            th { background: #00615f; color: #ffffff; font-weight: 900; padding: 8px 5px; border: 1px solid #d1d5db; vertical-align: middle; white-space: normal; line-height: 1.08; }
            td { border: 1px solid #d1d5db; padding: 8px 6px; vertical-align: top; line-height: 1.22; word-break: normal; overflow-wrap: break-word; }
            .line-col { width: 58px; min-width: 58px; text-align: center; white-space: nowrap !important; word-break: keep-all !important; overflow-wrap: normal !important; }
            th.line-col { white-space: nowrap !important; word-break: keep-all !important; overflow-wrap: normal !important; }
            .qty-col { width: 42px; text-align: center; }
            .uom-col { width: 46px; text-align: center; }
            .pn-col { width: 112px; }
            .inv-col { width: 116px; }
            .desc-col { width: auto; }
            .date-col { width: 86px; text-align: center; }
            .scan-col { width: 104px; text-align: center; }
            .signature-table { margin-top: 16px; font-size: 11px; }
            .signature-table th { background: #e5ecef; color: #555; text-align: left; height: 28px; }
            .signature-table td { height: 48px; }
            .system-note { margin-top: 10px; font-size: 9.5px; line-height: 1.25; color: #374151; }
            .checklist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; padding: 11px 10px; font-size: 12px; font-weight: 700; }
            .actions { display: flex; justify-content: flex-end; gap: 10px; margin: 0 auto 12px; width: 8.5in; padding-top: 12px; }
            .actions button { border: none; border-radius: 8px; padding: 9px 14px; font-weight: 800; cursor: pointer; }
            .print-button { background: #00615f; color: #ffffff; }
            .close-button { background: #e5e7eb; color: #111827; }
            @media print { body { background: #ffffff; } .page { width: auto; min-height: auto; margin: 0; padding: 0.35in 0.45in; } .actions { display: none; } }
          </style>
        </head>

        <body>
          <div class="actions">
            <button class="close-button" onclick="window.close()">Close Preview</button>
            <button class="print-button" onclick="window.print()">Print Pick List</button>
          </div>

          <main class="page">
            <div class="top">
              <div>
                <img src="${logo}" alt="INTRAL" class="logo" />
                <div class="company-info">
                  1900 Crown Colony Drive, Suite 407<br />
                  Quincy, MA 02169<br />
                  (617) 439-5880
                </div>
              </div>

              <div class="pick-meta">
                <strong>Pick List #:</strong> ${getPickListNumber(job)}<br />
                <strong>Job #:</strong> ${getJobNumberNumeric(job)}<br />
                <strong>Date:</strong> ${new Date().toLocaleDateString()}
              </div>

              <div class="title">
                INTRAL PICK LIST / MATERIAL<br />
                RELEASE
              </div>
            </div>

            <hr class="rule" />

            <section class="two-col-section">
              <div class="two-col-header">
                <div>Ship From</div>
                <div>Ship To</div>
              </div>

              <div class="two-col-body">
                <div>
                  <strong>${shipFromName}</strong><br />
                  ${shipFromLines.join("<br />")}
                </div>

                <div>
                  <strong>${shipToName}</strong><br />
                  ${shipToLines.join("<br />")}
                </div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Internal Request Details</div>
              <div class="section-body">
                <p><strong>Internal Request From</strong></p>
                <p>Required Customer Department: ${job.customer || "Operations"}</p>
                <p>Requested By: ${job.requestor || "-"}</p>
                <p>Charge # / SWO: ${job.chargeNumber || job.swoNumber || "Pending"}</p>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Description of Request</div>
              <div class="section-body">
                ${
                  job.details ||
                  "Pull stored customer material for outbound preparation. Verify tag, system inventory ID, part number, and quantity before staging. Scan each line item barcode to confirm pick completion. Any mismatch must be placed on hold and escalated before shipment."
                }
                ${job.additionalDetails ? `<br /><br />${job.additionalDetails}` : ""}
                ${
                  job.additionalWork?.length
                    ? `<br /><br /><strong>Additional Work:</strong><ul>${additionalWork}</ul>`
                    : ""
                }
              </div>
            </section>

            ${amChecklist}

            <div class="pick-body-title">Pick List Body</div>

            <table>
              <thead>
                <tr>
                  <th class="line-col">Line</th>
                  <th class="qty-col">Qty</th>
                  <th class="uom-col">UOM</th>
                  <th class="pn-col">PN</th>
                  <th class="inv-col">System Inventory<br />ID</th>
                  <th class="desc-col">Description</th>
                  <th class="date-col">Storage<br />Date</th>
                  <th class="scan-col">Barcode / Scan</th>
                </tr>
              </thead>

              <tbody>
                ${rowHtml}
              </tbody>
            </table>

            <table class="signature-table">
              <thead>
                <tr>
                  <th>Picker Name / Signature</th>
                  <th>Scanner Confirmation</th>
                  <th>Date / Time Closed</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div class="system-note">
              <strong>System note:</strong> When all lines are scanned and confirmed, inventory status changes to Picked/Closed and the selected quantity is removed from available stock. A full transaction history remains attached to each System Inventory ID and Job #.
            </div>
          </main>

          ${
            autoPrint
              ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>`
              : ""
          }
        </body>
      </html>
    `;
  };

  const previewPickList = () => {
    if (!selectedJob) {
      alert("Select one job first before previewing the Pick List.");
      return;
    }

    const previewWindow = window.open("", "_blank", "width=1050,height=900");

    if (!previewWindow) {
      alert("Popup blocked. Please allow popups to preview the Pick List.");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(buildPickListDocumentHtml(selectedJob, false));
    previewWindow.document.close();
  };

  const printPickList = () => {
    if (!selectedJob) {
      alert("Select one job first before printing the Pick List.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1050,height=900");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print the Pick List.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPickListDocumentHtml(selectedJob, true));
    printWindow.document.close();
  };

  const renderPickAuthorizationSection = () => {
    if (!selectedJob) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "pickList",
          "Pick List / Material Release",
          "Preview and print the INTRAL material release document"
        )}

        {expandedSection === "pickList" && (
          <div className="phase17-accordion-body">
            <div className="order-release-summary-grid order-workbench-field-grid">
              <div className="order-detail-field">
                <span>Pick List #</span>
                <strong>{getPickListNumber(selectedJob)}</strong>
              </div>

              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{selectedJob.joNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>SO Number</span>
                <strong>{selectedJob.soNumber || "Not Released"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Customer</span>
                <strong>{selectedJob.customer}</strong>
              </div>

              <div className="order-detail-field">
                <span>Inventory ID</span>
                <strong>{selectedJob.inventoryDetails?.inventoryId || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Pull Location</span>
                <strong>
                  {selectedJob.inventoryDetails?.pullFromLocation ||
                    selectedJob.originalLocation ||
                    "-"}
                </strong>
              </div>

              <div className="order-detail-field">
                <span>Qty</span>
                <strong>
                  {selectedJob.inventoryDetails?.requestedQty ||
                    selectedJob.pieces ||
                    "-"}
                </strong>
              </div>

              <div className="order-detail-field">
                <span>Destination</span>
                <strong>
                  {selectedJob.inventoryDetails?.destinationLocation ||
                    selectedJob.shipTo ||
                    selectedJob.finalDestination ||
                    "-"}
                </strong>
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Document Format</h3>
              <p>
                Generates the INTRAL Pick List / Material Release document with
                ship-from, ship-to, internal request details, description,
                pick body, and signature fields.
              </p>
            </div>

            {isAMCratingJob(selectedJob) && (
              <div className="order-detail-section compact-order-section">
                <h3>A&M Crating Checklist Included</h3>
                <p>□ Plywood</p>
                <p>□ Heat Treat Lumber Spec</p>
                <p>□ Skid</p>
                <p>□ Net Weight Required</p>
                <p>□ Verify Parts / Packing List</p>
                <p>□ P&G Crating Specifications</p>
              </div>
            )}

            <div className="shipping-station-actions shipping-workbench-actions">
              <button className="inventory-primary-button" onClick={previewPickList}>
                Preview Pick List
              </button>

              <button className="order-success-button" onClick={printPickList}>
                Print Pick List
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdditionalWorkSection = () => {
    if (!selectedJob) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "additionalWork",
          "Additional Work",
          "Add forklift, labor, crating review, carrier coordination, or special handling"
        )}

        {expandedSection === "additionalWork" && (
          <div className="phase17-accordion-body">
            {selectedJob.additionalWork?.length > 0 && (
              <div className="order-detail-section compact-order-section">
                <h3>Existing Additional Work</h3>
                {selectedJob.additionalWork.map((item, index) => (
                  <p key={`${selectedJob.joNumber}-work-existing-${index}`}>{item}</p>
                ))}
              </div>
            )}

            <div className="order-checkbox-grid order-workbench-checkbox-grid">
              {additionalWorkOptions.map((item) => (
                <label className="order-checkbox-card" key={item}>
                  <input
                    type="checkbox"
                    checked={checkedWorkItems.includes(item)}
                    onChange={() => toggleWorkItem(item)}
                  />

                  <span>{item}</span>
                </label>
              ))}
            </div>

            <button className="inventory-primary-button" onClick={saveAdditionalWork}>
              Submit Additional Work
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderReleaseSection = () => {
    if (!selectedJob) return null;

    const previewSo = getSoPreview();
    const previewStg = selectedJob.stagingLocation || formatStgLocation(previewSo);

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "release",
          "Release Control",
          "Generate SO, assign STG, and move approved work to Active Orders"
        )}

        {expandedSection === "release" && (
          <div className="phase17-accordion-body">
            <div className="order-release-summary-grid order-workbench-field-grid">
              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{selectedJob.joNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>SO Preview</span>
                <strong>{previewSo}</strong>
              </div>

              <div className="order-detail-field">
                <span>STG Preview</span>
                <strong>{previewStg}</strong>
              </div>

              <div className="order-detail-field">
                <span>Allocation Gate</span>
                <strong>{getAllocationDisplay(selectedJob)}</strong>
              </div>

              <div className="order-detail-field">
                <span>Internal Review</span>
                <strong>
                  {renderGovernanceBadge(
                    getReviewStatus(selectedJob),
                    getReviewBadgeType(selectedJob)
                  )}
                </strong>
              </div>

              <div className="order-detail-field">
                <span>Release Eligibility</span>
                <strong>{canReleaseJob(selectedJob) ? "Allowed" : "Blocked"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Release Lock</span>
                <strong>{selectedJob.releaseStatus === "Open" ? "Ready for verification" : "Released / Locked"}</strong>
              </div>
            </div>

            <button
              className="order-release-button order-workbench-release-button"
              onClick={releaseSelectedJob}
              disabled={!canReleaseJob(selectedJob)}
            >
              {selectedJob.releaseStatus === "Open"
                ? "Generate SO and Assign STG"
                : "Released / Locked"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const saveInvoice = () => {
    if (!selectedJob) {
      alert("Select one JO before saving an invoice.");
      return;
    }

    const amount = Number(invoiceForm.invoiceAmount || 0);

    if (!amount || amount <= 0) {
      alert("Invoice Amount ($ USD) must be greater than zero.");
      return;
    }

    const nextInvoice = {
      invoiceNumber: invoiceForm.invoiceNumber.trim() || getInvoiceNumber(),
      invoiceAmount: String(invoiceForm.invoiceAmount || "").trim(),
      invoiceDate: invoiceForm.invoiceDate || new Date().toISOString().slice(0, 10),
      billingNotes: invoiceForm.billingNotes.trim(),
      customer: selectedJob.customer || "",
      joNumber: selectedJob.joNumber || "",
      soNumber: selectedJob.soNumber || "",
      savedAt: new Date().toISOString(),
    };

    setSavedInvoices((prev) => ({
      ...prev,
      [selectedJob.joNumber]: nextInvoice,
    }));

    setInvoiceForm(nextInvoice);
    setMessage(`Invoice ${nextInvoice.invoiceNumber} saved for ${selectedJob.joNumber}.`);
  };

  const buildInvoiceHtml = (job) => {
    if (!job) return "";

    const invoice = {
      ...getActiveInvoice(),
      invoiceNumber: getInvoiceNumber(),
      invoiceDate: getActiveInvoice().invoiceDate || new Date().toISOString().slice(0, 10),
    };

    return `
      <!doctype html>
      <html>
        <head>
          <title>INTRAL Invoice - ${invoice.invoiceNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f3f4f6;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            }

            .actions {
              display: flex;
              justify-content: flex-end;
              gap: 10px;
              width: 8.5in;
              margin: 0 auto 12px;
              padding-top: 12px;
            }

            .actions button {
              border: none;
              border-radius: 8px;
              padding: 9px 14px;
              font-weight: 800;
              cursor: pointer;
            }

            .print-button {
              background: #00615f;
              color: #ffffff;
            }

            .close-button {
              background: #e5e7eb;
              color: #111827;
            }

            .page {
              width: 8.5in;
              min-height: 11in;
              margin: 0 auto;
              padding: 0.55in 0.62in;
              background: #ffffff;
            }

            .top {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              align-items: start;
              border-bottom: 2px solid #00615f;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }

            .brand {
              color: #00615f;
              font-size: 26px;
              font-weight: 900;
              letter-spacing: 0.04em;
            }

            .company {
              margin-top: 10px;
              font-size: 12px;
              line-height: 1.35;
            }

            .title {
              text-align: right;
            }

            .title h1 {
              margin: 0;
              color: #00615f;
              font-size: 28px;
              letter-spacing: 0.04em;
            }

            .title p {
              margin: 6px 0 0;
              font-size: 13px;
              font-weight: 800;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              margin-bottom: 18px;
            }

            .field {
              border: 1px solid #cbd5e1;
              padding: 10px;
              min-height: 54px;
            }

            .field span {
              display: block;
              font-size: 10px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: 800;
              margin-bottom: 4px;
            }

            .field strong {
              font-size: 15px;
            }

            .amount-box {
              border: 2px solid #00615f;
              padding: 18px;
              margin: 18px 0;
              text-align: right;
            }

            .amount-box span {
              display: block;
              font-size: 12px;
              color: #6b7280;
              font-weight: 800;
              text-transform: uppercase;
            }

            .amount-box strong {
              color: #00615f;
              font-size: 28px;
            }

            .section {
              border: 1px solid #cbd5e1;
              margin-bottom: 16px;
            }

            .section-title {
              background: #00615f;
              color: #ffffff;
              padding: 9px 10px;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 13px;
            }

            .section-body {
              padding: 12px;
              font-size: 13px;
              line-height: 1.4;
              min-height: 80px;
            }

            .signature {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 18px;
              margin-top: 36px;
            }

            .signature div {
              border-top: 1px solid #111827;
              padding-top: 8px;
              font-size: 11px;
              text-transform: uppercase;
              color: #374151;
            }

            @media print {
              body { background: #ffffff; }
              .actions { display: none; }
              .page {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 0.35in 0.45in;
              }
            }
          </style>
        </head>

        <body>
          <div class="actions">
            <button class="close-button" onclick="window.close()">Close Preview</button>
            <button class="print-button" onclick="window.print()">Print Invoice</button>
          </div>

          <main class="page">
            <div class="top">
              <div>
                <div class="brand">INTRAL CONNECT</div>
                <div class="company">
                  1900 Crown Colony Drive, Suite 407<br />
                  Quincy, MA 02169<br />
                  (617) 439-5880
                </div>
              </div>

              <div class="title">
                <h1>INVOICE</h1>
                <p>${invoice.invoiceNumber}</p>
              </div>
            </div>

            <section class="grid">
              <div class="field"><span>Customer</span><strong>${job.customer || "-"}</strong></div>
              <div class="field"><span>Invoice Date</span><strong>${invoice.invoiceDate || "-"}</strong></div>
              <div class="field"><span>JO Number</span><strong>${job.joNumber || "-"}</strong></div>
              <div class="field"><span>SO Number</span><strong>${job.soNumber || "Not Released"}</strong></div>
              <div class="field"><span>Job Type</span><strong>${job.jobType || "-"}</strong></div>
              <div class="field"><span>Status</span><strong>${job.releaseStatus || "-"}</strong></div>
            </section>

            <div class="amount-box">
              <span>Invoice Amount</span>
              <strong>${getInvoiceAmountDisplay(invoice.invoiceAmount)}</strong>
            </div>

            <section class="section">
              <div class="section-title">Billing Notes</div>
              <div class="section-body">
                ${invoice.billingNotes || "No billing notes entered."}
              </div>
            </section>

            <section class="section">
              <div class="section-title">Operational Reference</div>
              <div class="section-body">
                ${job.details || "No job details provided."}
                ${job.additionalDetails ? `<br /><br />${job.additionalDetails}` : ""}
              </div>
            </section>

            <div class="signature">
              <div>Prepared By / Date</div>
              <div>Approved By / Date</div>
            </div>
          </main>
        </body>
      </html>
    `;
  };

  const printInvoice = () => {
    if (!selectedJob) {
      alert("Select one JO before printing an invoice.");
      return;
    }

    const activeInvoice = getActiveInvoice();
    const amount = Number(activeInvoice.invoiceAmount || invoiceForm.invoiceAmount || 0);

    if (!amount || amount <= 0) {
      alert("Invoice Amount ($ USD) must be entered before printing.");
      setExpandedSection("invoice");
      return;
    }

    const invoiceWindow = window.open("", "_blank", "width=950,height=850");

    if (!invoiceWindow) {
      alert("Popup blocked. Please allow popups to print the invoice.");
      return;
    }

    invoiceWindow.document.open();
    invoiceWindow.document.write(buildInvoiceHtml(selectedJob));
    invoiceWindow.document.close();
  };

  const renderInvoiceControlSection = () => {
    if (!selectedJob) return null;

    const activeInvoice = getActiveInvoice();

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "invoice",
          "Invoice Control",
          "Create and print invoice independently from job completion"
        )}

        {expandedSection === "invoice" && (
          <div className="phase17-accordion-body">
            <div className="order-release-summary-grid order-workbench-field-grid">
              <div className="order-detail-field">
                <span>Invoice Number</span>
                <input
                  value={activeInvoice.invoiceNumber || getInvoiceNumber()}
                  onChange={(e) => updateInvoiceForm("invoiceNumber", e.target.value)}
                  placeholder="Invoice Number"
                />
              </div>

              <div className="order-detail-field">
                <span>Customer</span>
                <strong>{selectedJob.customer || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{selectedJob.joNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>SO Number</span>
                <strong>{selectedJob.soNumber || "Not Released"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Invoice Amount ($ USD)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={activeInvoice.invoiceAmount || ""}
                  onChange={(e) => updateInvoiceForm("invoiceAmount", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="order-detail-field">
                <span>Invoice Date</span>
                <input
                  type="date"
                  value={activeInvoice.invoiceDate || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => updateInvoiceForm("invoiceDate", e.target.value)}
                />
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Billing Notes</h3>
              <textarea
                rows="4"
                value={activeInvoice.billingNotes || ""}
                onChange={(e) => updateInvoiceForm("billingNotes", e.target.value)}
                placeholder="Enter invoice notes, billing explanation, customer reference, charge details, or special billing instruction."
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid rgba(147, 197, 253, 0.28)",
                  background: "rgba(15, 23, 42, 0.84)",
                  color: "#ffffff",
                  padding: "10px",
                  fontWeight: 800,
                }}
              />
            </div>

            {savedInvoices[selectedJob.joNumber] && (
              <div className="dashboard-message">
                Invoice {savedInvoices[selectedJob.joNumber].invoiceNumber} saved for {selectedJob.joNumber}.
              </div>
            )}

            <div className="shipping-station-actions shipping-workbench-actions">
              <button className="inventory-primary-button" onClick={saveInvoice}>
                Save Invoice
              </button>

              <button className="order-success-button" onClick={printInvoice}>
                Print Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSelectedSummary = () => {
    return (
      <aside className="phase17-smart-summary order-workbench-summary">
        <div className="job-request-summary-panel">
          <div className="job-summary-header">
            <span>Order Control Snapshot</span>
            <strong>{selectedJob?.joNumber || "No JO Selected"}</strong>
          </div>

          <div className="job-summary-grid">
            <div>
              <span>Status</span>
              <strong>{selectedJob?.releaseStatus || "Waiting"}</strong>
            </div>

            <div>
              <span>Customer</span>
              <strong>{selectedJob?.customer || "Pending"}</strong>
            </div>

            <div>
              <span>Source</span>
              <strong>
                {selectedJob
                  ? renderGovernanceBadge(
                      getRequestSource(selectedJob),
                      isCustomerRequest(selectedJob) ? "customer" : "default"
                    )
                  : "Pending"}
              </strong>
            </div>

            <div>
              <span>Review</span>
              <strong>
                {selectedJob
                  ? renderGovernanceBadge(
                      getReviewStatus(selectedJob),
                      getReviewBadgeType(selectedJob)
                    )
                  : "Pending"}
              </strong>
            </div>

            <div>
              <span>Queue Type</span>
              <strong>
                {selectedJob
                  ? renderGovernanceBadge(
                      isCustomerRequest(selectedJob)
                        ? "Customer Queue"
                        : "Internal Queue",
                      isCustomerRequest(selectedJob) ? "customer" : "default"
                    )
                  : "Pending"}
              </strong>
            </div>

            <div>
              <span>Job Type</span>
              <strong>{selectedJob?.jobType || "Pending"}</strong>
            </div>

            <div>
              <span>Allocation</span>
              <strong>{selectedJob ? getAllocationDisplay(selectedJob) : "Pending"}</strong>
            </div>

            <div>
              <span>SO Number</span>
              <strong>{selectedJob?.soNumber || "Not Released"}</strong>
            </div>

            <div>
              <span>STG Location</span>
              <strong>{selectedJob?.stagingLocation || "Generated at Release"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="inventory-primary-button job-submit-button"
            onClick={() => setExpandedSection(selectedJob ? "release" : "queue")}
          >
            {selectedJob ? "Open Release Control" : "Select JO"}
          </button>

          {selectedJob && (
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={() => setExpandedSection("pickList")}
              style={{ marginTop: "8px", width: "100%" }}
            >
              Preview Pick List
            </button>
          )}

          {selectedJob && (
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={() => setExpandedSection("invoice")}
              style={{ marginTop: "8px", width: "100%" }}
            >
              Invoice Control
            </button>
          )}

          <p className="job-summary-note">
            Order Central controls allocation review, additional work, SO generation,
            and release into Shipping Operations.
          </p>
        </div>
      </aside>
    );
  };

  const isDedicatedActionMode = () => {
    return orderMode === "pickList" || orderMode === "invoice" || orderMode === "release";
  };

  const getOrderCentralHeaderText = () => {
    if (orderMode === "pickList") return "Pick List / Material Release";
    if (orderMode === "invoice") return "Invoice Control";
    if (orderMode === "release") return "Release Control";
    if (orderMode === "addWork") return "Additional Work";
    if (orderMode === "view") return "Order Detail View";
    return "Order Central Workbench";
  };

  const getOrderCentralHeaderDescription = () => {
    if (orderMode === "pickList") {
      return "Preview and print the INTRAL Pick List / Material Release document for the selected JO.";
    }

    if (orderMode === "invoice") {
      return "Create, save, and print customer invoice details independently from job completion.";
    }

    if (orderMode === "release") {
      return "Validate allocation, generate SO/STG, and release approved work to Shipping Operations.";
    }

    if (orderMode === "addWork") {
      return "Add forklift, labor, crating review, carrier coordination, or special handling to the selected JO.";
    }

    if (orderMode === "view") {
      return "Review selected job order governance, allocation, and release readiness.";
    }

    return "Review job orders, govern allocation, add work, generate SO/STG, and release approved work.";
  };

  const renderOrderCentralSections = () => {
    if (orderMode === "pickList") {
      return (
        <>
          {renderOrderQueueSection()}
          {renderPickAuthorizationSection()}
        </>
      );
    }

    if (orderMode === "invoice") {
      return (
        <>
          {renderOrderQueueSection()}
          {renderInvoiceControlSection()}
        </>
      );
    }

    if (orderMode === "release") {
      return (
        <>
          {renderOrderQueueSection()}
          {renderAllocationSection()}
          {renderReleaseSection()}
        </>
      );
    }

    if (orderMode === "addWork") {
      return (
        <>
          {renderOrderQueueSection()}
          {renderAdditionalWorkSection()}
        </>
      );
    }

    if (orderMode === "view") {
      return (
        <>
          {renderOrderQueueSection()}
          {renderCustomerRequestQueueSection()}
          {renderSelectedGovernanceSection()}
          {renderAllocationSection()}
        </>
      );
    }

    if (orderMode === "open" || orderMode === "released" || orderMode === "closed") {
      return (
        <>
          {renderOrderQueueSection()}
          {renderCustomerRequestQueueSection()}
          {renderSelectedGovernanceSection()}
          {renderAllocationSection()}
        </>
      );
    }

    return (
      <>
        {renderOrderQueueSection()}
        {renderCustomerRequestQueueSection()}
        {selectedJob && renderSelectedGovernanceSection()}
      </>
    );
  };

  return (
    <div className="inventory-subview order-central-workspace phase17-workbench-screen">
      <div className="inventory-header-row order-central-header">
        <div>
          <h1>Order Central</h1>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      {renderKpisOnly()}

      <div className="phase17-smart-card-shell order-workbench-shell">
        <div className="phase17-smart-card">
          <div className="phase17-smart-card-header">
            <div>
              <span>Smart Order Control Card</span>
              <strong>{getOrderCentralHeaderText()}</strong>
              <p>{getOrderCentralHeaderDescription()}</p>
            </div>

            <div className="phase17-progress">
              <span className="active">1 Select JO</span>
              <span className={selectedJob ? "active" : ""}>
                {isDedicatedActionMode() ? "2 Action" : "2 Govern"}
              </span>
              <span className={selectedJob && canReleaseJob(selectedJob) ? "active" : ""}>
                {orderMode === "invoice"
                  ? "3 Invoice"
                  : orderMode === "pickList"
                  ? "3 Print"
                  : "3 Release"}
              </span>
            </div>
          </div>

          <div className="phase17-smart-card-body">
            <div className="phase17-smart-sections">
              {renderOrderCentralSections()}
            </div>

            {renderSelectedSummary()}
          </div>

          <div className="phase17-smart-footer">
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={() => {
                setSelectedJobNumber("");
                setExpandedSection("queue");
              }}
            >
              Clear Selection
            </button>

            <button
              type="button"
              className="inventory-primary-button phase17-review-button"
              onClick={() => {
                if (!selectedJob) {
                  setExpandedSection("queue");
                  return;
                }

                if (orderMode === "pickList") {
                  setExpandedSection("pickList");
                  return;
                }

                if (orderMode === "invoice") {
                  setExpandedSection("invoice");
                  return;
                }

                if (orderMode === "addWork") {
                  setExpandedSection("additionalWork");
                  return;
                }

                setExpandedSection("release");
              }}
            >
              {!selectedJob
                ? "Select JO →"
                : orderMode === "pickList"
                ? "Pick List →"
                : orderMode === "invoice"
                ? "Invoice Control →"
                : orderMode === "addWork"
                ? "Additional Work →"
                : "Release Control →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCentralWorkspace;
