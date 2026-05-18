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

function JobRequestWorkspace({ requestMode = "movement" }) {
  const [submittedJobOrder, setSubmittedJobOrder] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [requestorForm, setRequestorForm] = useState({
    chargeType: "",
    chargeNumber: "",
    requestorName: "",
    telephone: "",
    email: "",
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
    shipFromZip: "",

    amStoredAddress: "",

    shipToCompany: "",
    shipToAddress: "",
    shipToStreet: "",
    shipToZip: "",
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

  useEffect(() => {
    setSubmittedJobOrder("");
    setTrackingNumber("");
    setAdditionalDetails("");
    setShippingType("");

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

      amStoredAddress: "",

      shipToCompany: "",
      shipToAddress: "",
      shipToStreet: "",
      shipToZip: "",
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

    return "Request";
  };

  const validateRequestor = () => {
    if (!requestorForm.requestorName.trim()) {
      alert("Requestor name is required.");
      return false;
    }

    if (!requestorForm.email.trim()) {
      alert("Requestor email is required.");
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

    if (!shippingForm.weight.trim()) {
      alert("Weight is required.");
      return false;
    }

    if (!shippingForm.dimensions.trim()) {
      alert("Dimensions are required.");
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
      alert("Ship From street is required.");
      return false;
    }

    if (!shippingForm.shipFromZip.trim()) {
      alert("Ship From zip code is required.");
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
      alert("Ship To street is required.");
      return false;
    }

    if (!shippingForm.shipToZip.trim()) {
      alert("Ship To zip code is required.");
      return false;
    }

    if (!shippingForm.shipToContactName.trim()) {
      alert("Ship To contact name is required.");
      return false;
    }

    if (
      !shippingForm.shipToTelephone.trim() &&
      !shippingForm.shipToEmail.trim()
    ) {
      alert("Ship To telephone or email is required.");
      return false;
    }

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

  const handleSubmitRequest = () => {
    if (!validateRequestor()) return;

    if (requestMode === "movement" && !validateInventoryMovement()) return;
    if (requestMode === "shipping" && !validateShipping()) return;
    if (requestMode === "logistics" && !validateLogistics()) return;

    const nextJobNumber = `JO-${String(Date.now()).slice(-6)}`;

    setSubmittedJobOrder(nextJobNumber);
  };

  const renderAdditionalDetails = () => {
    return (
      <div className="inventory-panel">
        <h2>Additional Details</h2>

        <div className="inventory-form-grid">
          <textarea
            rows="6"
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Enter any special instructions, handling requirements, timing concerns, contact notes, or other details needed to complete this request."
          />
        </div>
      </div>
    );
  };

  const renderShippingSpecs = () => {
    return (
      <div className="inventory-panel">
        <h2>Shipment Details</h2>

        <div className="inventory-form-grid">
          <input
            type="number"
            value={shippingForm.pcs}
            onChange={(e) => updateShippingForm("pcs", e.target.value)}
            placeholder="PCS"
          />

          <input
            value={shippingForm.weight}
            onChange={(e) => updateShippingForm("weight", e.target.value)}
            placeholder="Weight"
          />

          <input
            value={shippingForm.dimensions}
            onChange={(e) => updateShippingForm("dimensions", e.target.value)}
            placeholder="Dimensions"
          />
        </div>
      </div>
    );
  };

  const renderShipFrom = () => {
    return (
      <div className="inventory-panel">
        <h2>Ship From</h2>

        <div className="inventory-form-grid">
          <input
            value={shippingForm.shipFromCompany}
            onChange={(e) =>
              updateShippingForm("shipFromCompany", e.target.value)
            }
            placeholder="Company Name"
          />

          <input
            value={shippingForm.shipFromAddress}
            onChange={(e) =>
              updateShippingForm("shipFromAddress", e.target.value)
            }
            placeholder="Address"
          />

          <input
            value={shippingForm.shipFromStreet}
            onChange={(e) =>
              updateShippingForm("shipFromStreet", e.target.value)
            }
            placeholder="Street"
          />

          <input
            value={shippingForm.shipFromZip}
            onChange={(e) => updateShippingForm("shipFromZip", e.target.value)}
            placeholder="Zip Code"
          />
        </div>
      </div>
    );
  };

  const renderShipTo = () => {
    return (
      <div className="inventory-panel">
        <h2>Ship To</h2>

        <div className="inventory-form-grid">
          <input
            value={shippingForm.shipToCompany}
            onChange={(e) =>
              updateShippingForm("shipToCompany", e.target.value)
            }
            placeholder="Company Name"
          />

          <input
            value={shippingForm.shipToAddress}
            onChange={(e) =>
              updateShippingForm("shipToAddress", e.target.value)
            }
            placeholder="Address"
          />

          <input
            value={shippingForm.shipToStreet}
            onChange={(e) =>
              updateShippingForm("shipToStreet", e.target.value)
            }
            placeholder="Street"
          />

          <input
            value={shippingForm.shipToZip}
            onChange={(e) => updateShippingForm("shipToZip", e.target.value)}
            placeholder="Zip Code"
          />

          <input
            value={shippingForm.shipToContactName}
            onChange={(e) =>
              updateShippingForm("shipToContactName", e.target.value)
            }
            placeholder="Contact Name"
          />

          <input
            value={shippingForm.shipToTelephone}
            onChange={(e) =>
              updateShippingForm("shipToTelephone", e.target.value)
            }
            placeholder="Telephone"
          />

          <input
            value={shippingForm.shipToEmail}
            onChange={(e) =>
              updateShippingForm("shipToEmail", e.target.value)
            }
            placeholder="Email"
          />
        </div>
      </div>
    );
  };

  if (requestMode === "track") {
    return (
      <div className="inventory-subview">
        <div className="inventory-header-row">
          <div>
            <h1>Track Request</h1>

            <p>
              Enter the Job Order reference number to view the latest request
              status.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Request Tracking</h2>

          <div className="inventory-form-grid">
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
    <div className="inventory-subview">
      <div className="inventory-header-row">
        <div>
          <h1>{getRequestTitle()} Request</h1>

          <p>
            Submit operational requests into Order Central for review,
            allocation confirmation, and release.
          </p>
        </div>
      </div>

      {submittedJobOrder && (
        <div className="dashboard-message">
          Job Order {submittedJobOrder} has been successfully submitted as a{" "}
          {getRequestTitle()} request. Please retain this reference number for
          tracking purposes.
        </div>
      )}

      <div className="inventory-panel">
        <h2>Requestor Information</h2>

        <div className="inventory-form-grid">
          <select
            value={requestorForm.chargeType}
            onChange={(e) => updateRequestorForm("chargeType", e.target.value)}
          >
            <option value="">Charge Number or PO Type</option>
            <option value="Charge Number">Charge Number</option>
            <option value="PO Number">PO Number</option>
            <option value="No Charge / PO Available">
              No Charge / PO Available
            </option>
          </select>

          <input
            value={requestorForm.chargeNumber}
            onChange={(e) =>
              updateRequestorForm("chargeNumber", e.target.value)
            }
            placeholder="Charge Number or PO"
          />

          <input
            value={requestorForm.requestorName}
            onChange={(e) =>
              updateRequestorForm("requestorName", e.target.value)
            }
            placeholder="Requestor Name"
          />

          <input
            value={requestorForm.telephone}
            onChange={(e) => updateRequestorForm("telephone", e.target.value)}
            placeholder="Telephone"
          />

          <input
            value={requestorForm.email}
            onChange={(e) => updateRequestorForm("email", e.target.value)}
            placeholder="Email"
          />
        </div>
      </div>

      {requestMode === "movement" && (
        <>
          <div className="inventory-panel">
            <h2>Inventory Movement Information</h2>

            <p className="panel-note">
              Inventory Movement requires a valid available Inventory ID before
              the request can proceed.
            </p>

            <div className="inventory-form-grid">
              <select
                value={movementForm.inventoryId}
                onChange={(e) =>
                  updateMovementForm("inventoryId", e.target.value)
                }
              >
                <option value="">Select Inventory ID</option>

                {availableInventory.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={
                      item.status !== "Available" || item.availableQty <= 0
                    }
                  >
                    {item.id} | {item.customer} | {item.partNumber} |
                    Available: {item.availableQty} | {item.location}
                  </option>
                ))}
              </select>

              <input
                value={selectedInventory?.partNumber || ""}
                placeholder="Part Number"
                disabled
              />

              <input
                value={selectedInventory?.customer || ""}
                placeholder="Customer"
                disabled
              />

              <input
                value={selectedInventory?.availableQty ?? ""}
                placeholder="Available Qty"
                disabled
              />

              <input
                value={selectedInventory?.location || ""}
                placeholder="Current Location / From Location"
                disabled
              />

              <input
                type="number"
                value={movementForm.moveQty}
                onChange={(e) => updateMovementForm("moveQty", e.target.value)}
                placeholder="Move Qty"
              />

              <input
                value={movementForm.toLocation}
                onChange={(e) =>
                  updateMovementForm("toLocation", e.target.value)
                }
                placeholder="To Location"
              />

              <textarea
                rows="4"
                value={movementForm.reason}
                onChange={(e) => updateMovementForm("reason", e.target.value)}
                placeholder="Reason for movement"
              />
            </div>
          </div>

          {selectedInventory && (
            <div className="inventory-panel">
              <h2>Selected Inventory Validation</h2>

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

          {renderAdditionalDetails()}
        </>
      )}

      {requestMode === "shipping" && (
        <>
          <div className="inventory-panel">
            <h2>Shipping Request Type</h2>

            <div className="inventory-form-grid">
              <select
                value={shippingType}
                onChange={(e) => setShippingType(e.target.value)}
              >
                <option value="">Select Shipping Workflow</option>
                <option value="outbound">Outbound Shipping</option>
                <option value="am-crating">
                  Shipping with A&M Crating Support
                </option>
              </select>
            </div>
          </div>

          {shippingType === "outbound" && (
            <>
              <div className="inventory-panel">
                <h2>Outbound Shipping Information</h2>

                <p className="panel-note">
                  Direct outbound shipment from origin location to final
                  destination.
                </p>
              </div>

              {renderShippingSpecs()}
              {renderShipFrom()}
              {renderShipTo()}
            </>
          )}

          {shippingType === "am-crating" && (
            <>
              <div className="inventory-panel">
                <h2>Shipping with A&M Crating Support</h2>

                <p className="panel-note">
                  Material leaves vendor facility, transfers to A&M for crating,
                  then ships from A&M to the final destination.
                </p>

                <div className="inventory-form-grid">
                  <select
                    value={shippingForm.amStoredAddress}
                    onChange={(e) =>
                      updateShippingForm("amStoredAddress", e.target.value)
                    }
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

              {renderShippingSpecs()}
              {renderShipFrom()}

              <div className="inventory-panel">
                <h2>A&M Destination</h2>

                <div className="inventory-form-grid">
                  <input
                    value={shippingForm.amStoredAddress}
                    placeholder="A&M Stored Address"
                    disabled
                  />
                </div>
              </div>

              {renderShipTo()}
            </>
          )}

          {renderAdditionalDetails()}
        </>
      )}

      {requestMode === "logistics" && (
        <>
          <div className="inventory-panel">
            <h2>Logistics Support Information</h2>

            <p className="panel-note">
              Use Logistics Support for labor, forklift, dock, vendor, carrier
              appointment, or special handling coordination. Use Inventory
              Movement when an inventory ID must be moved.
            </p>

            <div className="inventory-form-grid">
              <select
                value={logisticsForm.supportType}
                onChange={(e) =>
                  updateLogisticsForm("supportType", e.target.value)
                }
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

              <input
                value={logisticsForm.currentLocation}
                onChange={(e) =>
                  updateLogisticsForm("currentLocation", e.target.value)
                }
                placeholder="Current Support Location"
              />

              <input
                value={logisticsForm.supportDestination}
                onChange={(e) =>
                  updateLogisticsForm("supportDestination", e.target.value)
                }
                placeholder="Support Destination / Area"
              />

              <input
                value={logisticsForm.equipmentNeeded}
                onChange={(e) =>
                  updateLogisticsForm("equipmentNeeded", e.target.value)
                }
                placeholder="Equipment / Labor Needed"
              />

              <input
                type="date"
                value={logisticsForm.dueDate}
                onChange={(e) => updateLogisticsForm("dueDate", e.target.value)}
              />

              <textarea
                rows="4"
                value={logisticsForm.notes}
                onChange={(e) => updateLogisticsForm("notes", e.target.value)}
                placeholder="Logistics Support Notes"
              />
            </div>
          </div>

          {renderAdditionalDetails()}
        </>
      )}

      <div className="inventory-panel">
        <button
          className="inventory-primary-button"
          onClick={handleSubmitRequest}
        >
          Submit Job Request
        </button>
      </div>
    </div>
  );
}

export default JobRequestWorkspace;
