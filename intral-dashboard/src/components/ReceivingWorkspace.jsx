import React, { useMemo, useState } from "react";
import LabelGenerator from "./LabelGenerator";

const receivingLocations = ["RCV-01", "RCV-02", "RCV-03", "RCV-04"];

const inventoryLocations = [
  "1K",
  "6K",
  "Basement",
  "A&M",
  "DCIC",
  "M-Building",
  "1L",
];

const floorOnlyLocations = ["Basement", "A&M", "DCIC", "M-Building", "1L"];

function ReceivingWorkspace({ receivingView = "dashboard" }) {
  const [message, setMessage] = useState("");
  const [labelData, setLabelData] = useState(null);

  const [receipts, setReceipts] = useState([
    {
      receiptNumber: "RCV-000101",
      purchaseOrder: "PO-45821",
      vendor: "Vendor A",
      partNumber: "PN-45882",
      description: "Sample received material",
      quantity: 20,
      countryOfOrigin: "USA",
      isAM: false,
      squareFeet: "",
      tagNumber: "",
      receivingLocation: "RCV-01",
      status: "In Receiving",
      finalStorageLocation: "",
      putawayQty: "",
    },
    {
      receiptNumber: "RCV-000102",
      purchaseOrder: "PO-77811",
      vendor: "A&M",
      partNumber: "PN-77811",
      description: "Crating material",
      quantity: 12,
      countryOfOrigin: "USA",
      isAM: true,
      squareFeet: "144",
      tagNumber: "TAG-77811",
      receivingLocation: "RCV-02",
      status: "In Receiving",
      finalStorageLocation: "",
      putawayQty: "",
    },
  ]);

  const [receiptForm, setReceiptForm] = useState({
    purchaseOrder: "",
    vendor: "",
    partNumber: "",
    description: "",
    quantity: "",
    countryOfOrigin: "",
    isAM: false,
    squareFeet: "",
    tagNumber: "",
  });

  const [selectedReceiptNumbers, setSelectedReceiptNumbers] = useState([]);
  const [putawayQty, setPutawayQty] = useState("");
  const [inventoryLocation, setInventoryLocation] = useState("");
  const [binLocation, setBinLocation] = useState("");
  const [aisleLocation, setAisleLocation] = useState("");
  const [reprintSearch, setReprintSearch] = useState("");
  const [labelQty, setLabelQty] = useState("1");

  const selectedLocationIsFloorOnly = floorOnlyLocations.includes(inventoryLocation);

  const buildFinalStorageLocation = () => {
    if (!inventoryLocation) return "";

    if (selectedLocationIsFloorOnly) {
      return `${inventoryLocation}-FLOOR`;
    }

    if (inventoryLocation === "1K" || inventoryLocation === "6K") {
      const aisle = aisleLocation.trim();
      const bin = binLocation.trim();

      if (!aisle || !bin) return "";

      return `${inventoryLocation}-${aisle}-${bin}`;
    }

    return inventoryLocation;
  };

  const inReceivingReceipts = useMemo(() => {
    return receipts.filter((receipt) => receipt.status === "In Receiving");
  }, [receipts]);

  const putawayCompletedReceipts = useMemo(() => {
    return receipts.filter((receipt) => receipt.status === "Putaway Complete");
  }, [receipts]);

  const updateReceiptForm = (field, value) => {
    setReceiptForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getNextReceiptNumber = () => {
    const nextNumber = receipts.length + 101;
    return `RCV-${String(nextNumber).padStart(6, "0")}`;
  };

  const getNextReceivingLocation = () => {
    const index = receipts.length % receivingLocations.length;
    return receivingLocations[index];
  };

  const resetReceiptForm = () => {
    setReceiptForm({
      purchaseOrder: "",
      vendor: "",
      partNumber: "",
      description: "",
      quantity: "",
      countryOfOrigin: "",
      isAM: false,
      squareFeet: "",
      tagNumber: "",
    });
  };

  const confirmReceipt = () => {
    if (!receiptForm.purchaseOrder.trim()) {
      alert("Purchase Order is required.");
      return;
    }

    if (!receiptForm.vendor.trim()) {
      alert("Vendor is required.");
      return;
    }

    if (!receiptForm.partNumber.trim()) {
      alert("Part Number is required.");
      return;
    }

    if (!receiptForm.description.trim()) {
      alert("Description is required.");
      return;
    }

    if (!receiptForm.quantity || Number(receiptForm.quantity) <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    if (!receiptForm.countryOfOrigin.trim()) {
      alert("Country of Origin is required.");
      return;
    }

    if (receiptForm.isAM && !receiptForm.squareFeet.trim()) {
      alert("SQ FT is required for A&M receipts.");
      return;
    }

    if (receiptForm.isAM && !receiptForm.tagNumber.trim()) {
      alert("TAG Number is required for A&M receipts.");
      return;
    }

    const newReceipt = {
      receiptNumber: getNextReceiptNumber(),
      purchaseOrder: receiptForm.purchaseOrder.trim(),
      vendor: receiptForm.vendor.trim(),
      partNumber: receiptForm.partNumber.trim(),
      description: receiptForm.description.trim(),
      quantity: Number(receiptForm.quantity),
      countryOfOrigin: receiptForm.countryOfOrigin.trim(),
      isAM: receiptForm.isAM,
      squareFeet: receiptForm.squareFeet.trim(),
      tagNumber: receiptForm.tagNumber.trim(),
      receivingLocation: getNextReceivingLocation(),
      status: "In Receiving",
      finalStorageLocation: "",
      putawayQty: "",
    };

    setReceipts((prev) => [...prev, newReceipt]);
    setMessage(
      `${newReceipt.receiptNumber} confirmed and assigned to ${newReceipt.receivingLocation}. Label is ready for printing.`
    );

    setLabelData({
      inventoryId: newReceipt.receiptNumber,
      customer: newReceipt.vendor,
      partNumber: newReceipt.partNumber,
      quantity: newReceipt.quantity,
      description: newReceipt.description,
      poNumber: newReceipt.purchaseOrder,
      countryOfOrigin: newReceipt.countryOfOrigin,
      site: newReceipt.isAM ? "AM" : "INTRAL",
      amTag: newReceipt.tagNumber,
      squareFeet: newReceipt.squareFeet,
      date: new Date().toISOString().slice(0, 10),
    });

    resetReceiptForm();
  };

  const toggleReceiptSelection = (receiptNumber) => {
    setSelectedReceiptNumbers((prev) =>
      prev.includes(receiptNumber)
        ? prev.filter((item) => item !== receiptNumber)
        : [...prev, receiptNumber]
    );
  };

  const transferToStorage = () => {
    if (selectedReceiptNumbers.length === 0) {
      alert("Select at least one receipt to transfer.");
      return;
    }

    if (!putawayQty || Number(putawayQty) <= 0) {
      alert("Enter a valid putaway quantity.");
      return;
    }

    if (!inventoryLocation) {
      alert("Select an inventory location.");
      return;
    }

    if ((inventoryLocation === "1K" || inventoryLocation === "6K") && !aisleLocation.trim()) {
      alert("Aisle is required for 1K and 6K locations.");
      return;
    }

    if ((inventoryLocation === "1K" || inventoryLocation === "6K") && !binLocation.trim()) {
      alert("Bin is required for 1K and 6K locations.");
      return;
    }

    const finalStorageLocation = buildFinalStorageLocation();

    const updatedReceipts = receipts.map((receipt) => {
      if (!selectedReceiptNumbers.includes(receipt.receiptNumber)) {
        return receipt;
      }

      if (Number(putawayQty) > Number(receipt.quantity)) {
        alert(`Putaway quantity cannot exceed received quantity for ${receipt.receiptNumber}.`);
        return receipt;
      }

      return {
        ...receipt,
        status: "Putaway Complete",
        finalStorageLocation,
        putawayQty: Number(putawayQty),
      };
    });

    setReceipts(updatedReceipts);
    setMessage(
      `${selectedReceiptNumbers.length} receipt(s) transferred to ${finalStorageLocation}.`
    );
    setSelectedReceiptNumbers([]);
    setPutawayQty("");
    setInventoryLocation("");
    setBinLocation("");
    setAisleLocation("");
  };

  const getReceiptForReprint = () => {
    const normalized = reprintSearch.trim().toUpperCase();

    if (!normalized) return null;

    return (
      receipts.find(
        (receipt) =>
          receipt.receiptNumber.toUpperCase() === normalized ||
          receipt.partNumber.toUpperCase() === normalized
      ) || null
    );
  };

  const reprintLabel = () => {
    const receipt = getReceiptForReprint();

    if (!receipt) {
      alert("Enter a valid Receipt Number or Part Number before reprinting.");
      return;
    }

    if (!labelQty || Number(labelQty) <= 0) {
      alert("Label quantity must be greater than zero.");
      return;
    }

    setMessage(
      `${labelQty} label(s) prepared for ${receipt.receiptNumber} / ${receipt.partNumber}.`
    );
  };

  const renderDashboard = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Receiving Workspace</h1>
            <p>
              Receive inbound material, assign temporary receiving locations,
              reprint labels, and transfer received material into storage.
            </p>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="inventory-kpi-grid">
          <div className="inventory-kpi-card">
            <span>In Receiving</span>
            <h2>{inReceivingReceipts.length}</h2>
            <p>Items awaiting putaway</p>
          </div>

          <div className="inventory-kpi-card">
            <span>Putaway Complete</span>
            <h2>{putawayCompletedReceipts.length}</h2>
            <p>Receipts transferred to storage</p>
          </div>

          <div className="inventory-kpi-card">
            <span>Receiving Locations</span>
            <h2>{receivingLocations.length}</h2>
            <p>Temporary RCV locations available</p>
          </div>

          <div className="inventory-kpi-card">
            <span>A&M Receipts</span>
            <h2>{receipts.filter((receipt) => receipt.isAM).length}</h2>
            <p>Receipts requiring SQ FT and TAG</p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Current Receiving Activity</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>PO</th>
                <th>Vendor</th>
                <th>Part #</th>
                <th>Qty</th>
                <th>COO</th>
                <th>RCV Location</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.receiptNumber}>
                  <td>{receipt.receiptNumber}</td>
                  <td>{receipt.purchaseOrder}</td>
                  <td>{receipt.vendor}</td>
                  <td>{receipt.partNumber}</td>
                  <td>{receipt.quantity}</td>
                  <td>{receipt.countryOfOrigin}</td>
                  <td>{receipt.receivingLocation}</td>
                  <td>{receipt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCreateReceipt = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Create Inbound Receipt</h1>
            <p>
              Confirm receipt details, assign material into a temporary
              receiving location, and prepare the item for label generation and
              putaway.
            </p>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="inventory-panel">
          <h2>Receiving Information</h2>

          <div className="inventory-form-grid">
            <input value={receiptForm.purchaseOrder} onChange={(e) => updateReceiptForm("purchaseOrder", e.target.value)} placeholder="Purchase Order" />
            <input value={receiptForm.vendor} onChange={(e) => updateReceiptForm("vendor", e.target.value)} placeholder="Vendor" />
            <input value={receiptForm.partNumber} onChange={(e) => updateReceiptForm("partNumber", e.target.value)} placeholder="Part Number" />
            <input value={receiptForm.description} onChange={(e) => updateReceiptForm("description", e.target.value)} placeholder="Description" />
            <input type="number" value={receiptForm.quantity} onChange={(e) => updateReceiptForm("quantity", e.target.value)} placeholder="Quantity" />
            <input value={receiptForm.countryOfOrigin} onChange={(e) => updateReceiptForm("countryOfOrigin", e.target.value)} placeholder="Country of Origin" />
          </div>

          <div className="receiving-checkbox-row">
            <label>
              <input type="checkbox" checked={receiptForm.isAM} onChange={(e) => updateReceiptForm("isAM", e.target.checked)} />
              A&M Function
            </label>
          </div>

          {receiptForm.isAM && (
            <div className="inventory-form-grid">
              <input value={receiptForm.squareFeet} onChange={(e) => updateReceiptForm("squareFeet", e.target.value)} placeholder="SQ FT" />
              <input value={receiptForm.tagNumber} onChange={(e) => updateReceiptForm("tagNumber", e.target.value)} placeholder="TAG Number" />
            </div>
          )}

          <button className="inventory-primary-button" onClick={confirmReceipt}>
            Confirm Receipt
          </button>
        </div>

        {labelData && (
          <div className="inventory-panel">
            <h2>Receiving Label Ready</h2>

            <p className="panel-note">
              Receipt has been confirmed. Review the label below and print when ready.
            </p>

            <LabelGenerator initialData={labelData} />
          </div>
        )}
      </div>
    );
  };

  const renderPutaway = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Putaway Workspace</h1>
            <p>
              Transfer material from temporary receiving locations into approved
              storage locations.
            </p>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="inventory-panel">
          <h2>Receiving Location Queue</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Receipt #</th>
                <th>PO</th>
                <th>Part #</th>
                <th>Description</th>
                <th>Qty</th>
                <th>RCV Location</th>
              </tr>
            </thead>

            <tbody>
              {inReceivingReceipts.length === 0 ? (
                <tr>
                  <td colSpan="7">No receipts currently awaiting putaway.</td>
                </tr>
              ) : (
                inReceivingReceipts.map((receipt) => (
                  <tr key={receipt.receiptNumber}>
                    <td>
                      <input type="checkbox" checked={selectedReceiptNumbers.includes(receipt.receiptNumber)} onChange={() => toggleReceiptSelection(receipt.receiptNumber)} />
                    </td>
                    <td>{receipt.receiptNumber}</td>
                    <td>{receipt.purchaseOrder}</td>
                    <td>{receipt.partNumber}</td>
                    <td>{receipt.description}</td>
                    <td>{receipt.quantity}</td>
                    <td>{receipt.receivingLocation}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="inventory-panel">
          <h2>Transfer to Storage</h2>

          <div className="inventory-form-grid">
            <input
              type="number"
              value={putawayQty}
              onChange={(e) => setPutawayQty(e.target.value)}
              placeholder="Qty to Transfer"
            />

            <select
              value={inventoryLocation}
              onChange={(e) => {
                setInventoryLocation(e.target.value);
                setBinLocation("");
                setAisleLocation("");
              }}
            >
              <option value="">Select Inventory Location</option>
              {inventoryLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            {(inventoryLocation === "1K" || inventoryLocation === "6K") && (
              <>
                <input
                  value={aisleLocation}
                  onChange={(e) => setAisleLocation(e.target.value)}
                  placeholder="Aisle / Row"
                />

                <input
                  value={binLocation}
                  onChange={(e) => setBinLocation(e.target.value)}
                  placeholder="Bin / Shelf"
                />
              </>
            )}

            {selectedLocationIsFloorOnly && (
              <input value="FLOOR" disabled placeholder="Final Location Type" />
            )}

            {buildFinalStorageLocation() && (
              <input
                value={buildFinalStorageLocation()}
                disabled
                placeholder="Final Storage Location Preview"
              />
            )}
          </div>

          <button className="inventory-primary-button" onClick={transferToStorage}>
            Transfer to Storage
          </button>
        </div>
      </div>
    );
  };

  const renderReprintLabels = () => {
    const receipt = getReceiptForReprint();

    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Reprint Labels</h1>
            <p>
              Reprint receiving labels by Receipt Number or Part Number. Label
              layout and Zebra/Bluetooth print handling will be stabilized in the
              next label phase.
            </p>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="inventory-panel">
          <h2>Label Reprint</h2>

          <div className="inventory-form-grid">
            <input value={reprintSearch} onChange={(e) => setReprintSearch(e.target.value)} placeholder="Receipt Number or Part Number" />
            <input type="number" value={labelQty} onChange={(e) => setLabelQty(e.target.value)} placeholder="Qty of Labels" />
          </div>

          {receipt && (
            <div className="order-detail-section">
              <h3>Label Preview Data</h3>
              <p>Receipt: {receipt.receiptNumber}</p>
              <p>Part Number: {receipt.partNumber}</p>
              <p>Description: {receipt.description}</p>
              <p>COO: {receipt.countryOfOrigin}</p>
              <p>Qty: {receipt.quantity}</p>
              {receipt.isAM && <p>A&M SQ FT: {receipt.squareFeet}</p>}
              {receipt.isAM && <p>A&M TAG: {receipt.tagNumber}</p>}
            </div>
          )}

          <button className="inventory-primary-button" onClick={reprintLabel}>
            Reprint Label
          </button>
        </div>
      </div>
    );
  };

  if (receivingView === "create") {
    return renderCreateReceipt();
  }

  if (receivingView === "putaway") {
    return renderPutaway();
  }

  if (receivingView === "reprint") {
    return renderReprintLabels();
  }

  return renderDashboard();
}

export default ReceivingWorkspace;
