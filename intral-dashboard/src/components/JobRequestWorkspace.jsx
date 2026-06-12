import React, { useEffect, useMemo, useState } from "react";

const availableInventory = [
  {
    id: "INV-1001",
    partNumber: "PN-45882",
    customer: "Gillette",
    availableQty: 100,
    site: "1K",
    location: "1K-22-A1",
    status: "Available",
  },
  {
    id: "INV-1002",
    partNumber: "PN-77811",
    customer: "Gillette",
    availableQty: 45,
    site: "A&M",
    location: "AM-14-C2",
    status: "Available",
  },
  {
    id: "INV-1003",
    partNumber: "PN-99021",
    customer: "P&G",
    availableQty: 250,
    site: "6K",
    location: "6K-88-D1",
    status: "Available",
  },
  {
    id: "INV-1004",
    partNumber: "PN-11122",
    customer: "Gillette",
    availableQty: 0,
    site: "DCIC",
    location: "DCIC-HOLD",
    status: "Unavailable",
  },
];

const amStoredAddresses = [
  {
    label: "RIGGING AND LOGISTICS",
    value: "RIGGING AND LOGISTICS - 64 Mill Street South Bridge, MA 01550",
  },
  {
    label: "LOGISTICS C/O MEYERS RIGGING",
    value: "LOGISTICS C/O MEYERS RIGGING: 175 Great Pond Dr, Windsor CT 06095",
  },
];

