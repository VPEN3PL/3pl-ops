import React, { useEffect, useState } from "react";

function JobRequestWorkspace({ requestMode = "movement" }) {
  const [shippingType, setShippingType] = useState("");
  const [submittedJobOrder, setSubmittedJobOrder] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    setShippingType("");
    setSubmittedJobOrder("");
  }, [requestMode]);

  const handleSubmitRequest = () => {
    setSubmittedJobOrder("JO-000100");
  };

  const renderAdditionalDetails = () => {
    return (
      <div className="inventory-panel">
        <h2>Additional Details</h2>

        <div className="inventory-form-grid">
          <textarea
            rows="6"
            placeholder="Enter any special instructions, handling requirements, timing concerns, contact notes, or other details needed to complete this request."
          ></textarea>
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

          <button className="inventory-primary-button">
            Track Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-subview">
      <div className="inventory-header-row">
        <div>
          <h1>Request</h1>

          <p>
            Submit operational requests into Order Central for review and
            release.
          </p>
        </div>
      </div>

      {submittedJobOrder && (
        <div className="dashboard-message">
          Job Order {submittedJobOrder} has been successfully submitted. Please
          retain this reference number for tracking purposes.
        </div>
      )}

      <div className="inventory-panel">
        <h2>Requestor Information</h2>

        <div className="inventory-form-grid">
          <select>
            <option>Charge Number or PO Type</option>
            <option>Charge Number</option>
            <option>PO Number</option>
            <option>No Charge / PO Available</option>
          </select>

          <input placeholder="Charge Number or PO" />
          <input placeholder="Requestor Name" />
          <input placeholder="Telephone" />
          <input placeholder="Email" />
        </div>
      </div>

      {requestMode === "movement" && (
        <>
          <div className="inventory-panel">
            <h2>Movement Information</h2>

            <div className="inventory-form-grid">
              <input placeholder="Moving From" />
              <input placeholder="Deliver To" />
              <textarea rows="4" placeholder="Movement Notes"></textarea>
            </div>
          </div>

          {renderAdditionalDetails()}
        </>
      )}

      {requestMode === "shipping" && (
        <>
          <div className="inventory-panel">
            <h2>Shipping Information</h2>

            <div className="inventory-form-grid">
              <select
                value={shippingType}
                onChange={(e) => setShippingType(e.target.value)}
              >
                <option value="">Shipping Type</option>
                <option value="outbound">Outbound</option>
                <option value="am-crating">Outbound with A&amp;M Crating</option>
              </select>

              <input placeholder="Pieces" />
              <input placeholder="Weight" />
              <input placeholder="Dimensions" />
            </div>
          </div>

          <div className="inventory-panel">
            <h2>From</h2>

            <div className="inventory-form-grid">
              <input placeholder="Company Name" />
              <input placeholder="Address" />
              <input placeholder="City" />
              <input placeholder="State" />
              <input placeholder="Zip Code" />
              <input placeholder="Contact Name" />
              <input placeholder="Telephone" />
              <input placeholder="Email" />
            </div>
          </div>

          <div className="inventory-panel">
            <h2>{shippingType === "am-crating" ? "A&M Destination" : "To"}</h2>

            <div className="inventory-form-grid">
              <input placeholder="Company Name" />
              <input placeholder="Address" />
              <input placeholder="City" />
              <input placeholder="State" />
              <input placeholder="Zip Code" />
              <input placeholder="Contact Name" />
              <input placeholder="Telephone" />
              <input placeholder="Email" />
            </div>
          </div>

          {shippingType === "am-crating" && (
            <div className="inventory-panel">
              <h2>Final Destination</h2>

              <div className="inventory-form-grid">
                <input placeholder="Company Name" />
                <input placeholder="Address" />
                <input placeholder="City" />
                <input placeholder="State" />
                <input placeholder="Zip Code" />
                <input placeholder="Contact Name" />
                <input placeholder="Telephone" />
                <input placeholder="Email" />
              </div>
            </div>
          )}

          {renderAdditionalDetails()}
        </>
      )}

      {requestMode === "logistics" && (
        <>
          <div className="inventory-panel">
            <h2>Logistics Information</h2>

            <div className="inventory-form-grid">
              <input placeholder="Current Goods Location" />
              <input placeholder="Vendor / Site Destination" />
              <textarea
                rows="4"
                placeholder="Logistics Coordination Notes"
              ></textarea>
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
