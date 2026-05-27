import React, { useMemo, useState } from "react";

function ShippingOperationsWorkspace({ orders = [], setOrders }) {
  const [soSearch, setSoSearch] = useState("");
  const [loadedSoNumber, setLoadedSoNumber] = useState("");
  const [message, setMessage] = useState("");
  const [expandedSection, setExpandedSection] = useState("load");

  const shippingOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.soNumber &&
        (order.releaseStatus === "Active" ||
          order.releaseStatus === "Started" ||
          order.releaseStatus === "Complete")
    );
  }, [orders]);

  const loadedOrder = useMemo(() => {
    return (
      shippingOrders.find((order) => order.soNumber === loadedSoNumber) || null
    );
  }, [shippingOrders, loadedSoNumber]);

  const activeOrders = useMemo(() => {
    return shippingOrders.filter((order) => order.releaseStatus === "Active");
  }, [shippingOrders]);

  const handleLoadOrder = () => {
    const normalizedSo = soSearch.trim().toUpperCase();

    if (!normalizedSo) {
      alert("Enter an SO number before loading a shipping order.");
      return;
    }

    const matchedOrder = shippingOrders.find(
      (order) => order.soNumber === normalizedSo
    );

    if (!matchedOrder) {
      alert("SO number was not found in Shipping Operations.");
      return;
    }

    setLoadedSoNumber(matchedOrder.soNumber);
    setExpandedSection("validation");
    setMessage(`${matchedOrder.soNumber} loaded into Shipping Operations.`);
  };

  const clearLoadedOrder = () => {
    setLoadedSoNumber("");
    setSoSearch("");
    setMessage("");
    setExpandedSection("load");
  };

  const startJob = () => {
    if (!loadedOrder) {
      alert("Load an SO before starting the job.");
      return;
    }

    if (loadedOrder.releaseStatus !== "Active") {
      alert("Only Active orders can be started.");
      return;
    }

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedOrders = orders.map((order) =>
      order.soNumber === loadedOrder.soNumber
        ? { ...order, releaseStatus: "Started", startedAt: now }
        : order
    );

    setOrders(updatedOrders);
    setExpandedSection("execution");
    setMessage(`${loadedOrder.soNumber} has been started.`);
  };

  const completeJob = () => {
    if (!loadedOrder) {
      alert("Load an SO before completing the job.");
      return;
    }

    if (loadedOrder.releaseStatus !== "Started") {
      alert("Only Started orders can be completed.");
      return;
    }

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedOrders = orders.map((order) =>
      order.soNumber === loadedOrder.soNumber
        ? { ...order, releaseStatus: "Complete", completedAt: now }
        : order
    );

    setOrders(updatedOrders);
    setExpandedSection("completion");
    setMessage(`${loadedOrder.soNumber} has been completed.`);
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection((current) => (current === sectionKey ? "" : sectionKey));
  };

  const getSectionStatus = (sectionKey) => {
    if (sectionKey === "load") return loadedOrder ? "Loaded" : "Required";
    if (!loadedOrder) return "Waiting";
    if (sectionKey === "validation") return loadedOrder.releaseStatus || "Active";
    if (sectionKey === "inventory") return loadedOrder.stagingLocation ? "Ready" : "Review";
    if (sectionKey === "shipment") return loadedOrder.shipTo ? "Ready" : "Review";
    if (sectionKey === "work") return loadedOrder.additionalWork?.length > 0 ? "Attached" : "Optional";
    if (sectionKey === "execution") return loadedOrder.releaseStatus;
    if (sectionKey === "completion") return loadedOrder.releaseStatus === "Complete" ? "Complete" : "Pending";
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

  const renderLoadSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "load",
          "Load Shipping Order",
          "Enter SO number or select from active execution queue"
        )}

        {expandedSection === "load" && (
          <div className="phase17-accordion-body">
            <div className="shipping-workbench-load-row">
              <input
                value={soSearch}
                onChange={(e) => setSoSearch(e.target.value.toUpperCase())}
                placeholder="Enter SO Number, example SO-000100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLoadOrder();
                }}
              />

              <button className="inventory-primary-button" onClick={handleLoadOrder}>
                Load SO
              </button>
            </div>

            <div className="shipping-workbench-queue">
              <div className="phase17-mini-table-header">
                <span>Active SO Queue</span>
                <small>{activeOrders.length} active order(s)</small>
              </div>

              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>SO #</th>
                    <th>JO #</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>STG</th>
                    <th>Type</th>
                  </tr>
                </thead>

                <tbody>
                  {activeOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6">No active shipping orders found.</td>
                    </tr>
                  ) : (
                    activeOrders.map((order) => (
                      <tr
                        key={order.soNumber}
                        onClick={() => {
                          setSoSearch(order.soNumber);
                          setLoadedSoNumber(order.soNumber);
                          setExpandedSection("validation");
                          setMessage(`${order.soNumber} loaded into Shipping Operations.`);
                        }}
                      >
                        <td>{order.soNumber}</td>
                        <td>{order.joNumber}</td>
                        <td>{order.customer}</td>
                        <td>{order.releaseStatus}</td>
                        <td>{order.stagingLocation}</td>
                        <td>{order.jobType}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderValidationSection = () => {
    if (!loadedOrder) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "validation",
          "Order Validation",
          "SO identity, customer, priority, execution status"
        )}

        {expandedSection === "validation" && (
          <div className="phase17-accordion-body">
            <div className="order-release-summary-grid shipping-workbench-field-grid">
              <div className="order-detail-field">
                <span>SO Number</span>
                <strong>{loadedOrder.soNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{loadedOrder.joNumber}</strong>
              </div>

              <div className="order-detail-field">
                <span>Customer</span>
                <strong>{loadedOrder.customer}</strong>
              </div>

              <div className="order-detail-field">
                <span>Requestor</span>
                <strong>{loadedOrder.requestor || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Job Type</span>
                <strong>{loadedOrder.jobType}</strong>
              </div>

              <div className="order-detail-field">
                <span>Priority</span>
                <strong>{loadedOrder.priority}</strong>
              </div>

              <div className="order-detail-field">
                <span>Started At</span>
                <strong>{loadedOrder.startedAt || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Completed At</span>
                <strong>{loadedOrder.completedAt || "-"}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInventorySection = () => {
    if (!loadedOrder) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "inventory",
          "Inventory / STG Verification",
          "Confirm inventory pull, staging location, and quantity"
        )}

        {expandedSection === "inventory" && (
          <div className="phase17-accordion-body">
            <div className="order-release-mini-grid shipping-workbench-mini-grid">
              <div>
                <span>Inventory ID</span>
                <strong>{loadedOrder.inventoryDetails?.inventoryId || "-"}</strong>
              </div>

              <div>
                <span>Part #</span>
                <strong>{loadedOrder.inventoryDetails?.partNumber || "-"}</strong>
              </div>

              <div>
                <span>Sub-Inventory</span>
                <strong>{loadedOrder.inventoryDetails?.subInventory || "STG"}</strong>
              </div>

              <div>
                <span>Original Location</span>
                <strong>
                  {loadedOrder.originalLocation ||
                    loadedOrder.inventoryDetails?.pullFromLocation ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Qty</span>
                <strong>{loadedOrder.inventoryDetails?.requestedQty || "-"}</strong>
              </div>

              <div>
                <span>STG Location</span>
                <strong>{loadedOrder.stagingLocation || "-"}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderShipmentSection = () => {
    if (!loadedOrder) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "shipment",
          "Shipment Profile",
          "Origin, destination, pieces, weight, dimensions"
        )}

        {expandedSection === "shipment" && (
          <div className="phase17-accordion-body">
            <div className="order-release-mini-grid shipping-workbench-mini-grid">
              <div>
                <span>Ship From</span>
                <strong>{loadedOrder.originalLocation || "INTRAL STG"}</strong>
              </div>

              <div>
                <span>Ship To</span>
                <strong>{loadedOrder.shipTo || "-"}</strong>
              </div>

              <div>
                <span>Final Destination</span>
                <strong>
                  {loadedOrder.finalDestination || loadedOrder.shipTo || "-"}
                </strong>
              </div>

              <div>
                <span>Pieces</span>
                <strong>{loadedOrder.pieces || "-"}</strong>
              </div>

              <div>
                <span>Weight</span>
                <strong>{loadedOrder.weight || "-"}</strong>
              </div>

              <div>
                <span>Dimensions</span>
                <strong>{loadedOrder.dimensions || "-"}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWorkSection = () => {
    if (!loadedOrder) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "work",
          "Work / Details",
          "Additional work, instructions, operational notes"
        )}

        {expandedSection === "work" && (
          <div className="phase17-accordion-body">
            {loadedOrder.additionalWork?.length > 0 ? (
              <div className="order-detail-section compact-order-section">
                <h3>Additional Work</h3>

                {loadedOrder.additionalWork.map((item, index) => (
                  <p key={`${loadedOrder.soNumber}-work-${index}`}>{item}</p>
                ))}
              </div>
            ) : (
              <p className="panel-note">No additional work attached.</p>
            )}

            <div className="order-detail-section compact-order-section">
              <h3>Additional Details</h3>

              <p>
                {loadedOrder.additionalDetails ||
                  loadedOrder.details ||
                  "No additional details."}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExecutionSection = () => {
    if (!loadedOrder) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "execution",
          "Execution Controls",
          "Start, complete, print, or clear the loaded SO"
        )}

        {expandedSection === "execution" && (
          <div className="phase17-accordion-body">
            <p className="panel-note">
              Start begins physical work against the SO. Complete finalizes the
              operational execution record.
            </p>

            <div className="shipping-station-actions shipping-workbench-actions">
              <button
                className="inventory-primary-button"
                onClick={startJob}
                disabled={loadedOrder.releaseStatus !== "Active"}
              >
                Start Job
              </button>

              <button
                className="order-success-button"
                onClick={completeJob}
                disabled={loadedOrder.releaseStatus !== "Started"}
              >
                Complete Job
              </button>

              <button
                className="history-button"
                onClick={() =>
                  alert("Print Release Slip will be connected in the print phase.")
                }
              >
                Print Release
              </button>

              <button
                className="history-button"
                onClick={() =>
                  alert("Print Completion Document will be connected in the print phase.")
                }
              >
                Print Completion
              </button>

              <button className="history-button" onClick={clearLoadedOrder}>
                Clear SO
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExecutionSummary = () => {
    return (
      <aside className="phase17-smart-summary shipping-workbench-summary">
        <div className="job-request-summary-panel">
          <div className="job-summary-header">
            <span>Execution Snapshot</span>
            <strong>{loadedOrder?.soNumber || "No SO Loaded"}</strong>
          </div>

          <div className="job-summary-grid">
            <div>
              <span>Status</span>
              <strong>{loadedOrder?.releaseStatus || "Waiting"}</strong>
            </div>

            <div>
              <span>JO Number</span>
              <strong>{loadedOrder?.joNumber || "Pending"}</strong>
            </div>

            <div>
              <span>Customer</span>
              <strong>{loadedOrder?.customer || "Pending"}</strong>
            </div>

            <div>
              <span>STG Location</span>
              <strong>{loadedOrder?.stagingLocation || "Pending"}</strong>
            </div>

            <div>
              <span>Started</span>
              <strong>{loadedOrder?.startedAt || "-"}</strong>
            </div>

            <div>
              <span>Completed</span>
              <strong>{loadedOrder?.completedAt || "-"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="inventory-primary-button job-submit-button"
            onClick={() =>
              loadedOrder ? setExpandedSection("execution") : setExpandedSection("load")
            }
          >
            {loadedOrder ? "Open Execution Controls" : "Load Shipping Order"}
          </button>

          <p className="job-summary-note">
            Shipping Operations is controlled one SO at a time to protect the
            execution workflow.
          </p>
        </div>
      </aside>
    );
  };

  return (
    <div className="inventory-subview shipping-operations-workspace phase17-workbench-screen">
      <div className="inventory-header-row shipping-operations-header">
        <div>
          <h1>Shipping Operations</h1>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      <div className="phase17-smart-card-shell shipping-workbench-shell">
        <div className="phase17-smart-card">
          <div className="phase17-smart-card-header">
            <div>
              <span>Smart Execution Card</span>
              <strong>Shipping Operations Workbench</strong>
              <p>Load one SO at a time, validate staging, execute work, and complete outbound operations.</p>
            </div>

            <div className="phase17-progress">
              <span className={loadedOrder ? "" : "active"}>1 Load</span>
              <span className={loadedOrder ? "active" : ""}>2 Validate</span>
              <span className={loadedOrder?.releaseStatus === "Started" ? "active" : ""}>3 Execute</span>
              <span className={loadedOrder?.releaseStatus === "Complete" ? "active" : ""}>4 Complete</span>
            </div>
          </div>

          <div className="phase17-smart-card-body">
            <div className="phase17-smart-sections">
              {renderLoadSection()}
              {renderValidationSection()}
              {renderInventorySection()}
              {renderShipmentSection()}
              {renderWorkSection()}
              {renderExecutionSection()}
            </div>

            {renderExecutionSummary()}
          </div>

          <div className="phase17-smart-footer">
            <button type="button" className="phase17-secondary-button" onClick={clearLoadedOrder}>
              Clear SO
            </button>

            <button
              type="button"
              className="inventory-primary-button phase17-review-button"
              onClick={() =>
                loadedOrder ? setExpandedSection("execution") : setExpandedSection("load")
              }
            >
              {loadedOrder ? "Execution Controls →" : "Load SO →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingOperationsWorkspace;
