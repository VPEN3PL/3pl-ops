import React, { useEffect, useMemo, useState } from "react";

const starterOrders = [
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
  },
  {
    joNumber: "JO-000101",
    requestor: "Luis",
    jobType: "Shipping",
    details: "Outbound customer shipment with carrier pickup.",
    allocationRequired: false,
    allocationConfirmed: false,
    releaseStatus: "Released",
    soNumber: "SO-000101",
    priority: "Normal",
    requestedDate: "2026-05-18",
    customer: "P&G",
    shipTo: "Customer Dock",
    additionalWork: [],
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
  },
  {
    joNumber: "JO-000104",
    requestor: "P&G",
    jobType: "Movement",
    details: "Transfer inventory to DCIC staging area.",
    allocationRequired: true,
    allocationConfirmed: false,
    releaseStatus: "Open",
    soNumber: "",
    priority: "Normal",
    requestedDate: "2026-05-17",
    customer: "P&G",
    shipTo: "DCIC",
    additionalWork: [],
  },
  {
    joNumber: "JO-000105",
    requestor: "Gillette",
    jobType: "Shipping",
    details: "Carrier pickup required for released shipment.",
    allocationRequired: false,
    allocationConfirmed: false,
    releaseStatus: "Released",
    soNumber: "SO-000105",
    priority: "Normal",
    requestedDate: "2026-05-16",
    customer: "Gillette",
    shipTo: "Carrier Pickup",
    additionalWork: [],
  },
];

const additionalWorkOptions = [
  "Add forklift support",
  "Add labor support",
  "Add stretch wrap / strap work",
  "Add crating review",
  "Add carrier coordination",
  "Add special handling instructions",
];

