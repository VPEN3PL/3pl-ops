import React, { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    setCurrentPage(1);
  }, [orderMode]);

  const selectJob = (job) => {
    setSelectedJobNumber((current) =>
      current === job.joNumber ? "" : job.joNumber
    );
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
          }
        : item
    );

    setOrders(updatedOrders);
    setSelectedJobNumber(selectedJob.joNumber);
    setMessage(
      `${newSoNumber} generated and staged to ${newStagingLocation}. Waiting for Active Orders confirmation.`
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
          <span>Active Orders</span>
          <h2>{activeOrders.length}</h2>
          <p>SO generated and staged for execution</p>
        </div>

        <div className="inventory-kpi-card">
          <span>Closed Orders</span>
          <h2>{closedOrders.length}</h2>
          <p>Completed order records</p>
        </div>
      </div>
    );
  };

  const renderInventoryAllocationSummary = (job) => {
    if (!job?.inventoryDetails) return null;

    return (
      <div className="order-detail-section">
        <h3>Inventory / Allocation Detail</h3>

        <div className="order-detail-grid">
          <div className="order-detail-field">
            <span>Inventory ID</span>
            <strong>{job.inventoryDetails.inventoryId}</strong>
          </div>

          <div className="order-detail-field">
            <span>Part Number</span>
            <strong>{job.inventoryDetails.partNumber}</strong>
          </div>

          <div className="order-detail-field">
            <span>Inventory Customer</span>
            <strong>{job.inventoryDetails.customer}</strong>
          </div>

          <div className="order-detail-field">
            <span>Available Qty</span>
            <strong>{job.inventoryDetails.availableQty}</strong>
          </div>

          <div className="order-detail-field">
            <span>Requested Qty</span>
            <strong>{job.inventoryDetails.requestedQty}</strong>
          </div>

          <div className="order-detail-field">
            <span>Sub-Inventory</span>
            <strong>{job.inventoryDetails.subInventory}</strong>
          </div>

          <div className="order-detail-field">
            <span>Original Pull Location</span>
            <strong>{job.inventoryDetails.pullFromLocation}</strong>
          </div>

          <div className="order-detail-field">
            <span>STG Location</span>
            <strong>{job.stagingLocation || "Generated at release"}</strong>
          </div>

          <div className="order-detail-field">
            <span>Destination Location</span>
            <strong>{job.inventoryDetails.destinationLocation}</strong>
          </div>
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

          <div className="order-detail-field">
            <span>STG Location</span>
            <strong>{selectedJob.stagingLocation || "Generated at release"}</strong>
          </div>

          <div className="order-detail-field">
            <span>Original Location</span>
            <strong>
              {selectedJob.originalLocation ||
                selectedJob.inventoryDetails?.pullFromLocation ||
                "-"}
            </strong>
          </div>
        </div>

        {renderInventoryAllocationSummary(selectedJob)}

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
          the order can be released into STG.
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
      <div className="inventory-panel order-central-queue-panel">
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
              <th>Inventory ID</th>
              <th>Original Pull From</th>
              <th>STG Location</th>
            </tr>
          </thead>

          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="9">No orders found.</td>
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
    );
  };

  const renderNoJobPrompt = (actionLabel) => {
    return (
      <div className="inventory-panel order-central-transaction-panel">
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
      <div className="order-central-detail-layout">
        <div className="order-central-detail-main">
          {renderSelectedJobSummary("Full Request Detail")}
        </div>

        <aside className="order-central-governance-panel">
          <h2>Governance</h2>
          {renderAllocationControls()}
        </aside>
      </div>
    );
  };

  const renderAddWork = () => {
    if (!selectedJob) return renderNoJobPrompt("Add Additional Work");

    return (
      <div>
        {renderSelectedJobSummary("Add Additional Work")}

        <div className="inventory-panel order-central-transaction-panel">
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

    const previewSo = getSoPreview();
    const previewStg = selectedJob.stagingLocation || formatStgLocation(previewSo);

    return (
      <div>
        <div className="order-release-compact order-central-release-layout">
          <div className="order-release-card order-release-main-card">
            <div className="order-release-card-header">
              <div>
                <h2>Pick Release Review</h2>
                <p>
                  Review the selected JO, confirm allocation, generate SO, and
                  assign STG for Active Orders.
                </p>
              </div>

              <span className="order-detail-badge">
                {selectedJob.releaseStatus}
              </span>
            </div>

            <div className="order-release-summary-grid">
              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{selectedJob.joNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>SO Preview</span>
                <strong>{previewSo}</strong>
              </div>

              <div className="order-detail-field">
                <span>Customer</span>
                <strong>{selectedJob.customer}</strong>
              </div>

              <div className="order-detail-field">
                <span>STG Preview</span>
                <strong>{previewStg}</strong>
              </div>

              <div className="order-detail-field">
                <span>Job Type</span>
                <strong>{selectedJob.jobType}</strong>
              </div>

              <div className="order-detail-field">
                <span>Allocation Gate</span>
                <strong>{getAllocationDisplay(selectedJob)}</strong>
              </div>

              <div className="order-detail-field">
                <span>Priority</span>
                <strong>{selectedJob.priority}</strong>
              </div>

              <div className="order-detail-field">
                <span>Release Eligibility</span>
                <strong>{canReleaseJob(selectedJob) ? "Allowed" : "Blocked"}</strong>
              </div>
            </div>
          </div>

          <div className="order-release-card">
            <h2>Inventory / Pull Detail</h2>

            {selectedJob.inventoryDetails ? (
              <div className="order-release-mini-grid">
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
            ) : (
              <p className="panel-note">
                No inventory allocation detail is required for this order.
              </p>
            )}
          </div>

          <div className="order-release-card">
            <h2>Workload / Execution Notes</h2>

            <div className="order-detail-section compact-order-section">
              <h3>Request Details</h3>
              <p>{selectedJob.details}</p>
            </div>

            {selectedJob.additionalWork?.length > 0 ? (
              <div className="order-detail-section compact-order-section">
                <h3>Additional Work</h3>

                {selectedJob.additionalWork.map((item, index) => (
                  <p key={`${selectedJob.joNumber}-release-work-${index}`}>
                    {item}
                  </p>
                ))}
              </div>
            ) : (
              <p className="panel-note">
                No additional work has been added to this order.
              </p>
            )}
          </div>

          <div className="order-release-card order-release-action-card">
            <h2>Release Control</h2>

            {selectedJob.releaseStatus === "Open" &&
              selectedJob.allocationRequired &&
              !selectedJob.allocationConfirmed && (
                <div className="order-detail-section compact-order-section">
                  <h3>Allocation Required</h3>
                  <p>
                    Allocation must be confirmed before SO and STG assignment
                    can be generated.
                  </p>

                  <button
                    className="inventory-primary-button"
                    onClick={confirmAllocation}
                  >
                    Confirm Allocation
                  </button>
                </div>
              )}

            {selectedJob.releaseStatus === "Open" &&
              (!selectedJob.allocationRequired ||
                selectedJob.allocationConfirmed) && (
                <div className="order-detail-section compact-order-section">
                  <h3>Ready to Release</h3>
                  <p>
                    SO and STG will be generated and the order will move to
                    Active Orders.
                  </p>
                </div>
              )}

            <button
              className="order-release-button"
              onClick={releaseSelectedJob}
              disabled={!canReleaseJob(selectedJob)}
            >
              Generate SO and Assign STG
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderOrderCentralDashboard = () => {
    return (
      <div className="order-central-dashboard-grid">
        <div className="inventory-panel order-central-transaction-panel">
          <h2>Order Central Control Queue</h2>

          <p className="panel-note">
            Use View Orders to select a JO, then use Action to view, add work,
            confirm allocation, or generate SO/STG release.
          </p>

          <div className="order-central-flow-row">
            <span>Open Orders</span>
            <span>Allocation Review</span>
            <span>Additional Work</span>
            <span>Generate SO</span>
            <span>Active Orders</span>
          </div>
        </div>

        <div className="inventory-panel order-central-transaction-panel">
          <h2>Selected JO Governance</h2>

          {selectedJob ? (
            <div className="order-central-side-summary">
              <div>
                <span>JO Number</span>
                <strong>{selectedJob.joNumber}</strong>
              </div>

              <div>
                <span>Customer</span>
                <strong>{selectedJob.customer}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedJob.releaseStatus}</strong>
              </div>

              <div>
                <span>Allocation</span>
                <strong>{getAllocationDisplay(selectedJob)}</strong>
              </div>
            </div>
          ) : (
            <p className="panel-note">
              No JO is currently selected. Select a JO from Open, Active, or
              Closed Orders.
            </p>
          )}
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

    return renderOrderCentralDashboard();
  };

  return (
    <div className="inventory-subview order-central-workspace">
      <div className="inventory-header-row order-central-header">
        <div>
          <h1>Order Central</h1>

          <p>
            Review job orders, select one JO at a time, confirm allocation when
            required, add work instructions, generate SO records, assign STG,
            and move approved work into Active Orders.
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
