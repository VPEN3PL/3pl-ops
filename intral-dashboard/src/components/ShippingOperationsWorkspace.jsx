import React, { useEffect, useMemo, useState } from "react";

const internalDelayReasonOptions = [
  "",
  "Carrier / Courier No-Show",
  "Carrier Reschedule",
  "Material Not Ready",
  "Address / Contact Issue",
  "Weather / Access Delay",
  "Customer Hold",
  "Internal Resource Constraint",
  "Other",
];

const defaultInternalExceptionForm = {
  internalDelayReason: "",
  carrierCourierIssue: "",
  delayOwner: "",
  rescheduleCount: "",
  internalExceptionNotes: "",
};

const internalExceptionInputStyle = {
  width: "100%",
  minHeight: "34px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "8px 10px",
  fontWeight: 800,
};

function ShippingOperationsWorkspace({ orders = [], setOrders, onUpdateOrderStatus, onSaveInternalException, deepLinkTarget }) {
  const [soSearch, setSoSearch] = useState("");
  const [loadedSoNumber, setLoadedSoNumber] = useState("");
  const [recentlyCompletedOrder, setRecentlyCompletedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedSection, setExpandedSection] = useState("load");
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [internalExceptionForm, setInternalExceptionForm] = useState(
    defaultInternalExceptionForm
  );

  const shippingOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.soNumber &&
        (order.releaseStatus === "Active" ||
          order.releaseStatus === "Started")
    );
  }, [orders]);

  const loadedOrder = useMemo(() => {
    return (
      shippingOrders.find((order) => order.soNumber === loadedSoNumber) || null
    );
  }, [shippingOrders, loadedSoNumber]);

  const activeOrders = useMemo(() => {
    return shippingOrders.filter(
      (order) => order.releaseStatus === "Active" || order.releaseStatus === "Started"
    );
  }, [shippingOrders]);


  useEffect(() => {
    if (!loadedOrder) {
      setInternalExceptionForm(defaultInternalExceptionForm);
      return;
    }

    setInternalExceptionForm({
      internalDelayReason: loadedOrder.internalDelayReason || "",
      carrierCourierIssue: loadedOrder.carrierCourierIssue || "",
      delayOwner: loadedOrder.delayOwner || "",
      rescheduleCount: loadedOrder.rescheduleCount || "",
      internalExceptionNotes: loadedOrder.internalExceptionNotes || "",
    });
  }, [loadedOrder]);

  useEffect(() => {
    if (!deepLinkTarget) return;

    const targetType = String(deepLinkTarget.targetType || "").toLowerCase();
    const targetId = String(
      deepLinkTarget.targetId ||
        deepLinkTarget.soNumber ||
        deepLinkTarget.so_number ||
        deepLinkTarget.jobNumber ||
        deepLinkTarget.job_number ||
        ""
    ).trim();

    if (!targetId) return;
    if (!["shipping", "so", "workspace"].includes(targetType)) return;

    const matchedOrder = shippingOrders.find(
      (order) => order.soNumber === targetId || order.joNumber === targetId
    );

    if (!matchedOrder) return;

    setSoSearch(matchedOrder.soNumber);
    setLoadedSoNumber(matchedOrder.soNumber);
    setRecentlyCompletedOrder(null);
    setExpandedSection("validation");
    setDetailViewOpen(true);
    setMessage(`${matchedOrder.soNumber} opened from notification.`);
  }, [deepLinkTarget, shippingOrders]);

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
    setDetailViewOpen(true);
    setMessage(`${matchedOrder.soNumber} loaded into Shipping Operations.`);
  };

  const clearLoadedOrder = () => {
    setLoadedSoNumber("");
    setRecentlyCompletedOrder(null);
    setSoSearch("");
    setMessage("");
    setExpandedSection("load");
    setDetailViewOpen(false);
  };

  const startJob = async () => {
    if (!loadedOrder) {
      alert("Load an SO before starting the job.");
      return;
    }

    if (loadedOrder.releaseStatus !== "Active") {
      alert("Only Active orders can be started.");
      return;
    }

    const nowDate = new Date();
    const now = nowDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedOrders = orders.map((order) =>
      order.soNumber === loadedOrder.soNumber
        ? {
            ...order,
            releaseStatus: "Started",
            startedAt: now,
            startedAtIso: nowDate.toISOString(),
          }
        : order
    );

    setOrders(updatedOrders);

    if (onUpdateOrderStatus) {
      const result = await onUpdateOrderStatus(loadedOrder, "Started", {
        startedAt: now,
        startedAtIso: nowDate.toISOString(),
      });

      if (result && result.success === false) {
        alert(`Job started locally, but Supabase did not save the update: ${result.error}`);
      }
    }

    setLoadedSoNumber(loadedOrder.soNumber);
    setExpandedSection("execution");
    setMessage(`${loadedOrder.soNumber} has been started.`);
  };

  const completeJob = async () => {
    if (!loadedOrder) {
      alert("Load an SO before completing the job.");
      return;
    }

    if (loadedOrder.releaseStatus !== "Started") {
      alert("Only Started orders can be completed.");
      return;
    }

    const confirmed = window.confirm(
      `Complete and close ${loadedOrder.soNumber}?

This will remove the SO from active Shipping Operations and move the JO to Closed Orders. Invoice Control will remain open for save/update after closure.`
    );

    if (!confirmed) return;

    const nowDate = new Date();
    const now = nowDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const closedOrder = {
      ...loadedOrder,
      releaseStatus: "Closed",
      completedAt: now,
      completedAtIso: nowDate.toISOString(),
      closedAt: now,
      closedAtIso: nowDate.toISOString(),
    };

    const updatedOrders = orders.map((order) =>
      order.soNumber === loadedOrder.soNumber ? closedOrder : order
    );

    setOrders(updatedOrders);

    if (onUpdateOrderStatus) {
      const result = await onUpdateOrderStatus(loadedOrder, "Closed", {
        completedAt: now,
        completedAtIso: nowDate.toISOString(),
        closedAt: now,
        closedAtIso: nowDate.toISOString(),
      });

      if (result && result.success === false) {
        alert(`Job closed locally, but Supabase did not save the update: ${result.error}`);
      }
    }

    setRecentlyCompletedOrder(closedOrder);
    setLoadedSoNumber("");
    setSoSearch("");
    setDetailViewOpen(false);
    setExpandedSection("completion");
    setMessage(`${loadedOrder.soNumber} has been completed and moved to Closed Orders. Pick List / Completion is ready to preview or print.`);
  };

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatDateTimeDisplay = (value) => {
    if (!value) return "-";

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return value;
  };

  const getJobStartedAt = (order) => {
    return order?.startedAtIso || order?.startTimeIso || order?.start_time || order?.startedAt || order?.startTime || "";
  };

  const getJobCompletedAt = (order) => {
    return order?.completedAtIso || order?.completeTimeIso || order?.complete_time || order?.closedAtIso || order?.completedAt || order?.closedAt || "";
  };

  const getJobDurationDisplay = (order) => {
    const startedValue = getJobStartedAt(order);
    const completedValue = getJobCompletedAt(order);

    if (!startedValue || !completedValue) return "Pending";

    const started = new Date(startedValue);
    const completed = new Date(completedValue);

    if (Number.isNaN(started.getTime()) || Number.isNaN(completed.getTime())) {
      return "Pending";
    }

    const diffMs = completed.getTime() - started.getTime();

    if (diffMs < 0) return "Pending";

    const totalMinutes = Math.max(1, Math.round(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours && minutes) return `${hours} hr ${minutes} min`;
    if (hours) return `${hours} hr`;
    return `${minutes} min`;
  };

  const getPrintableCompletionOrder = () => {
    return loadedOrder || recentlyCompletedOrder;
  };

  const buildCompletionDocumentHtml = (order) => {
    if (!order) return "";

    const printedAt = new Date().toLocaleString();
    const startedAtDisplay = formatDateTimeDisplay(getJobStartedAt(order));
    const completedAtDisplay = formatDateTimeDisplay(getJobCompletedAt(order));
    const durationDisplay = getJobDurationDisplay(order);
    const workDetails = order.additionalDetails || order.details || "No additional details provided.";
    const additionalWork = Array.isArray(order.additionalWork) && order.additionalWork.length > 0
      ? order.additionalWork.join("<br />")
      : "No additional work attached.";

    return `
      <!doctype html>
      <html>
        <head>
          <title>INTRAL Pick List / Completion - ${escapeHtml(order.soNumber || order.joNumber || "")}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .actions { display: flex; justify-content: flex-end; gap: 10px; width: 8.5in; margin: 0 auto 12px; padding-top: 12px; }
            .actions button { border: none; border-radius: 8px; padding: 9px 14px; font-weight: 800; cursor: pointer; }
            .print-button { background: #00615f; color: #ffffff; }
            .close-button { background: #e5e7eb; color: #111827; }
            .page { width: 8.5in; min-height: 11in; margin: 0 auto; padding: 0.55in 0.62in; background: #ffffff; }
            .top { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; border-bottom: 2px solid #00615f; padding-bottom: 14px; margin-bottom: 18px; }
            .brand { color: #00615f; font-size: 26px; font-weight: 900; letter-spacing: 0.04em; }
            .company { margin-top: 10px; font-size: 12px; line-height: 1.35; }
            .title { text-align: right; }
            .title h1 { margin: 0; color: #00615f; font-size: 24px; letter-spacing: 0.04em; }
            .title p { margin: 6px 0 0; font-size: 13px; font-weight: 800; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
            .field { border: 1px solid #cbd5e1; padding: 10px; min-height: 54px; }
            .field span { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 800; margin-bottom: 4px; }
            .field strong { font-size: 14px; overflow-wrap: anywhere; }
            .section { border: 1px solid #cbd5e1; margin-bottom: 16px; }
            .section-title { background: #00615f; color: #ffffff; padding: 9px 10px; font-weight: 900; text-transform: uppercase; font-size: 13px; }
            .section-body { padding: 12px; font-size: 13px; line-height: 1.45; min-height: 80px; white-space: pre-wrap; }
            .signature { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 42px; }
            .signature div { border-top: 1px solid #111827; padding-top: 8px; font-size: 11px; text-transform: uppercase; color: #374151; }
            @media print { body { background: #ffffff; } .actions { display: none; } .page { width: auto; min-height: auto; margin: 0; padding: 0.35in 0.45in; } }
          </style>
        </head>

        <body>
          <div class="actions">
            <button class="close-button" onclick="window.close()">Close Preview</button>
            <button class="print-button" onclick="window.print()">Print Completion</button>
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
                <h1>PICK LIST / COMPLETION</h1>
                <p>${escapeHtml(order.soNumber || "No SO")}</p>
              </div>
            </div>

            <section class="grid">
              <div class="field"><span>SO Number</span><strong>${escapeHtml(order.soNumber || "-")}</strong></div>
              <div class="field"><span>JO Number</span><strong>${escapeHtml(order.joNumber || "-")}</strong></div>
              <div class="field"><span>Customer</span><strong>${escapeHtml(order.customer || "-")}</strong></div>
              <div class="field"><span>Job Type</span><strong>${escapeHtml(order.jobType || "-")}</strong></div>
              <div class="field"><span>Status</span><strong>${escapeHtml(order.releaseStatus || "-")}</strong></div>
              <div class="field"><span>STG Location</span><strong>${escapeHtml(order.stagingLocation || "-")}</strong></div>
              <div class="field"><span>Ship To / Destination</span><strong>${escapeHtml(order.finalDestination || order.shipTo || "-")}</strong></div>
              <div class="field"><span>Printed At</span><strong>${escapeHtml(printedAt)}</strong></div>
              <div class="field"><span>Started At</span><strong>${escapeHtml(startedAtDisplay)}</strong></div>
              <div class="field"><span>Completed At</span><strong>${escapeHtml(completedAtDisplay)}</strong></div>
              <div class="field"><span>Total Job Duration</span><strong>${escapeHtml(durationDisplay)}</strong></div>
            </section>

            <section class="section">
              <div class="section-title">Work Details</div>
              <div class="section-body">${escapeHtml(workDetails)}</div>
            </section>

            <section class="section">
              <div class="section-title">Additional Work</div>
              <div class="section-body">${additionalWork}</div>
            </section>

            <section class="section">
              <div class="section-title">Completion Confirmation</div>
              <div class="section-body">
                Operational work has been completed and the order has been moved to Closed Orders. Total job duration is recorded on this Pick List / Completion document. Invoice Control remains available for invoice creation or invoice amount updates when additional billable work is identified.
              </div>
            </section>

            <div class="signature">
              <div>Completed By / Date</div>
              <div>Reviewed By / Date</div>
            </div>
          </main>
        </body>
      </html>
    `;
  };

  const printCompletionDocument = () => {
    const printableOrder = getPrintableCompletionOrder();

    if (!printableOrder) {
      alert("Load an SO or complete a job before printing the Pick List / Completion document.");
      return;
    }

    const completionWindow = window.open("", "_blank", "width=950,height=850");

    if (!completionWindow) {
      alert("Popup blocked. Please allow popups to print the completion document.");
      return;
    }

    completionWindow.document.open();
    completionWindow.document.write(buildCompletionDocumentHtml(printableOrder));
    completionWindow.document.close();
  };


  const openShippingDetail = (order) => {
    if (!order?.soNumber) return;

    setSoSearch(order.soNumber);
    setLoadedSoNumber(order.soNumber);
    setRecentlyCompletedOrder(null);
    setExpandedSection("validation");
    setDetailViewOpen(true);
    setMessage(`${order.soNumber} opened in Shipping Detail.`);
  };

  const renderOpenDetailButton = (order) => {
    return (
      <button
        type="button"
        className="inventory-primary-button"
        title="Open Shipping Detail"
        aria-label={`Open Shipping Detail for ${order?.soNumber || "SO"}`}
        onClick={(event) => {
          event.stopPropagation();
          openShippingDetail(order);
        }}
        style={{
          minWidth: "34px",
          width: "34px",
          height: "30px",
          padding: "0",
          borderRadius: "999px",
          fontSize: "18px",
          lineHeight: 1,
          fontWeight: 900,
        }}
      >
        +
      </button>
    );
  };

  const updateInternalExceptionForm = (field, value) => {
    setInternalExceptionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveInternalExceptionNotes = async () => {
    if (!loadedOrder) {
      alert("Load one SO before saving internal exception notes.");
      return;
    }

    const nextInternalException = {
      internalDelayReason: internalExceptionForm.internalDelayReason,
      carrierCourierIssue: internalExceptionForm.carrierCourierIssue,
      delayOwner: internalExceptionForm.delayOwner,
      rescheduleCount: internalExceptionForm.rescheduleCount,
      internalExceptionNotes: internalExceptionForm.internalExceptionNotes,
    };

    if (onSaveInternalException) {
      const result = await onSaveInternalException(loadedOrder, nextInternalException);

      if (result && result.success === false) {
        alert(`Internal exception notes saved locally, but Supabase did not save the update: ${result.error}`);
        return;
      }
    } else if (setOrders) {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.soNumber === loadedOrder.soNumber || order.joNumber === loadedOrder.joNumber
            ? {
                ...order,
                ...nextInternalException,
                internalExceptionUpdatedAt: new Date().toISOString(),
              }
            : order
        )
      );
    }

    setMessage(`Internal exception notes saved for ${loadedOrder.soNumber}.`);
  };

  const renderInternalExceptionSection = () => {
    if (!loadedOrder) return null;

    return (
      <div className="order-detail-section compact-order-section">
        <h3>Internal Delay / Exception Notes</h3>
        <p>
          Internal operational reasoning only. This is not a customer-facing summary.
        </p>

        <div className="order-release-summary-grid shipping-workbench-field-grid">
          <div className="order-detail-field">
            <span>Internal Delay Reason</span>
            <select
              value={internalExceptionForm.internalDelayReason}
              onChange={(event) =>
                updateInternalExceptionForm("internalDelayReason", event.target.value)
              }
              style={internalExceptionInputStyle}
            >
              {internalDelayReasonOptions.map((option) => (
                <option key={option || "blank"} value={option}>
                  {option || "Select delay reason"}
                </option>
              ))}
            </select>
          </div>

          <div className="order-detail-field">
            <span>Carrier / Courier Issue</span>
            <select
              value={internalExceptionForm.carrierCourierIssue}
              onChange={(event) =>
                updateInternalExceptionForm("carrierCourierIssue", event.target.value)
              }
              style={internalExceptionInputStyle}
            >
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div className="order-detail-field">
            <span>Delay Owner</span>
            <input
              value={internalExceptionForm.delayOwner}
              onChange={(event) =>
                updateInternalExceptionForm("delayOwner", event.target.value)
              }
              placeholder="Carrier, Customer, INTRAL, Vendor, Other"
              style={internalExceptionInputStyle}
            />
          </div>

          <div className="order-detail-field">
            <span>Reschedule Count</span>
            <input
              type="number"
              min="0"
              value={internalExceptionForm.rescheduleCount}
              onChange={(event) =>
                updateInternalExceptionForm("rescheduleCount", event.target.value)
              }
              placeholder="0"
              style={internalExceptionInputStyle}
            />
          </div>
        </div>

        <textarea
          rows="4"
          value={internalExceptionForm.internalExceptionNotes}
          onChange={(event) =>
            updateInternalExceptionForm("internalExceptionNotes", event.target.value)
          }
          placeholder="Example: Scheduled truck courier did not arrive for pickup. Courier was rescheduled three times. Warehouse was ready; delay was caused by carrier availability."
          style={{
            ...internalExceptionInputStyle,
            minHeight: "88px",
            marginTop: "10px",
            resize: "vertical",
          }}
        />

        {(loadedOrder.internalExceptionUpdatedAt || loadedOrder.internalExceptionUpdatedBy) && (
          <p style={{ marginTop: "8px", color: "#64748b", fontSize: "11px" }}>
            Last updated by {loadedOrder.internalExceptionUpdatedBy || "INTRAL User"}{" "}
            {loadedOrder.internalExceptionUpdatedAt
              ? `on ${formatDateTimeDisplay(loadedOrder.internalExceptionUpdatedAt)}`
              : ""}
          </p>
        )}

        <button
          className="inventory-primary-button"
          onClick={saveInternalExceptionNotes}
          style={{ marginTop: "10px" }}
        >
          Save Internal Exception Notes
        </button>
      </div>
    );
  };

  const renderShippingDetailWorkspace = () => {
    if (!loadedOrder) return null;

    return (
      <div className="phase17-smart-card">
        <div className="phase17-smart-card-header">
          <div>
            <span>Shipping Detail Workspace</span>
            <strong>{loadedOrder.soNumber} / {loadedOrder.joNumber}</strong>
            <p>Review the full SO record, execute work, and print completion without opening dropdown sections.</p>
          </div>

          <div className="shipping-station-actions shipping-workbench-actions">
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={() => {
                setDetailViewOpen(false);
                setExpandedSection("load");
              }}
            >
              ← Back to Shipping Queue
            </button>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="phase17-smart-card-body">
          <div className="phase17-smart-sections">
            <div className="order-detail-section compact-order-section">
              <h3>Shipping Order Identity</h3>
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
                  <strong>{loadedOrder.customer || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Status</span>
                  <strong>{loadedOrder.releaseStatus || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Job Type</span>
                  <strong>{loadedOrder.jobType || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Priority</span>
                  <strong>{loadedOrder.priority || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>STG Location</span>
                  <strong>{loadedOrder.stagingLocation || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Requestor</span>
                  <strong>{loadedOrder.requestor || "-"}</strong>
                </div>
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Inventory / STG Verification</h3>
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

            <div className="order-detail-section compact-order-section">
              <h3>Shipment Profile</h3>
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
                  <strong>{loadedOrder.finalDestination || loadedOrder.shipTo || "-"}</strong>
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

            <div className="order-detail-section compact-order-section">
              <h3>Work / Details</h3>
              {loadedOrder.additionalWork?.length > 0 ? (
                loadedOrder.additionalWork.map((item, index) => (
                  <p key={`${loadedOrder.soNumber}-detail-work-${index}`}>{item}</p>
                ))
              ) : (
                <p>No additional work attached.</p>
              )}

              <p>
                {loadedOrder.additionalDetails ||
                  loadedOrder.details ||
                  "No additional details."}
              </p>
            </div>

            {renderInternalExceptionSection()}

            <div className="order-detail-section compact-order-section">
              <h3>Execution Controls</h3>
              <p>
                Start begins physical work against the SO. Complete closes the job and moves it to Closed Orders.
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

                <button className="history-button" onClick={printCompletionDocument}>
                  Print Completion
                </button>

                <button className="history-button" onClick={clearLoadedOrder}>
                  Clear SO
                </button>
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Pick List / Completion</h3>
              <div className="order-release-summary-grid order-workbench-field-grid">
                <div className="order-detail-field">
                  <span>Started At</span>
                  <strong>{formatDateTimeDisplay(getJobStartedAt(loadedOrder))}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Completed At</span>
                  <strong>{formatDateTimeDisplay(getJobCompletedAt(loadedOrder))}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Total Job Duration</span>
                  <strong>{getJobDurationDisplay(loadedOrder)}</strong>
                </div>
              </div>

              <div className="shipping-station-actions shipping-workbench-actions">
                <button className="inventory-primary-button" onClick={printCompletionDocument}>
                  Preview / Print Completion
                </button>
              </div>
            </div>
          </div>

          {renderExecutionSummary()}
        </div>
      </div>
    );
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
    if (sectionKey === "completion") {
      const printableOrder = getPrintableCompletionOrder();
      if (!printableOrder) return "Waiting";
      return printableOrder.releaseStatus === "Closed" ? "Closed" : "Preview";
    }
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
                    <th>Action</th>
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
                      <td colSpan="7">No active shipping orders found.</td>
                    </tr>
                  ) : (
                    activeOrders.map((order) => (
                      <tr key={order.soNumber}>
                        <td>{renderOpenDetailButton(order)}</td>
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
              Start begins physical work against the SO. Complete closes the job and moves it to Closed Orders.
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
                onClick={printCompletionDocument}
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

  const renderCompletionSection = () => {
    const completionOrder = getPrintableCompletionOrder();

    if (!completionOrder) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "completion",
          "Pick List / Completion",
          "Preview and print the completion record with total job duration"
        )}

        {expandedSection === "completion" && (
          <div className="phase17-accordion-body">
            <div className="order-release-summary-grid order-workbench-field-grid">
              <div className="order-detail-field">
                <span>SO Number</span>
                <strong>{completionOrder.soNumber || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>JO Number</span>
                <strong>{completionOrder.joNumber || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Status</span>
                <strong>{completionOrder.releaseStatus || "-"}</strong>
              </div>

              <div className="order-detail-field">
                <span>Started At</span>
                <strong>{formatDateTimeDisplay(getJobStartedAt(completionOrder))}</strong>
              </div>

              <div className="order-detail-field">
                <span>Completed At</span>
                <strong>{formatDateTimeDisplay(getJobCompletedAt(completionOrder))}</strong>
              </div>

              <div className="order-detail-field">
                <span>Total Job Duration</span>
                <strong>{getJobDurationDisplay(completionOrder)}</strong>
              </div>
            </div>

            <div className="dashboard-message">
              Pick List / Completion is available after the SO is completed. The printed document includes Started At, Completed At, and Total Job Duration.
            </div>

            <div className="shipping-station-actions shipping-workbench-actions">
              <button className="inventory-primary-button" onClick={printCompletionDocument}>
                Preview / Print Completion
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExecutionSummary = () => {
    const summaryOrder = getPrintableCompletionOrder();

    return (
      <aside className="phase17-smart-summary shipping-workbench-summary">
        <div className="job-request-summary-panel">
          <div className="job-summary-header">
            <span>Execution Snapshot</span>
            <strong>{summaryOrder?.soNumber || "No SO Loaded"}</strong>
          </div>

          <div className="job-summary-grid">
            <div>
              <span>Status</span>
              <strong>{summaryOrder?.releaseStatus || "Waiting"}</strong>
            </div>

            <div>
              <span>JO Number</span>
              <strong>{summaryOrder?.joNumber || "Pending"}</strong>
            </div>

            <div>
              <span>Customer</span>
              <strong>{summaryOrder?.customer || "Pending"}</strong>
            </div>

            <div>
              <span>STG Location</span>
              <strong>{summaryOrder?.stagingLocation || "Pending"}</strong>
            </div>

            <div>
              <span>Started</span>
              <strong>{formatDateTimeDisplay(getJobStartedAt(summaryOrder))}</strong>
            </div>

            <div>
              <span>Completed</span>
              <strong>{formatDateTimeDisplay(getJobCompletedAt(summaryOrder))}</strong>
            </div>

            <div>
              <span>Total Duration</span>
              <strong>{getJobDurationDisplay(summaryOrder)}</strong>
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

          {recentlyCompletedOrder && !loadedOrder && (
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={() => setExpandedSection("completion")}
              style={{ marginTop: "8px", width: "100%" }}
            >
              Pick List / Completion
            </button>
          )}

          <p className="job-summary-note">
            Shipping Operations is controlled one SO at a time to protect the
            execution workflow. Completed jobs move to Closed Orders, and total
            duration prints on the Pick List / Completion document.
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
        {loadedOrder && detailViewOpen ? (
          renderShippingDetailWorkspace()
        ) : (
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
                <span className={getPrintableCompletionOrder()?.releaseStatus === "Closed" ? "active" : ""}>4 Complete</span>
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
                {renderCompletionSection()}
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
                onClick={() => {
                  if (loadedOrder) {
                    setDetailViewOpen(true);
                    setExpandedSection("execution");
                  } else {
                    setExpandedSection("load");
                  }
                }}
              >
                {loadedOrder ? "Open Shipping Detail →" : "Load SO →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShippingOperationsWorkspace;
