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
  const [expandedSection, setExpandedSection] = useState("queue");

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

  const selectJob = (job) => {
    setSelectedJobNumber((current) =>
      current === job.joNumber ? "" : job.joNumber
    );
    setExpandedSection("governance");
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
    if (!selectedJob) return "Waiting";
    if (sectionKey === "governance") return selectedJob.releaseStatus;
    if (sectionKey === "allocation") return getAllocationDisplay(selectedJob);
    if (sectionKey === "additionalWork") {
      return selectedJob.additionalWork?.length > 0 ? "Attached" : "Optional";
    }
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

          <p className="job-summary-note">
            Order Central controls allocation review, additional work, SO generation,
            and release into Shipping Operations.
          </p>
        </div>
      </aside>
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
              <strong>Order Central Workbench</strong>
              <p>Review job orders, govern allocation, add work, generate SO/STG, and release approved work.</p>
            </div>

            <div className="phase17-progress">
              <span className="active">1 Select JO</span>
              <span className={selectedJob ? "active" : ""}>2 Govern</span>
              <span className={selectedJob && canReleaseJob(selectedJob) ? "active" : ""}>3 Release</span>
            </div>
          </div>

          <div className="phase17-smart-card-body">
            <div className="phase17-smart-sections">
              {renderOrderQueueSection()}
              {renderSelectedGovernanceSection()}
              {renderAllocationSection()}
              {renderAdditionalWorkSection()}
              {renderReleaseSection()}
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
              onClick={() => setExpandedSection(selectedJob ? "release" : "queue")}
            >
              {selectedJob ? "Release Control →" : "Select JO →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCentralWorkspace;
