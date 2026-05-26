import React, { useMemo, useState } from "react";

function ShippingOperationsWorkspace({ orders = [], setOrders }) {
  const [soSearch, setSoSearch] = useState("");
  const [loadedSoNumber, setLoadedSoNumber] = useState("");
  const [message, setMessage] = useState("");

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
    setMessage(`${matchedOrder.soNumber} loaded into Shipping Operations.`);
  };

  const clearLoadedOrder = () => {
    setLoadedSoNumber("");
    setSoSearch("");
    setMessage("");
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
    setMessage(`${loadedOrder.soNumber} has been completed.`);
  };

  const renderExecutionActions = () => {
    if (!loadedOrder) return null;

    return (
      <div className="shipping-station-actions">
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
    );
  };

  const renderLoadStation = () => {
    return (
      <>
        <div className="shipping-station-load-panel">
          <div>
            <h2>Load Shipping Order</h2>
            <p>
              Enter the SO number from the release slip or Active Orders queue to
              begin execution.
            </p>
          </div>

          <div className="shipping-station-load-controls">
            <input
              value={soSearch}
              onChange={(e) => setSoSearch(e.target.value)}
              placeholder="Enter SO Number, example SO-000100"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoadOrder();
              }}
            />

            <button className="inventory-primary-button" onClick={handleLoadOrder}>
              Load SO
            </button>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Active SO Queue</h2>

          <p className="panel-note">
            Select an SO by entering the SO number above. The full queue is only
            shown before an SO is loaded.
          </p>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>SO #</th>
                <th>JO #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>STG Location</th>
                <th>Job Type</th>
              </tr>
            </thead>

            <tbody>
              {activeOrders.length === 0 ? (
                <tr>
                  <td colSpan="6">No active shipping orders found.</td>
                </tr>
              ) : (
                activeOrders.map((order) => (
                  <tr key={order.soNumber}>
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
      </>
    );
  };

  const renderLoadedStation = () => {
    if (!loadedOrder) return null;

    return (
      <div className="shipping-station-workspace">
        <div className="shipping-station-header-card">
          <div>
            <h2>Shipping Station</h2>

            <p>
              Focused execution view for the loaded SO. Queue and dashboard
              sections are hidden until the SO is cleared.
            </p>
          </div>

          <div className="shipping-station-status">
            <span>{loadedOrder.releaseStatus}</span>
            <strong>{loadedOrder.soNumber}</strong>
          </div>
        </div>

        <div className="shipping-station-main-grid shipping-transaction-grid">
          <div className="shipping-station-card shipping-station-large">
            <h2>Order Identity</h2>

            <div className="order-release-summary-grid">
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

          <div className="shipping-station-card">
            <h2>Inventory / STG</h2>

            <div className="order-release-mini-grid">
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

          <div className="shipping-station-card">
            <h2>Shipment Profile</h2>

            <div className="order-release-mini-grid">
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

          <div className="shipping-station-card">
            <h2>Work / Details</h2>

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

          <div className="shipping-station-card shipping-station-action-card">
            <h2>Execution Actions</h2>

            <p className="panel-note">
              Start begins physical work against the SO. Complete finalizes the
              operational execution record.
            </p>

            {renderExecutionActions()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="inventory-subview shipping-operations-workspace">
      <div className="inventory-header-row shipping-operations-header">
        <div>
          <h1>Shipping Operations</h1>

          <p>
            Load one SO at a time and execute the active STG order through start
            and completion.
          </p>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      {!loadedOrder && renderLoadStation()}

      {loadedOrder && renderLoadedStation()}
    </div>
  );
}

export default ShippingOperationsWorkspace;