function OrderCentralWorkspace({ orderMode = "dashboard" }) {
  const [orders, setOrders] = useState(starterOrders);
  const [selectedJobNumber, setSelectedJobNumber] = useState(() => {
    return localStorage.getItem("intral-connect-selected-jo") || "";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedWorkItems, setCheckedWorkItems] = useState([]);
  const [message, setMessage] = useState("");

  const ordersPerPage = 5;

  useEffect(() => {
    if (selectedJobNumber) {
      localStorage.setItem("intral-connect-selected-jo", selectedJobNumber);
    } else {
      localStorage.removeItem("intral-connect-selected-jo");
    }
  }, [selectedJobNumber]);

  const openOrders = useMemo(() => {
    return orders.filter((item) => item.releaseStatus === "Open");
  }, [orders]);

  const releasedOrders = useMemo(() => {
    return orders.filter((item) => item.releaseStatus === "Released");
  }, [orders]);

  const closedOrders = useMemo(() => {
    return orders.filter((item) => item.releaseStatus === "Closed");
  }, [orders]);

  const selectedJob = useMemo(() => {
    return orders.find((item) => item.joNumber === selectedJobNumber) || null;
  }, [orders, selectedJobNumber]);

  const activeList = useMemo(() => {
    if (orderMode === "released") return releasedOrders;
    if (orderMode === "closed") return closedOrders;
    return openOrders;
  }, [orderMode, openOrders, releasedOrders, closedOrders]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return activeList.slice(startIndex, endIndex);
  }, [activeList, currentPage]);

  const totalPages = Math.ceil(activeList.length / ordersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderMode]);

  const selectJob = (job) => {
    setSelectedJobNumber((current) =>
      current === job.joNumber ? "" : job.joNumber
    );
  };

  const getViewTitle = () => {
    if (orderMode === "released") return "Released Orders";
    if (orderMode === "closed") return "Closed Orders";
    return "Open Orders";
  };

  const getAllocationDisplay = (job) => {
    if (!job.allocationRequired) return "Not Required";
    if (job.allocationConfirmed) return "Confirmed";
    return "Required - Pending Confirmation";
  };

  const canReleaseJob = (job) => {
    if (!job) return false;
    if (job.releaseStatus !== "Open") return false;
    if (job.allocationRequired && !job.allocationConfirmed) return false;
    return true;
  };

  const generateSoNumber = () => {
    const nextNumber = orders.filter((item) => item.soNumber).length + 100;
    return `SO-${String(nextNumber).padStart(6, "0")}`;
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
          }
        : item
    );

    setOrders(updatedOrders);
    setMessage(`${selectedJob.joNumber} allocation confirmed. Release is now allowed.`);
  };

  const releaseSelectedJob = () => {
    if (!selectedJob) {
      alert("Select one job first from View Orders, then choose Action > Release.");
      return;
    }

    if (selectedJob.releaseStatus !== "Open") {
      alert("Only open orders can be released.");
      return;
    }

    if (selectedJob.allocationRequired && !selectedJob.allocationConfirmed) {
      alert("Allocation must be confirmed before release.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm to Release Job Order # ${selectedJob.joNumber}?`
    );

    if (!confirmed) return;

    const newSoNumber = selectedJob.soNumber || generateSoNumber();

    const updatedOrders = orders.map((item) =>
      item.joNumber === selectedJob.joNumber
        ? {
            ...item,
            releaseStatus: "Released",
            soNumber: newSoNumber,
          }
        : item
    );

    setOrders(updatedOrders);
    setSelectedJobNumber(selectedJob.joNumber);
    setMessage(
      `Pick release generated. ${selectedJob.joNumber} released as ${newSoNumber}.`
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
    setMessage(`Additional work added to ${selectedJob.joNumber}.`);
  };

  const renderKpisOnly = () => {
    return (
      <div className="inventory-kpi-grid">
        <div className="inventory-kpi-card">
          <span>Open Orders</span>
          <h2>{openOrders.length}</h2>
          <p>Pending release review</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Released Orders</span>
          <h2>{releasedOrders.length}</h2>
          <p>Pick release / SO generated</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Closed Orders</span>
          <h2>{closedOrders.length}</h2>
          <p>Completed order records</p>
        </div>
      </div>
    );
  };

  const renderSelectedJobSummary = (title = "Selected Job Order") => {
    if (!selectedJob) return null;

    return (
      <div className="order-detail-card">
        <div className="order-detail-header">
          <div>
            <h2>{title}</h2>
            <p>{selectedJob.joNumber} • {selectedJob.jobType} • {selectedJob.customer}</p>
          </div>

          <span className="order-detail-badge">{selectedJob.releaseStatus}</span>
        </div>

        <div className="order-detail-grid">
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
            <span>Job Type</span>
            <strong>{selectedJob.jobType}</strong>
          </div>

          <div className="order-detail-field">
            <span>Priority</span>
            <strong>{selectedJob.priority}</strong>
          </div>

          <div className="order-detail-field">
            <span>Allocation</span>
            <strong>{getAllocationDisplay(selectedJob)}</strong>
          </div>

          <div className="order-detail-field">
            <span>Ship To / Destination</span>
            <strong>{selectedJob.shipTo}</strong>
          </div>

          <div className="order-detail-field">
            <span>SO Number</span>
            <strong>{selectedJob.soNumber || "Not Released"}</strong>
          </div>
        </div>

        <div className="order-detail-section">
          <h3>Request Details</h3>
          <p>{selectedJob.details}</p>
        </div>

        {selectedJob.additionalWork?.length > 0 && (
          <div className="order-detail-section">
            <h3>Existing Additional Work</h3>
            {selectedJob.additionalWork.map((item, index) => (
              <p key={`${selectedJob.joNumber}-work-existing-${index}`}>{item}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAllocationControls = () => {
    if (!selectedJob || selectedJob.releaseStatus !== "Open") return null;

    if (!selectedJob.allocationRequired) {
      return (
        <div className="order-detail-section">
          <h3>Allocation Gate</h3>
          <p>Allocation is not required for this job order. Release is allowed.</p>
        </div>
      );
    }

    if (selectedJob.allocationConfirmed) {
      return (
        <div className="order-detail-section">
          <h3>Allocation Gate</h3>
          <p>Allocation has been confirmed for this job order. Release is allowed.</p>
        </div>
      );
    }

    return (
      <div className="order-detail-section">
        <h3>Allocation Gate</h3>

        <p>
          This job order requires allocation. User must confirm allocation before
          the order can be released.
        </p>

        <div className="order-detail-actions">
          <button className="inventory-primary-button" onClick={confirmAllocation}>
            Confirm Allocation
          </button>
        </div>
      </div>
    );
  };

  const renderOrderList = () => {
    return (
      <div className="inventory-panel">
        <h2>{getViewTitle()}</h2>

        <p className="panel-note">
          Select one JO by checkbox, then use the top Action dropdown.
        </p>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>JO #</th>
              <th>Requestor</th>
              <th>Job Type</th>
              <th>Details</th>
              <th>Allocation</th>
            </tr>
          </thead>

          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="6">No orders found.</td>
              </tr>
            ) : (
              paginatedOrders.map((job) => (
                <tr key={job.joNumber}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedJobNumber === job.joNumber}
                      onChange={() => selectJob(job)}
                    />
                  </td>

                  <td>{job.joNumber}</td>
                  <td>{job.requestor}</td>
                  <td>{job.jobType}</td>
                  <td>{job.details}</td>
                  <td>{getAllocationDisplay(job)}</td>
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
    );
  };

  const renderNoJobPrompt = (actionLabel) => {
    return (
      <div className="inventory-panel">
        <h2>{actionLabel}</h2>

        <p className="panel-note">
          No JO is selected. Go to the top View Orders dropdown, choose an order
          list, check one job, then return to the top Action dropdown and choose
          {` ${actionLabel}`}.
        </p>
      </div>
    );
  };

  const renderDetailedView = () => {
    if (!selectedJob) return renderNoJobPrompt("View");

    return (
      <>
        {renderSelectedJobSummary("Full Request Detail")}
        {renderAllocationControls()}
      </>
    );
  };

  const renderAddWork = () => {
    if (!selectedJob) return renderNoJobPrompt("Add Additional Work");

    return (
      <div>
        {renderSelectedJobSummary("Add Additional Work")}

        <div className="inventory-panel">
          <h2>Additional Work Checklist</h2>

          <p className="panel-note">
            Select the additional work required for {selectedJob.joNumber}, then
            click Submit Additional Work.
          </p>

          <div className="order-checkbox-grid">
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
      </div>
    );
  };

  const renderRelease = () => {
    if (!selectedJob) return renderNoJobPrompt("Release");

    return (
      <div>
        {renderSelectedJobSummary("Pick Release Review")}

        <div className="inventory-panel">
          <h2>Release Confirmation</h2>

          <p className="panel-note">
            Confirm the selected job order below. The system will generate the
            pick release and SO number after confirmation.
          </p>

          <div className="order-detail-grid">
            <div className="order-detail-field">
              <span>Job Order</span>
              <strong>{selectedJob.joNumber}</strong>
            </div>

            <div className="order-detail-field">
              <span>SO Preview</span>
              <strong>{getSoPreview()}</strong>
            </div>

            <div className="order-detail-field">
              <span>Allocation Gate</span>
              <strong>{getAllocationDisplay(selectedJob)}</strong>
            </div>

            <div className="order-detail-field">
              <span>Release Eligibility</span>
              <strong>{canReleaseJob(selectedJob) ? "Allowed" : "Blocked"}</strong>
            </div>
          </div>

          {renderAllocationControls()}

          <button
            className="order-release-button"
            onClick={releaseSelectedJob}
            disabled={!canReleaseJob(selectedJob)}
          >
            Confirm to Release Job Order # {selectedJob.joNumber}
          </button>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (
      orderMode === "open" ||
      orderMode === "released" ||
      orderMode === "closed"
    ) {
      return renderOrderList();
    }

    if (orderMode === "view") return renderDetailedView();
    if (orderMode === "addWork") return renderAddWork();
    if (orderMode === "release") return renderRelease();

    return null;
  };

  return (
    <div className="inventory-subview">
      <div className="inventory-header-row">
        <div>
          <h1>Order Central</h1>

          <p>
            Review job orders, select one JO at a time, confirm allocation when
            required, add work instructions, and generate pick release / SO
            records.
          </p>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      {renderKpisOnly()}

      {renderMainContent()}
    </div>
  );
}

export default OrderCentralWorkspace;
