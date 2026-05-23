import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
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
  const [putawayLabelDataList, setPutawayLabelDataList] = useState([]);

  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

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

  useEffect(() => {
    loadReceipts();
  }, []);

  const mapDbReceiptToUi = (row) => {
    return {
      id: row.id,
      receiptNumber: row.receipt_number || "",
      purchaseOrder: row.purchase_order || "",
      vendor: row.vendor || "",
      partNumber: row.part_number || "",
      description: row.description || "",
      quantity: row.quantity || 0,
      countryOfOrigin: row.country_of_origin || "",
      isAM: row.is_am || false,
      squareFeet: row.square_feet || "",
      tagNumber: row.tag_number || "",
      receivingLocation: row.receiving_location || "",
      status: row.status || "In Receiving",
      finalStorageLocation: row.inventory_location || "",
      putawayQty: row.putaway_qty || "",
      createdAt: row.created_at || "",
    };
  };

  const loadReceipts = async () => {
    setLoadingReceipts(true);

    const { data, error } = await supabase
      .from("receiving_receipts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Receiving load error:", error.message);
      setMessage(`Receiving load error: ${error.message}`);
      setLoadingReceipts(false);
      return;
    }

    setReceipts((data || []).map(mapDbReceiptToUi));
    setLoadingReceipts(false);
  };


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
    const existingNumbers = receipts
      .map((receipt) => receipt.receiptNumber)
      .filter((number) => number && number.startsWith("RCV-"))
      .map((number) => Number(number.replace("RCV-", "")))
      .filter((number) => !Number.isNaN(number));

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 101;

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

  const confirmReceipt = async () => {
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
      receipt_number: getNextReceiptNumber(),
      purchase_order: receiptForm.purchaseOrder.trim(),
      vendor: receiptForm.vendor.trim(),
      part_number: receiptForm.partNumber.trim(),
      description: receiptForm.description.trim(),
      quantity: Number(receiptForm.quantity),
      country_of_origin: receiptForm.countryOfOrigin.trim(),
      is_am: receiptForm.isAM,
      square_feet: receiptForm.squareFeet.trim(),
      tag_number: receiptForm.tagNumber.trim(),
      receiving_location: getNextReceivingLocation(),
      inventory_location: "",
      status: "In Receiving",
      putaway_qty: 0,
    };

    const { data, error } = await supabase
      .from("receiving_receipts")
      .insert([newReceipt])
      .select()
      .single();

    if (error) {
      console.error("Receipt save error:", error.message);
      alert(`Receipt save failed: ${error.message}`);
      return;
    }

    const savedReceipt = mapDbReceiptToUi(data);

    setReceipts((prev) => [savedReceipt, ...prev]);
    setMessage(
      `${savedReceipt.receiptNumber} confirmed and assigned to ${savedReceipt.receivingLocation}. Label is ready for printing.`
    );

    setLabelData({
      inventoryId: savedReceipt.receiptNumber,
      customer: savedReceipt.vendor,
      partNumber: savedReceipt.partNumber,
      quantity: savedReceipt.quantity,
      description: savedReceipt.description,
      poNumber: savedReceipt.purchaseOrder,
      countryOfOrigin: savedReceipt.countryOfOrigin,
      site: savedReceipt.isAM ? "AM" : "INTRAL",
      amTag: savedReceipt.tagNumber,
      squareFeet: savedReceipt.squareFeet,
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

  const generateInventoryId = (receiptNumber, index = 0) => {
    const numericValue = String(receiptNumber || "")
      .replace("RCV-", "")
      .replace(/[^0-9]/g, "");

    const timeSuffix = String(Date.now()).slice(-6);
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const splitSuffix = String(index + 1).padStart(2, "0");

    return `INV-${numericValue || timeSuffix}-${timeSuffix}-${splitSuffix}-${randomSuffix}`;
  };

  const transferToStorage = async () => {
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
    const transferQty = Number(putawayQty);

    const selectedReceipts = receipts.filter((receipt) =>
      selectedReceiptNumbers.includes(receipt.receiptNumber)
    );

    const invalidReceipt = selectedReceipts.find(
      (receipt) => transferQty > Number(receipt.quantity)
    );

    if (invalidReceipt) {
      alert(
        `Putaway quantity cannot exceed received quantity for ${invalidReceipt.receiptNumber}.`
      );
      return;
    }

    const inventoryRows = selectedReceipts.map((receipt, index) => ({
      inventory_id: generateInventoryId(receipt.receiptNumber, index),
      receipt_number: receipt.receiptNumber,
      purchase_order: receipt.purchaseOrder,
      customer: receipt.vendor,
      vendor: receipt.vendor,
      part_number: receipt.partNumber,
      description: receipt.description,
      quantity: transferQty,
      country_of_origin: receipt.countryOfOrigin,
      warehouse_location: inventoryLocation,
      aisle_location:
        inventoryLocation === "1K" || inventoryLocation === "6K"
          ? aisleLocation.trim()
          : "",
      bin_location:
        inventoryLocation === "1K" || inventoryLocation === "6K"
          ? binLocation.trim()
          : "",
      final_location: finalStorageLocation,
      status: "Available",
      is_am: receipt.isAM,
      square_feet: receipt.squareFeet,
      tag_number: receipt.tagNumber,
    }));

    const { error: inventoryError } = await supabase
      .from("inventory_items")
      .insert(inventoryRows);

    if (inventoryError) {
      console.error("Inventory create error:", inventoryError.message);
      alert(
        `Inventory creation failed: ${inventoryError.message}. Receipt was NOT marked Putaway Complete.`
      );
      return;
    }

    const receiptUpdateResults = await Promise.all(
      selectedReceipts.map((receipt) => {
        const remainingQty = Number(receipt.quantity) - transferQty;
        const isFullPutaway = remainingQty === 0;

        return supabase
          .from("receiving_receipts")
          .update({
            quantity: remainingQty,
            status: isFullPutaway ? "Putaway Complete" : "In Receiving",
            inventory_location: isFullPutaway ? finalStorageLocation : "",
            putaway_qty: isFullPutaway ? transferQty : 0,
          })
          .eq("receipt_number", receipt.receiptNumber);
      })
    );

    const receiptUpdateError = receiptUpdateResults.find((result) => result.error);

    if (receiptUpdateError) {
      console.error("Receipt update error:", receiptUpdateError.error.message);
      alert(
        `Inventory was created, but receipt update failed: ${receiptUpdateError.error.message}`
      );
      return;
    }

    const generatedLabels = [];

    const updatedReceipts = receipts.map((receipt) => {
      if (!selectedReceiptNumbers.includes(receipt.receiptNumber)) {
        return receipt;
      }

      const remainingQty = Number(receipt.quantity) - transferQty;
      const inventoryRow = inventoryRows.find(
        (row) => row.receipt_number === receipt.receiptNumber
      );

      generatedLabels.push({
        title: "New Inventory Label",
        data: {
          inventoryId: inventoryRow.inventory_id,
          customer: receipt.vendor,
          partNumber: receipt.partNumber,
          quantity: transferQty,
          description: receipt.description,
          poNumber: receipt.purchaseOrder,
          countryOfOrigin: receipt.countryOfOrigin,
          site: receipt.isAM ? "AM" : "INTRAL",
          amTag: receipt.tagNumber,
          squareFeet: receipt.squareFeet,
          date: new Date().toISOString().slice(0, 10),
        },
      });

      if (remainingQty > 0) {
        generatedLabels.push({
          title: "Remaining Receiving Label",
          data: {
            inventoryId: receipt.receiptNumber,
            customer: receipt.vendor,
            partNumber: receipt.partNumber,
            quantity: remainingQty,
            description: receipt.description,
            poNumber: receipt.purchaseOrder,
            countryOfOrigin: receipt.countryOfOrigin,
            site: receipt.isAM ? "AM" : "INTRAL",
            amTag: receipt.tagNumber,
            squareFeet: receipt.squareFeet,
            date: new Date().toISOString().slice(0, 10),
          },
        });

        return {
          ...receipt,
          quantity: remainingQty,
          status: "In Receiving",
          finalStorageLocation: "",
          putawayQty: "",
        };
      }

      return {
        ...receipt,
        quantity: 0,
        status: "Putaway Complete",
        finalStorageLocation,
        putawayQty: transferQty,
      };
    });

    setReceipts(updatedReceipts);
    setPutawayLabelDataList(generatedLabels);
    setMessage(
      `${selectedReceiptNumbers.length} receipt(s) transferred to ${finalStorageLocation}. Partial balances remain in Receiving when applicable.`
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

    setLabelData({
      inventoryId: receipt.receiptNumber,
      customer: receipt.vendor,
      partNumber: receipt.partNumber,
      quantity: receipt.quantity,
      description: receipt.description,
      poNumber: receipt.purchaseOrder,
      countryOfOrigin: receipt.countryOfOrigin,
      site: receipt.isAM ? "AM" : "INTRAL",
      amTag: receipt.tagNumber,
      squareFeet: receipt.squareFeet,
      date: new Date().toISOString().slice(0, 10),
    });

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

          {loadingReceipts ? <p className="panel-note">Loading receiving records...</p> : <table className="inventory-table">
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
          </table>}
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

        {putawayLabelDataList.length > 0 && (
          <div className="inventory-panel">
            <h2>Putaway Labels Ready</h2>

            <p className="panel-note">
              Print labels for the new inventory item and any remaining receiving balance.
            </p>

            {putawayLabelDataList.map((labelItem, index) => (
              <div key={`${labelItem.title}-${index}`} className="order-detail-section">
                <h3>{labelItem.title}</h3>
                <LabelGenerator initialData={labelItem.data} />
              </div>
            ))}
          </div>
        )}
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

          {labelData && (
            <div className="inventory-panel">
              <h2>Reprint Label Ready</h2>
              <LabelGenerator initialData={labelData} />
            </div>
          )}
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
