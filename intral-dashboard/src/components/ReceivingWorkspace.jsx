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

function ReceivingWorkspace({ receivingView = "dashboard", deepLinkTarget }) {
  const [message, setMessage] = useState("");
  const [labelData, setLabelData] = useState(null);
  const [putawayLabelDataList, setPutawayLabelDataList] = useState([]);

  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const [receiptForm, setReceiptForm] = useState({
    purchaseOrder: "",
    vendor: "",
    carrier: "",
    trackingNumber: "",
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
  const [expandedSection, setExpandedSection] = useState("activity");
  const [detailReceiptNumber, setDetailReceiptNumber] = useState("");

  useEffect(() => {
    loadReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (receivingView === "create") setExpandedSection("receive");
    if (receivingView === "putaway") setExpandedSection("queue");
    if (receivingView === "reprint") setExpandedSection("reprint");
    if (receivingView === "dashboard") setExpandedSection("activity");
  }, [receivingView]);

  const mapDbReceiptToUi = (row) => {
    return {
      id: row.id,
      receiptNumber: row.receipt_number || "",
      purchaseOrder: row.purchase_order || "",
      vendor: row.vendor || "",
      carrier: row.carrier || "",
      trackingNumber: row.tracking_number || "",
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

  const selectedReceipts = useMemo(() => {
    return receipts.filter((receipt) =>
      selectedReceiptNumbers.includes(receipt.receiptNumber)
    );
  }, [receipts, selectedReceiptNumbers]);

  const selectedReceiptDetail = useMemo(() => {
    return (
      receipts.find((receipt) => receipt.receiptNumber === detailReceiptNumber) ||
      null
    );
  }, [receipts, detailReceiptNumber]);

  useEffect(() => {
    if (!deepLinkTarget) return;

    const targetType = String(deepLinkTarget.targetType || "").toLowerCase();
    const targetId = String(
      deepLinkTarget.targetId ||
        deepLinkTarget.receiptNumber ||
        deepLinkTarget.receipt_number ||
        ""
    ).trim();

    if (!targetId) return;
    if (!["receiving", "receipt", "rcv", "workspace"].includes(targetType)) return;

    const matchedReceipt = receipts.find(
      (receipt) => receipt.receiptNumber === targetId
    );

    if (!matchedReceipt) return;

    setDetailReceiptNumber(matchedReceipt.receiptNumber);
    setExpandedSection("activity");
    setMessage(`${matchedReceipt.receiptNumber} opened from notification.`);
  }, [deepLinkTarget, receipts]);

  const latestReceipt = useMemo(() => {
    return receipts[0] || null;
  }, [receipts]);

  const reprintReceipt = useMemo(() => {
    const normalized = reprintSearch.trim().toUpperCase();

    if (!normalized) return null;

    return (
      receipts.find(
        (receipt) =>
          receipt.receiptNumber.toUpperCase() === normalized ||
          receipt.partNumber.toUpperCase() === normalized
      ) || null
    );
  }, [receipts, reprintSearch]);

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
      carrier: "",
      trackingNumber: "",
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

    const carrier = receiptForm.carrier.trim();
    const trackingNumber = receiptForm.trackingNumber.trim();

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

    if (carrier) {
      newReceipt.carrier = carrier;
    }

    if (trackingNumber) {
      newReceipt.tracking_number = trackingNumber;
    }

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
    setExpandedSection("label");
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

    const selectedReceiptsForTransfer = receipts.filter((receipt) =>
      selectedReceiptNumbers.includes(receipt.receiptNumber)
    );

    const invalidReceipt = selectedReceiptsForTransfer.find(
      (receipt) => transferQty > Number(receipt.quantity)
    );

    if (invalidReceipt) {
      alert(
        `Putaway quantity cannot exceed received quantity for ${invalidReceipt.receiptNumber}.`
      );
      return;
    }

    const inventoryRows = selectedReceiptsForTransfer.map((receipt, index) => ({
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
      selectedReceiptsForTransfer.map((receipt) => {
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
    setExpandedSection("putawayLabels");
    setMessage(
      `${selectedReceiptNumbers.length} receipt(s) transferred to ${finalStorageLocation}. Partial balances remain in Receiving when applicable.`
    );
    setSelectedReceiptNumbers([]);
    setPutawayQty("");
    setInventoryLocation("");
    setBinLocation("");
    setAisleLocation("");
  };

  const getReceiptLabelQuantity = (receipt) => {
    const currentQty = Number(receipt?.quantity || 0);
    const putawayQtyValue = Number(receipt?.putawayQty || 0);

    if (currentQty > 0) return currentQty;
    if (putawayQtyValue > 0) return putawayQtyValue;

    return 1;
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
      quantity: getReceiptLabelQuantity(receipt),
      description: receipt.description,
      poNumber: receipt.purchaseOrder,
      countryOfOrigin: receipt.countryOfOrigin,
      site: receipt.isAM ? "AM" : "INTRAL",
      amTag: receipt.tagNumber,
      squareFeet: receipt.squareFeet,
      date: new Date().toISOString().slice(0, 10),
    });

    setExpandedSection("reprintLabel");
    setMessage(
      `${labelQty} label(s) prepared for ${receipt.receiptNumber} / ${receipt.partNumber}.`
    );
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection((current) => (current === sectionKey ? "" : sectionKey));
  };

  const getSectionStatus = (sectionKey) => {
    if (sectionKey === "activity") return `${receipts.length} Records`;
    if (sectionKey === "receive") return receiptForm.partNumber ? "Started" : "Ready";
    if (sectionKey === "label") return labelData ? "Ready" : "Waiting";
    if (sectionKey === "queue") return `${inReceivingReceipts.length} Waiting`;
    if (sectionKey === "transfer") return selectedReceiptNumbers.length > 0 ? "Selected" : "Pending";
    if (sectionKey === "putawayLabels") return putawayLabelDataList.length > 0 ? "Ready" : "Waiting";
    if (sectionKey === "reprint") return reprintReceipt ? "Found" : "Search";
    if (sectionKey === "reprintLabel") return labelData ? "Ready" : "Waiting";
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


  const openReceiptDetail = (receipt) => {
    if (!receipt?.receiptNumber) return;

    setDetailReceiptNumber(receipt.receiptNumber);
    setMessage(`${receipt.receiptNumber} opened in Receiving Detail.`);
  };

  const closeReceiptDetail = () => {
    setDetailReceiptNumber("");
    setMessage("");
  };

  const prepareReceiptForPutaway = (receipt) => {
    if (!receipt?.receiptNumber) return;

    setSelectedReceiptNumbers([receipt.receiptNumber]);
    setExpandedSection("transfer");
    setMessage(`${receipt.receiptNumber} selected for putaway.`);
  };

  const prepareDetailReprintLabel = (receipt) => {
    if (!receipt) {
      alert("Open a receipt before preparing a reprint label.");
      return;
    }

    setLabelData({
      inventoryId: receipt.receiptNumber,
      customer: receipt.vendor,
      partNumber: receipt.partNumber,
      quantity: getReceiptLabelQuantity(receipt),
      description: receipt.description,
      poNumber: receipt.purchaseOrder,
      countryOfOrigin: receipt.countryOfOrigin,
      site: receipt.isAM ? "AM" : "INTRAL",
      amTag: receipt.tagNumber,
      squareFeet: receipt.squareFeet,
      date: new Date().toISOString().slice(0, 10),
    });

    setExpandedSection("reprintLabel");
    setMessage(`Label prepared for ${receipt.receiptNumber}.`);
  };

  const renderOpenReceiptDetailButton = (receipt) => {
    return (
      <button
        type="button"
        className="inventory-primary-button"
        title="Open Receiving Detail"
        aria-label={`Open Receiving Detail for ${receipt?.receiptNumber || "receipt"}`}
        onClick={(event) => {
          event.stopPropagation();
          openReceiptDetail(receipt);
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

  const renderReceivingDetailWorkspace = () => {
    if (!selectedReceiptDetail) return null;

    const receipt = selectedReceiptDetail;
    const isInReceiving = receipt.status === "In Receiving";

    return (
      <div className="phase17-smart-card">
        <div className="phase17-smart-card-header">
          <div>
            <span>Receiving Detail Workspace</span>
            <strong>{receipt.receiptNumber}</strong>
            <p>Review the full receiving record, prepare putaway, and regenerate labels without opening dropdown sections.</p>
          </div>

          <div className="shipping-station-actions shipping-workbench-actions">
            <button
              type="button"
              className="phase17-secondary-button"
              onClick={closeReceiptDetail}
            >
              ← Back to Receiving Queue
            </button>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="phase17-smart-card-body">
          <div className="phase17-smart-sections">
            <div className="order-detail-section compact-order-section">
              <h3>Receiving Identity</h3>
              <div className="order-release-summary-grid receiving-workbench-field-grid">
                <div className="order-detail-field">
                  <span>Receipt #</span>
                  <strong>{receipt.receiptNumber}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Status</span>
                  <strong>{receipt.status}</strong>
                </div>

                <div className="order-detail-field">
                  <span>PO</span>
                  <strong>{receipt.purchaseOrder || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Vendor</span>
                  <strong>{receipt.vendor || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Carrier</span>
                  <strong>{receipt.carrier || "Not Provided"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Tracking Number</span>
                  <strong>{receipt.trackingNumber || "Not Provided"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Created</span>
                  <strong>{receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>RCV Location</span>
                  <strong>{receipt.receivingLocation || "-"}</strong>
                </div>
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Material Details</h3>
              <div className="order-release-summary-grid receiving-workbench-field-grid">
                <div className="order-detail-field">
                  <span>Part #</span>
                  <strong>{receipt.partNumber || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Description</span>
                  <strong>{receipt.description || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Quantity</span>
                  <strong>{receipt.quantity}</strong>
                </div>

                <div className="order-detail-field">
                  <span>COO</span>
                  <strong>{receipt.countryOfOrigin || "-"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>A&M Function</span>
                  <strong>{receipt.isAM ? "Yes" : "No"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>TAG / SQ FT</span>
                  <strong>
                    {receipt.isAM
                      ? `${receipt.tagNumber || "-"} / ${receipt.squareFeet || "-"}`
                      : "-"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Putaway / Storage</h3>
              <div className="order-release-summary-grid receiving-workbench-field-grid">
                <div className="order-detail-field">
                  <span>Final Storage Location</span>
                  <strong>{receipt.finalStorageLocation || "Pending"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Putaway Qty</span>
                  <strong>{receipt.putawayQty || "Pending"}</strong>
                </div>

                <div className="order-detail-field">
                  <span>Selected for Putaway</span>
                  <strong>
                    {selectedReceiptNumbers.includes(receipt.receiptNumber)
                      ? "Selected"
                      : "Not Selected"}
                  </strong>
                </div>
              </div>

              {isInReceiving ? (
                <>
                  <div className="inventory-form-grid phase17-form-grid receiving-workbench-form">
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

                  <div className="shipping-station-actions shipping-workbench-actions">
                    <button
                      className="inventory-primary-button"
                      onClick={() => prepareReceiptForPutaway(receipt)}
                    >
                      Select for Putaway
                    </button>

                    <button
                      className="order-success-button"
                      onClick={transferToStorage}
                      disabled={!selectedReceiptNumbers.includes(receipt.receiptNumber)}
                    >
                      Transfer to Storage
                    </button>
                  </div>
                </>
              ) : (
                <p className="panel-note">This receipt is already putaway complete.</p>
              )}
            </div>

            <div className="order-detail-section compact-order-section">
              <h3>Label Controls</h3>
              <p>
                Prepare or regenerate a receiving label for this receipt. Label layout and printer behavior remain unchanged.
              </p>

              <div className="shipping-station-actions shipping-workbench-actions">
                <button
                  className="inventory-primary-button"
                  onClick={() => prepareDetailReprintLabel(receipt)}
                >
                  Prepare Label
                </button>
              </div>

              {labelData?.inventoryId === receipt.receiptNumber && (
                <div className="order-detail-section">
                  <h3>Label Preview</h3>
                  <LabelGenerator initialData={labelData} />
                </div>
              )}
            </div>
          </div>

          {renderSummary()}
        </div>
      </div>
    );
  };

  const renderKpis = () => {
    return (
      <div className="inventory-kpi-grid receiving-workbench-kpi-grid">
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
          <span>RCV Locations</span>
          <h2>{receivingLocations.length}</h2>
          <p>Temporary locations</p>
        </div>

        <div className="inventory-kpi-card">
          <span>A&M Receipts</span>
          <h2>{receipts.filter((receipt) => receipt.isAM).length}</h2>
          <p>SQ FT and TAG required</p>
        </div>
      </div>
    );
  };

  const renderActivitySection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "activity",
          "Current Receiving Activity",
          "Live receiving records from Supabase"
        )}

        {expandedSection === "activity" && (
          <div className="phase17-accordion-body">
            {loadingReceipts ? (
              <p className="panel-note">Loading receiving records...</p>
            ) : (
              <table className="inventory-table receiving-workbench-table">
                <thead>
                  <tr>
                    <th>Action</th>
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
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan="9">No receiving records found.</td>
                    </tr>
                  ) : (
                    receipts.map((receipt) => (
                      <tr key={receipt.receiptNumber}>
                        <td>{renderOpenReceiptDetailButton(receipt)}</td>
                        <td>{receipt.receiptNumber}</td>
                        <td>{receipt.purchaseOrder}</td>
                        <td>{receipt.vendor}</td>
                        <td>{receipt.partNumber}</td>
                        <td>{receipt.quantity}</td>
                        <td>{receipt.countryOfOrigin}</td>
                        <td>{receipt.receivingLocation}</td>
                        <td>{receipt.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReceiveSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "receive",
          "Receive Inventory",
          "PO, vendor, optional carrier/tracking, part, quantity, COO, and A&M details"
        )}

        {expandedSection === "receive" && (
          <div className="phase17-accordion-body">
            <div className="inventory-form-grid phase17-form-grid receiving-workbench-form">
              <input value={receiptForm.purchaseOrder} onChange={(e) => updateReceiptForm("purchaseOrder", e.target.value)} placeholder="Purchase Order" />
              <input value={receiptForm.vendor} onChange={(e) => updateReceiptForm("vendor", e.target.value)} placeholder="Vendor" />
              <input value={receiptForm.partNumber} onChange={(e) => updateReceiptForm("partNumber", e.target.value)} placeholder="Part Number" />
              <input value={receiptForm.description} onChange={(e) => updateReceiptForm("description", e.target.value)} placeholder="Description" />
              <input type="number" value={receiptForm.quantity} onChange={(e) => updateReceiptForm("quantity", e.target.value)} placeholder="Quantity" />
              <input value={receiptForm.countryOfOrigin} onChange={(e) => updateReceiptForm("countryOfOrigin", e.target.value)} placeholder="Country of Origin" />
            </div>

            <div className="order-detail-section compact-order-section" style={{ marginTop: "12px" }}>
              <h3>Carrier / Tracking — Optional</h3>
              <div className="inventory-form-grid phase17-form-grid receiving-workbench-form">
                <input
                  value={receiptForm.carrier}
                  onChange={(e) => updateReceiptForm("carrier", e.target.value)}
                  placeholder="Carrier (Optional)"
                />

                <input
                  value={receiptForm.trackingNumber}
                  onChange={(e) => updateReceiptForm("trackingNumber", e.target.value)}
                  placeholder="Tracking Number (Optional)"
                />
              </div>

              <p className="panel-note">Carrier and tracking are saved to the receiving record only. They do not print on the receiving label.</p>
            </div>

            <div className="receiving-checkbox-row receiving-workbench-checkbox">
              <label>
                <input type="checkbox" checked={receiptForm.isAM} onChange={(e) => updateReceiptForm("isAM", e.target.checked)} />
                A&M Function
              </label>
            </div>

            {receiptForm.isAM && (
              <div className="inventory-form-grid phase17-form-grid receiving-workbench-form">
                <input value={receiptForm.squareFeet} onChange={(e) => updateReceiptForm("squareFeet", e.target.value)} placeholder="SQ FT" />
                <input value={receiptForm.tagNumber} onChange={(e) => updateReceiptForm("tagNumber", e.target.value)} placeholder="TAG Number" />
              </div>
            )}

            <button className="inventory-primary-button receiving-workbench-action" onClick={confirmReceipt}>
              Confirm Receipt
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderReceivingLabelSection = () => {
    if (!labelData || receivingView !== "create") return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "label",
          "Receiving Label Ready",
          "Review and print the confirmed receiving label"
        )}

        {expandedSection === "label" && (
          <div className="phase17-accordion-body">
            <LabelGenerator initialData={labelData} />
          </div>
        )}
      </div>
    );
  };

  const renderPutawayQueueSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "queue",
          "Receiving Location Queue",
          "Select receipts waiting for putaway"
        )}

        {expandedSection === "queue" && (
          <div className="phase17-accordion-body">
            <table className="inventory-table receiving-workbench-table">
              <thead>
                <tr>
                  <th>Action</th>
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
                    <td colSpan="8">No receipts currently awaiting putaway.</td>
                  </tr>
                ) : (
                  inReceivingReceipts.map((receipt) => (
                    <tr key={receipt.receiptNumber}>
                      <td>{renderOpenReceiptDetailButton(receipt)}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedReceiptNumbers.includes(receipt.receiptNumber)}
                          onChange={() => toggleReceiptSelection(receipt.receiptNumber)}
                        />
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
        )}
      </div>
    );
  };

  const renderTransferSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "transfer",
          "Split Putaway / Transfer to Storage",
          "Transfer selected receipt quantity into final inventory location"
        )}

        {expandedSection === "transfer" && (
          <div className="phase17-accordion-body">
            <div className="inventory-form-grid phase17-form-grid receiving-workbench-form">
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

            <button className="inventory-primary-button receiving-workbench-action" onClick={transferToStorage}>
              Transfer to Storage
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPutawayLabelsSection = () => {
    if (putawayLabelDataList.length === 0) return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "putawayLabels",
          "Putaway Labels Ready",
          "Print labels for new inventory and remaining receiving balances"
        )}

        {expandedSection === "putawayLabels" && (
          <div className="phase17-accordion-body">
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

  const renderReprintSection = () => {
    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "reprint",
          "Reprint Labels",
          "Search by Receipt Number or Part Number"
        )}

        {expandedSection === "reprint" && (
          <div className="phase17-accordion-body">
            <div className="inventory-form-grid phase17-form-grid receiving-workbench-form">
              <input value={reprintSearch} onChange={(e) => setReprintSearch(e.target.value)} placeholder="Receipt Number or Part Number" />
              <input type="number" value={labelQty} onChange={(e) => setLabelQty(e.target.value)} placeholder="Qty of Labels" />
            </div>

            {reprintReceipt && (
              <div className="order-detail-section">
                <h3>Label Preview Data</h3>
                <p>Receipt: {reprintReceipt.receiptNumber}</p>
                <p>Part Number: {reprintReceipt.partNumber}</p>
                <p>Description: {reprintReceipt.description}</p>
                <p>COO: {reprintReceipt.countryOfOrigin}</p>
                <p>Qty: {getReceiptLabelQuantity(reprintReceipt)}</p>
                {reprintReceipt.isAM && <p>A&M SQ FT: {reprintReceipt.squareFeet}</p>}
                {reprintReceipt.isAM && <p>A&M TAG: {reprintReceipt.tagNumber}</p>}
              </div>
            )}

            <button className="inventory-primary-button receiving-workbench-action" onClick={reprintLabel}>
              Reprint Label
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderReprintLabelSection = () => {
    if (!labelData || receivingView !== "reprint") return null;

    return (
      <div className="phase17-accordion-section">
        {renderAccordionHeader(
          "reprintLabel",
          "Reprint Label Ready",
          "Review and print regenerated receiving label"
        )}

        {expandedSection === "reprintLabel" && (
          <div className="phase17-accordion-body">
            <LabelGenerator initialData={labelData} />
          </div>
        )}
      </div>
    );
  };

  const renderSummary = () => {
    const firstSelected = selectedReceipts[0];

    return (
      <aside className="phase17-smart-summary receiving-workbench-summary">
        <div className="job-request-summary-panel">
          <div className="job-summary-header">
            <span>Receiving Snapshot</span>
            <strong>
              {firstSelected?.receiptNumber ||
                latestReceipt?.receiptNumber ||
                "No Receipt Selected"}
            </strong>
          </div>

          <div className="job-summary-grid">
            <div>
              <span>In Receiving</span>
              <strong>{inReceivingReceipts.length}</strong>
            </div>

            <div>
              <span>Selected</span>
              <strong>{selectedReceiptNumbers.length}</strong>
            </div>

            <div>
              <span>PO</span>
              <strong>
                {firstSelected?.purchaseOrder ||
                  latestReceipt?.purchaseOrder ||
                  "Pending"}
              </strong>
            </div>

            <div>
              <span>Vendor</span>
              <strong>{firstSelected?.vendor || latestReceipt?.vendor || "Pending"}</strong>
            </div>

            <div>
              <span>Carrier</span>
              <strong>{firstSelected?.carrier || latestReceipt?.carrier || "Pending"}</strong>
            </div>

            <div>
              <span>Tracking</span>
              <strong>{firstSelected?.trackingNumber || latestReceipt?.trackingNumber || "Pending"}</strong>
            </div>

            <div>
              <span>COO</span>
              <strong>
                {firstSelected?.countryOfOrigin ||
                  latestReceipt?.countryOfOrigin ||
                  "Pending"}
              </strong>
            </div>

            <div>
              <span>Final Location</span>
              <strong>{buildFinalStorageLocation() || "Pending"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="inventory-primary-button job-submit-button"
            onClick={() => {
              if (receivingView === "create") setExpandedSection("receive");
              if (receivingView === "putaway") setExpandedSection("transfer");
              if (receivingView === "reprint") setExpandedSection("reprint");
              if (receivingView === "dashboard") setExpandedSection("activity");
            }}
          >
            Open Active Step
          </button>

          <p className="job-summary-note">
            Receiving controls receipt confirmation, split putaway, inventory creation,
            and label regeneration.
          </p>
        </div>
      </aside>
    );
  };

  const getWorkbenchTitle = () => {
    if (receivingView === "create") return "Create Inbound Receipt";
    if (receivingView === "putaway") return "Putaway Workspace";
    if (receivingView === "reprint") return "Reprint Labels";
    return "Receiving Workspace";
  };

  const renderWorkbenchSections = () => {
    if (receivingView === "create") {
      return (
        <>
          {renderReceiveSection()}
          {renderReceivingLabelSection()}
        </>
      );
    }

    if (receivingView === "putaway") {
      return (
        <>
          {renderPutawayQueueSection()}
          {renderTransferSection()}
          {renderPutawayLabelsSection()}
        </>
      );
    }

    if (receivingView === "reprint") {
      return (
        <>
          {renderReprintSection()}
          {renderReprintLabelSection()}
        </>
      );
    }

    return renderActivitySection();
  };

  return (
    <div className="receiving-subview receiving-transaction-workspace phase17-workbench-screen">
      <div className="receiving-header-row receiving-transaction-header">
        <div>
          <h1>{getWorkbenchTitle()}</h1>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      {receivingView === "dashboard" && renderKpis()}

      <div className="phase17-smart-card-shell receiving-workbench-shell">
        {selectedReceiptDetail ? (
          renderReceivingDetailWorkspace()
        ) : (
          <div className="phase17-smart-card">
            <div className="phase17-smart-card-header">
              <div>
                <span>Smart Receiving Command Card</span>
                <strong>{getWorkbenchTitle()}</strong>
                <p>Receive material, validate inbound details, split putaway, regenerate labels, and keep inventory records clean.</p>
              </div>

              <div className="phase17-progress">
                <span className={receivingView === "create" ? "active" : ""}>1 Receive</span>
                <span className={receivingView === "putaway" ? "active" : ""}>2 Putaway</span>
                <span className={receivingView === "reprint" ? "active" : ""}>3 Labels</span>
              </div>
            </div>

            <div className="phase17-smart-card-body">
              <div className="phase17-smart-sections">
                {renderWorkbenchSections()}
              </div>

              {renderSummary()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceivingWorkspace;