function JobRequestWorkspace({ requestMode = "movement", onCreateJobRequest, isGuest = false, onAfterSubmit }) {
  const [submittedJobOrder, setSubmittedJobOrder] = useState("");
  const [isSubmittedLocked, setIsSubmittedLocked] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requestorForm, setRequestorForm] = useState({
    chargeType: "",
    chargeNumber: "",
    companyName: "",
    requestorName: "",
    telephone: "",
    email: "",
    submissionStatus: "Pending Internal Review",
  });

  const [movementForm, setMovementForm] = useState({
    inventoryId: "",
    moveQty: "",
    toLocation: "",
    reason: "",
  });

  const [shippingType, setShippingType] = useState("");

  const [shippingForm, setShippingForm] = useState({
    pcs: "",
    weight: "",
    dimensions: "",

    shipFromCompany: "",
    shipFromAddress: "",
    shipFromStreet: "",
    shipFromState: "",
    shipFromZip: "",
    shipFromCountry: "",

    amStoredAddress: "",

    shipToCompany: "",
    shipToAddress: "",
    shipToStreet: "",
    shipToState: "",
    shipToZip: "",
    shipToCountry: "",
    shipToContactName: "",
    shipToTelephone: "",
    shipToEmail: "",
  });

  const [logisticsForm, setLogisticsForm] = useState({
    supportType: "",
    currentLocation: "",
    supportDestination: "",
    equipmentNeeded: "",
    dueDate: "",
    notes: "",
  });

  const [additionalDetails, setAdditionalDetails] = useState("");
  const [expandedSection, setExpandedSection] = useState("requestor");

  useEffect(() => {
    setSubmittedJobOrder("");
    setIsSubmittedLocked(false);
    setTrackingNumber("");
    setAdditionalDetails("");
    setShippingType("");
    setExpandedSection("requestor");

    setMovementForm({
      inventoryId: "",
      moveQty: "",
      toLocation: "",
      reason: "",
    });

    setShippingForm({
      pcs: "",
      weight: "",
      dimensions: "",

      shipFromCompany: "",
      shipFromAddress: "",
      shipFromStreet: "",
      shipFromZip: "",
      shipFromCountry: "",

      amStoredAddress: "",

      shipToCompany: "",
      shipToAddress: "",
      shipToStreet: "",
      shipToZip: "",
      shipToCountry: "",
      shipToContactName: "",
      shipToTelephone: "",
      shipToEmail: "",
    });

    setLogisticsForm({
      supportType: "",
      currentLocation: "",
      supportDestination: "",
      equipmentNeeded: "",
      dueDate: "",
      notes: "",
    });
  }, [requestMode]);

  const selectedInventory = useMemo(() => {
    return (
      availableInventory.find((item) => item.id === movementForm.inventoryId) ||
      null
    );
  }, [movementForm.inventoryId]);

  const updateRequestorForm = (field, value) => {
    setRequestorForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateMovementForm = (field, value) => {
    setMovementForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateShippingForm = (field, value) => {
    setShippingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateLogisticsForm = (field, value) => {
    setLogisticsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getRequestTitle = () => {
    if (requestMode === "movement") return "Inventory Movement";
    if (requestMode === "shipping") return "Shipping";
    if (requestMode === "logistics") return "Logistics Support";
    if (requestMode === "dashboard") return "Job Request Dashboard";

    return "Request";
  };

  const validateRequestor = () => {
    if (!requestorForm.companyName.trim()) {
      alert("Company name is required.");
      return false;
    }

    if (!requestorForm.requestorName.trim()) {
      alert("Requestor name is required.");
      return false;
    }

    if (isGuest && !requestorForm.email.trim()) {
      alert("Requestor email is required for guest requests.");
      return false;
    }

    if (isGuest && !requestorForm.telephone.trim()) {
      alert("Requestor telephone is required for guest requests.");
      return false;
    }

    return true;
  };

  const validateInventoryMovement = () => {
    if (!movementForm.inventoryId) {
      alert(
        "Inventory ID must be selected before submitting an Inventory Movement request."
      );
      return false;
    }

    if (!selectedInventory) {
      alert("Selected inventory was not found.");
      return false;
    }

    if (
      selectedInventory.status !== "Available" ||
      Number(selectedInventory.availableQty || 0) <= 0
    ) {
      alert(
        "Inventory must be available before the movement request can proceed."
      );
      return false;
    }

    const moveQty = Number(movementForm.moveQty || 0);

    if (!moveQty || moveQty <= 0) {
      alert("Move quantity must be greater than zero.");
      return false;
    }

    if (moveQty > Number(selectedInventory.availableQty || 0)) {
      alert("Move quantity cannot exceed available inventory quantity.");
      return false;
    }

    if (!movementForm.toLocation.trim()) {
      alert("To Location is required.");
      return false;
    }

    return true;
  };

  const validateShippingCommon = () => {
    if (!shippingType) {
      alert("Select a shipping workflow.");
      return false;
    }

    if (!shippingForm.pcs || Number(shippingForm.pcs) <= 0) {
      alert("PCS must be greater than zero.");
      return false;
    }


    if (!shippingForm.shipFromCompany.trim()) {
      alert("Ship From company name is required.");
      return false;
    }

    if (!shippingForm.shipFromAddress.trim()) {
      alert("Ship From address is required.");
      return false;
    }

    if (!shippingForm.shipFromStreet.trim()) {
      alert("Ship From city is required.");
      return false;
    }

    if (!shippingForm.shipFromState.trim()) {
      alert("Ship From state is required.");
      return false;
    }

    if (!shippingForm.shipFromZip.trim()) {
      alert("Ship From zip code is required.");
      return false;
    }

    if (!shippingForm.shipFromCountry.trim()) {
      alert("Ship From country is required for shipping requests.");
      return false;
    }

    if (!shippingForm.shipToCompany.trim()) {
      alert("Ship To company name is required.");
      return false;
    }

    if (!shippingForm.shipToAddress.trim()) {
      alert("Ship To address is required.");
      return false;
    }

    if (!shippingForm.shipToStreet.trim()) {
      alert("Ship To city is required.");
      return false;
    }

    if (!shippingForm.shipToState.trim()) {
      alert("Ship To state is required.");
      return false;
    }

    if (!shippingForm.shipToZip.trim()) {
      alert("Ship To zip code is required.");
      return false;
    }

    if (!shippingForm.shipToCountry.trim()) {
      alert("Ship To destination country is required for shipping requests.");
      return false;
    }

    // Phase 23D-3D: Ship To contact name, telephone, and email remain visible
    // and are saved when provided, but they are optional for submission.

    return true;
  };

  const validateShipping = () => {
    if (!validateShippingCommon()) return false;

    if (shippingType === "am-crating" && !shippingForm.amStoredAddress.trim()) {
      alert("A&M stored address field is required.");
      return false;
    }

    return true;
  };

  const validateLogistics = () => {
    if (!logisticsForm.supportType.trim()) {
      alert("Support Type is required.");
      return false;
    }

    if (!logisticsForm.currentLocation.trim()) {
      alert("Current Location is required.");
      return false;
    }

    return true;
  };

  const handleSubmitRequest = async () => {
    if (isSubmitting) return;

    if (isSubmittedLocked || submittedJobOrder) {
      alert(
        "Request already submitted. This request is locked and cannot be edited from this screen. Please submit a new request or contact INTRAL operations if changes are required."
      );
      return;
    }

    if (!validateRequestor()) return;

    if (requestMode === "movement" && !validateInventoryMovement()) return;
    if (requestMode === "shipping" && !validateShipping()) return;
    if (requestMode === "logistics" && !validateLogistics()) return;

    if (typeof onCreateJobRequest !== "function") {
      alert(
        "Job Request submit is not connected to Supabase from this screen. Please contact INTRAL operations."
      );
      return;
    }

    const confirmed = window.confirm(
      "Confirm Job Release\n\nPlease confirm that all required additional work, shipping details, destination information, special handling instructions, and supporting documentation have been included before releasing this job."
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const result = await onCreateJobRequest({
        requestMode,
        requestTitle: getRequestTitle(),
        requestorForm,
        movementForm,
        shippingType,
        shippingForm,
        logisticsForm,
        additionalDetails,
        selectedInventory,
      });

      if (!result?.success) {
        alert(`Job Request was not submitted: ${result?.error || "Unknown Supabase error"}`);
        return;
      }

      setSubmittedJobOrder(result.jobNumber);
      setIsSubmittedLocked(true);
      setExpandedSection("");

      if (typeof onAfterSubmit === "function") {
        onAfterSubmit(result.jobNumber);
      }
    } catch (error) {
      alert(`Job Request was not submitted: ${error?.message || "Unexpected error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSummaryValue = (value, fallback = "Pending") => {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
  };

  const renderJobRequestDashboard = () => {
    return (
      <div className="inventory-subview job-request-workspace">
        <div className="inventory-header-row job-transaction-header">
          <div>
            <h1>Job Request Dashboard</h1>
            <p>
              Submit, track, and govern operational work requests before they
              enter Order Central.
            </p>
          </div>
        </div>

        <div className="job-request-kpi-strip">
          <div className="job-request-kpi">
            <span>Request Types</span>
            <strong>3</strong>
            <p>Movement, Shipping, Logistics</p>
          </div>

          <div className="job-request-kpi">
            <span>Tracking</span>
            <strong>JO #</strong>
            <p>Track requests by Job Order</p>
          </div>

          <div className="job-request-kpi">
            <span>Order Flow</span>
            <strong>Review</strong>
            <p>Requests route into Order Central</p>
          </div>

          <div className="job-request-kpi">
            <span>Governance</span>
            <strong>Active</strong>
            <p>Validation before submission</p>
          </div>
        </div>

        <div className="job-request-dashboard-grid">
          <div className="inventory-panel job-transaction-panel">
            <h2>Request Directory</h2>

            <div className="job-directory-grid">
              <div>
                <strong>Inventory Movement</strong>
                <p>Use when an inventory ID must move from one location to another.</p>
              </div>

              <div>
                <strong>Shipping</strong>
                <p>Use for outbound shipments or A&M crating-supported shipment workflows.</p>
              </div>

              <div>
                <strong>Logistics Support</strong>
                <p>Use for labor, forklift, dock, vendor, appointment, or special handling coordination.</p>
              </div>
            </div>
          </div>

          <div className="inventory-panel job-transaction-panel">
            <h2>How Requests Flow</h2>

            <div className="job-flow-steps">
              <span>Submit Request</span>
              <span>Order Central Review</span>
              <span>Allocation / Workload</span>
              <span>Release to Operations</span>
              <span>Track Completion</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryPanel = () => {
    return (
      <div className="job-request-summary-panel">
        <div className="job-summary-header">
          <span>Request Summary</span>
          <strong>{getRequestTitle()}</strong>
        </div>

        <div
          style={{
            background: "rgba(37, 99, 235, 0.1)",
            border: "1px solid rgba(37, 99, 235, 0.25)",
            color: "#1e3a8a",
            borderRadius: "9px",
            padding: "8px",
            marginBottom: "10px",
            fontWeight: 900,
            fontSize: "12px",
          }}
        >
          {isGuest ? "External / Guest Request" : "Internal Logged-In Request"} • Pending Internal Review
        </div>

        <div className="job-summary-grid">
          <div>
            <span>Requestor</span>
            <strong>{getSummaryValue(requestorForm.requestorName)}</strong>
          </div>

          <div>
            <span>Company</span>
            <strong>{getSummaryValue(requestorForm.companyName)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{requestorForm.submissionStatus}</strong>
          </div>

          <div>
            <span>Charge / PO</span>
            <strong>{getSummaryValue(requestorForm.chargeNumber)}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{getSummaryValue(requestorForm.email)}</strong>
          </div>

          {requestMode === "movement" && (
            <>
              <div>
                <span>Inventory</span>
                <strong>{getSummaryValue(movementForm.inventoryId)}</strong>
              </div>

              <div>
                <span>Move Qty</span>
                <strong>{getSummaryValue(movementForm.moveQty)}</strong>
              </div>

              <div>
                <span>To Location</span>
                <strong>{getSummaryValue(movementForm.toLocation)}</strong>
              </div>
            </>
          )}

          {requestMode === "shipping" && (
            <>
              <div>
                <span>Workflow</span>
                <strong>{getSummaryValue(shippingType)}</strong>
              </div>

              <div>
                <span>PCS</span>
                <strong>{getSummaryValue(shippingForm.pcs)}</strong>
              </div>

              <div>
                <span>Destination</span>
                <strong>{getSummaryValue(shippingForm.shipToCompany)}</strong>
              </div>

              <div>
                <span>Country</span>
                <strong>{getSummaryValue(shippingForm.shipToCountry)}</strong>
              </div>
            </>
          )}

          {requestMode === "logistics" && (
            <>
              <div>
                <span>Support Type</span>
                <strong>{getSummaryValue(logisticsForm.supportType)}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{getSummaryValue(logisticsForm.currentLocation)}</strong>
              </div>

              <div>
                <span>Due Date</span>
                <strong>{getSummaryValue(logisticsForm.dueDate)}</strong>
              </div>
            </>
          )}
        </div>

        {submittedJobOrder && (
          <div className="job-summary-success">
            <span>Submitted JO</span>
            <strong>{submittedJobOrder}</strong>
          </div>
        )}

        <button
          className="inventory-primary-button job-submit-button"
          onClick={handleSubmitRequest}
          disabled={isSubmittedLocked || isSubmitting}
        >
          {isSubmittedLocked ? "Request Submitted / Locked" : isSubmitting ? "Submitting..." : "Submit Job Request"}
        </button>

        <p className="job-summary-note">
          Request will route to Order Central for review, allocation, and
          operational release.
        </p>
      </div>
    );
  };


  const toggleWorkbenchSection = (sectionKey) => {
    setExpandedSection((current) => (current === sectionKey ? "" : sectionKey));
  };

  const renderAccordionHeader = (sectionKey, title, subtitle, status = "") => {
    const isOpen = expandedSection === sectionKey;

    return (
      <button
        type="button"
        className={isOpen ? "phase17-accordion-header open" : "phase17-accordion-header"}
        onClick={() => toggleWorkbenchSection(sectionKey)}
      >
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>

        <div className="phase17-accordion-right">
          {status && <small>{status}</small>}
          <b>{isOpen ? "−" : "+"}</b>
        </div>
      </button>
    );
  };

  const renderRequestorAccordion = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "requestor",
          "Requestor Information",
          "Charge / PO, requestor, contact",
          requestorForm.requestorName ? "Started" : "Pending"
        )}

        {expandedSection === "requestor" && (
          <div className="phase17-accordion-body">
            <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
              <select
                value={requestorForm.chargeType}
                onChange={(e) => updateRequestorForm("chargeType", e.target.value)}
              >
                <option value="Charge Number">Charge Number</option>
                <option value="PO Number">PO Number</option>
                <option value="No PO/Charge Numbers Available">
                  No PO/Charge Numbers Available
                </option>
              </select>

              <input
                value={requestorForm.chargeNumber}
                onChange={(e) => updateRequestorForm("chargeNumber", e.target.value)}
                placeholder="Charge Number or PO"
              />

              <input
                value={requestorForm.companyName}
                onChange={(e) => updateRequestorForm("companyName", e.target.value)}
                placeholder="Company Name"
              />

              <input
                value={requestorForm.requestorName}
                onChange={(e) => updateRequestorForm("requestorName", e.target.value)}
                placeholder="Requestor Name"
              />

              <input
                value={requestorForm.telephone}
                onChange={(e) => updateRequestorForm("telephone", e.target.value)}
                placeholder={isGuest ? "Telephone Required" : "Telephone Optional"}
              />

              <input
                value={requestorForm.email}
                onChange={(e) => updateRequestorForm("email", e.target.value)}
                placeholder={isGuest ? "Email Required" : "Email Optional"}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMovementAccordion = () => {
    return (
      <>
        <div className="phase17-accordion-section">
          {renderAccordionHeader(
            "movement",
            "Inventory Movement Information",
            "Inventory ID, quantity, destination",
            movementForm.inventoryId ? "Started" : "Pending"
          )}

          {expandedSection === "movement" && (
            <div className="phase17-accordion-body">
              <p className="panel-note">
                Inventory Movement requires a valid available Inventory ID before
                the request can proceed.
              </p>

              <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                <select
                  value={movementForm.inventoryId}
                  onChange={(e) => updateMovementForm("inventoryId", e.target.value)}
                >
                  <option value="">Select Inventory ID</option>

                  {availableInventory.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.status !== "Available" || item.availableQty <= 0}
                    >
                      {item.id} | {item.customer} | {item.partNumber} |
                      Available: {item.availableQty} | {item.location}
                    </option>
                  ))}
                </select>

                <input value={selectedInventory?.partNumber || ""} placeholder="Part Number" disabled />
                <input value={selectedInventory?.customer || ""} placeholder="Customer" disabled />
                <input value={selectedInventory?.availableQty ?? ""} placeholder="Available Qty" disabled />
                <input value={selectedInventory?.location || ""} placeholder="Current Location / From Location" disabled />

                <input
                  type="number"
                  value={movementForm.moveQty}
                  onChange={(e) => updateMovementForm("moveQty", e.target.value)}
                  placeholder="Move Qty"
                />

                <input
                  value={movementForm.toLocation}
                  onChange={(e) => updateMovementForm("toLocation", e.target.value)}
                  placeholder="To Location"
                />

                <textarea
                  rows="3"
                  value={movementForm.reason}
                  onChange={(e) => updateMovementForm("reason", e.target.value)}
                  placeholder="Reason for movement"
                />
              </div>
            </div>
          )}
        </div>

        {selectedInventory && (
          <div className="phase17-accordion-section">
            {renderAccordionHeader(
              "inventoryValidation",
              "Selected Inventory Validation",
              "Status, available quantity, location gate",
              selectedInventory.status
            )}

            {expandedSection === "inventoryValidation" && (
              <div className="phase17-accordion-body">
                <table className="inventory-table">
                  <tbody>
                    <tr>
                      <th>Inventory ID</th>
                      <td>{selectedInventory.id}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>{selectedInventory.status}</td>
                    </tr>
                    <tr>
                      <th>Available Qty</th>
                      <td>{selectedInventory.availableQty}</td>
                    </tr>
                    <tr>
                      <th>Current Location</th>
                      <td>{selectedInventory.location}</td>
                    </tr>
                    <tr>
                      <th>System Gate</th>
                      <td>
                        {selectedInventory.status === "Available" &&
                        selectedInventory.availableQty > 0
                          ? "Inventory available — request can proceed after qty/location validation."
                          : "Inventory unavailable — request cannot proceed."}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {renderAdditionalDetailsAccordion()}
      </>
    );
  };

  const renderShippingAccordion = () => {
    return (
      <>
        <div className="phase17-accordion-section">
          {renderAccordionHeader(
            "shippingType",
            "Shipping Request Type",
            "Outbound or A&M crating-supported workflow",
            shippingType ? "Selected" : "Pending"
          )}

          {expandedSection === "shippingType" && (
            <div className="phase17-accordion-body">
              <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                <select
                  value={shippingType}
                  onChange={(e) => {
                    const nextShippingType = e.target.value;
                    setShippingType(nextShippingType);
                    setExpandedSection(nextShippingType === "am-crating" ? "amCrating" : "shipmentDetails");
                  }}
                >
                  <option value="">Select Shipping Workflow</option>
                  <option value="outbound">Outbound Shipping</option>
                  <option value="am-crating">
                    Shipping with A&M Crating Support
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {shippingType === "am-crating" && (
          <div className="phase17-accordion-section">
            {renderAccordionHeader(
              "amCrating",
              "A&M Crating Support",
              "Vendor to A&M crating, then final destination",
              shippingForm.amStoredAddress ? "Selected" : "Pending"
            )}

            {expandedSection === "amCrating" && (
              <div className="phase17-accordion-body">
                <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                  <select
                    value={shippingForm.amStoredAddress}
                    onChange={(e) => updateShippingForm("amStoredAddress", e.target.value)}
                  >
                    <option value="">Select A&M Stored Address</option>

                    {amStoredAddresses.map((item) => (
                      <option key={item.label} value={item.value}>
                        {item.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {shippingType && (
          <>
            <div className="phase17-accordion-section">
              {renderAccordionHeader(
                "shipmentDetails",
                "Shipment Details",
                "Pieces",
                shippingForm.pcs ? "Started" : "Pending"
              )}

              {expandedSection === "shipmentDetails" && (
                <div className="phase17-accordion-body">
                  <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                    <input
                      type="number"
                      value={shippingForm.pcs}
                      onChange={(e) => updateShippingForm("pcs", e.target.value)}
                      placeholder="PCS"
                    />

                  </div>
                </div>
              )}
            </div>

            <div className="phase17-accordion-section">
              {renderAccordionHeader(
                "shipFrom",
                "Ship From",
                "Origin company and address",
                shippingForm.shipFromCompany ? "Started" : "Pending"
              )}

              {expandedSection === "shipFrom" && (
                <div className="phase17-accordion-body">
                  <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                    <input value={shippingForm.shipFromCompany} onChange={(e) => updateShippingForm("shipFromCompany", e.target.value)} placeholder="Company Name" />
                    <input value={shippingForm.shipFromAddress} onChange={(e) => updateShippingForm("shipFromAddress", e.target.value)} placeholder="Address" />
                    <input value={shippingForm.shipFromStreet} onChange={(e) => updateShippingForm("shipFromStreet", e.target.value)} placeholder="City" />
                    <input value={shippingForm.shipFromState} onChange={(e) => updateShippingForm("shipFromState", e.target.value)} placeholder="State" />
                    <input value={shippingForm.shipFromZip} onChange={(e) => updateShippingForm("shipFromZip", e.target.value)} placeholder="Zip / Postal Code" />
                    <input value={shippingForm.shipFromCountry} onChange={(e) => updateShippingForm("shipFromCountry", e.target.value)} placeholder="Origin Country" />
                  </div>
                </div>
              )}
            </div>

            {shippingType === "am-crating" && (
              <div className="phase17-accordion-section">
                {renderAccordionHeader(
                  "amDestination",
                  "A&M Destination",
                  "Stored crating address",
                  shippingForm.amStoredAddress ? "Ready" : "Pending"
                )}

                {expandedSection === "amDestination" && (
                  <div className="phase17-accordion-body">
                    <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                      <input value={shippingForm.amStoredAddress} placeholder="A&M Stored Address" disabled />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="phase17-accordion-section">
              {renderAccordionHeader(
                "shipTo",
                "Ship To",
                "Destination company, address, contact",
                shippingForm.shipToCompany ? "Started" : "Pending"
              )}

              {expandedSection === "shipTo" && (
                <div className="phase17-accordion-body">
                  <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                    <input value={shippingForm.shipToCompany} onChange={(e) => updateShippingForm("shipToCompany", e.target.value)} placeholder="Company Name" />
                    <input value={shippingForm.shipToAddress} onChange={(e) => updateShippingForm("shipToAddress", e.target.value)} placeholder="Address" />
                    <input value={shippingForm.shipToStreet} onChange={(e) => updateShippingForm("shipToStreet", e.target.value)} placeholder="City" />
                    <input value={shippingForm.shipToState} onChange={(e) => updateShippingForm("shipToState", e.target.value)} placeholder="State" />
                    <input value={shippingForm.shipToZip} onChange={(e) => updateShippingForm("shipToZip", e.target.value)} placeholder="Zip / Postal Code" />
                    <input value={shippingForm.shipToCountry} onChange={(e) => updateShippingForm("shipToCountry", e.target.value)} placeholder="Destination Country" />
                    <input value={shippingForm.shipToContactName} onChange={(e) => updateShippingForm("shipToContactName", e.target.value)} placeholder="Contact Name" />
                    <input value={shippingForm.shipToTelephone} onChange={(e) => updateShippingForm("shipToTelephone", e.target.value)} placeholder="Telephone" />
                    <input value={shippingForm.shipToEmail} onChange={(e) => updateShippingForm("shipToEmail", e.target.value)} placeholder="Email" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {renderAdditionalDetailsAccordion()}
      </>
    );
  };

  const renderLogisticsAccordion = () => {
    return (
      <>
        <div className="phase17-accordion-section">
          {renderAccordionHeader(
            "logistics",
            "Logistics Support Information",
            "Support type, location, equipment, timing",
            logisticsForm.supportType ? "Started" : "Pending"
          )}

          {expandedSection === "logistics" && (
            <div className="phase17-accordion-body">
              <p className="panel-note">
                Use Logistics Support for labor, forklift, dock, vendor, carrier
                appointment, or special handling coordination.
              </p>

              <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
                <select
                  value={logisticsForm.supportType}
                  onChange={(e) => updateLogisticsForm("supportType", e.target.value)}
                >
                  <option value="">Select Support Type</option>
                  <option value="Forklift Support">Forklift Support</option>
                  <option value="Labor Support">Labor Support</option>
                  <option value="Dock Coordination">Dock Coordination</option>
                  <option value="Vendor Coordination">Vendor Coordination</option>
                  <option value="Carrier Appointment">Carrier Appointment</option>
                  <option value="Special Handling">Special Handling</option>
                  <option value="A&M Coordination">A&M Coordination</option>
                </select>

                <input value={logisticsForm.currentLocation} onChange={(e) => updateLogisticsForm("currentLocation", e.target.value)} placeholder="Current Support Location" />
                <input value={logisticsForm.supportDestination} onChange={(e) => updateLogisticsForm("supportDestination", e.target.value)} placeholder="Support Destination / Area" />
                <input value={logisticsForm.equipmentNeeded} onChange={(e) => updateLogisticsForm("equipmentNeeded", e.target.value)} placeholder="Equipment / Labor Needed" />
                <input type="date" value={logisticsForm.dueDate} onChange={(e) => updateLogisticsForm("dueDate", e.target.value)} />
                <textarea rows="3" value={logisticsForm.notes} onChange={(e) => updateLogisticsForm("notes", e.target.value)} placeholder="Logistics Support Notes" />
              </div>
            </div>
          )}
        </div>

        {renderAdditionalDetailsAccordion()}
      </>
    );
  };

  const renderAdditionalDetailsAccordion = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "additional",
          "Additional Details",
          "Special instructions, references, timing",
          additionalDetails ? "Started" : "Optional"
        )}

        {expandedSection === "additional" && (
          <div className="phase17-accordion-body">
            <div className="inventory-form-grid job-compact-form-grid phase17-form-grid">
              <textarea
                rows="3"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Enter any special instructions, handling requirements, timing concerns, contact notes, or other details needed to complete this request."
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (requestMode === "dashboard") {
    return renderJobRequestDashboard();
  }

  if (requestMode === "track") {
    return (
      <div className="inventory-subview job-request-workspace">
        <div className="inventory-header-row job-transaction-header">
          <div>
            <h1>Track Request</h1>

            <p>
              Enter the Job Order reference number to view the latest request
              status.
            </p>
          </div>
        </div>

        <div className="inventory-panel job-transaction-panel">
          <h2>Request Tracking</h2>

          <div className="inventory-form-grid job-compact-form-grid">
            <input
              placeholder="Enter JO Number, example JO-000100"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <button className="inventory-primary-button">Track Request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-subview job-request-workspace phase17-workbench-screen">
      <div className="inventory-header-row job-transaction-header">
        <div>
          <h1>{getRequestTitle()} Request</h1>
        </div>
      </div>

      {submittedJobOrder && (
        <div className="dashboard-message">
          Job Order {submittedJobOrder} has been successfully submitted as a{" "}
          {getRequestTitle()} request. Please retain this reference number for
          tracking purposes. This request is now locked and cannot be edited from
          this screen. Status: Pending Internal Review.
        </div>
      )}

      <div className="phase17-smart-card-shell">
        <div className="phase17-smart-card">
          <div className="phase17-smart-card-header">
            <div>
              <span>Smart Request Card</span>
              <strong>{getRequestTitle()} Request</strong>
              <p>Create and review operational work before it routes to Order Central.</p>
            </div>

            <div className="phase17-progress">
              <span className="active">1 Details</span>
              <span>2 Review</span>
              <span>3 Submit</span>
            </div>
          </div>

          <div className="phase17-smart-card-body">
            <div className="phase17-smart-sections">
              {renderRequestorAccordion()}

              {requestMode === "movement" && renderMovementAccordion()}
              {requestMode === "shipping" && renderShippingAccordion()}
              {requestMode === "logistics" && renderLogisticsAccordion()}
            </div>

            <aside className="phase17-smart-summary">
              {renderSummaryPanel()}
            </aside>
          </div>

          <div className="phase17-smart-footer">
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={() => {
                if (isSubmittedLocked) {
                  alert("Request already submitted. This request is locked and cannot be edited from this screen.");
                } else {
                  window.location.reload();
                }
              }}
            >
              Clear Form
            </button>

            <button
              type="button"
              className="inventory-primary-button phase17-review-button"
              onClick={handleSubmitRequest}
              disabled={isSubmittedLocked || isSubmitting}
            >
              {isSubmittedLocked ? "Submitted / Locked" : isSubmitting ? "Submitting..." : "Review & Submit →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobRequestWorkspace;
