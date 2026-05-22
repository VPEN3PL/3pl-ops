import React, { useEffect, useState } from "react";
import intralLogo from "../assets/intral-logo.jpg";

function LabelGenerator({ initialData }) {
  const [label, setLabel] = useState({
    inventoryId: "",
    customer: "",
    partNumber: "",
    quantity: "",
    description: "",
    poNumber: "",
    countryOfOrigin: "",
    site: "INTRAL",
    amTag: "",
    squareFeet: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [isReprintMode, setIsReprintMode] = useState(false);
  const [labelPrintQty, setLabelPrintQty] = useState("1");

  useEffect(() => {
    if (initialData) {
      setIsReprintMode(true);

      setLabel({
        inventoryId: initialData.inventoryId || initialData.id || "",
        customer: initialData.customer || "",
        partNumber:
          initialData.partNumber ||
          initialData.part_number ||
          "",
        quantity: initialData.quantity || "",
        description: initialData.description || "",
        poNumber:
          initialData.poNumber ||
          initialData.po_number ||
          "",
        countryOfOrigin:
          initialData.countryOfOrigin ||
          initialData.coo ||
          initialData.country_of_origin ||
          "",
        site: initialData.site || "INTRAL",
        amTag:
          initialData.amTag ||
          initialData.am_tag ||
          "",
        squareFeet:
          initialData.squareFeet ||
          initialData.square_feet ||
          "",
        date: initialData.date || new Date().toISOString().slice(0, 10),
      });
    }
  }, [initialData]);

  const updateLabel = (field, value) => {
    setLabel((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const cleanZplText = (value) => {
    return String(value || "")
      .replace(/[\^~]/g, "")
      .replace(/\r?\n|\r/g, " ")
      .trim();
  };

  const truncate = (value, maxLength) => {
    const text = cleanZplText(value);
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  };

  const convertLogoToZplGraphic = () => {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const targetWidth = 350;
        const targetHeight = 118;
        const canvas = document.createElement("canvas");

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const imageRatio = image.width / image.height;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let drawX = 0;
        let drawY = 0;

        if (imageRatio > targetRatio) {
          drawHeight = targetWidth / imageRatio;
          drawY = (targetHeight - drawHeight) / 2;
        } else {
          drawWidth = targetHeight * imageRatio;
          drawX = (targetWidth - drawWidth) / 2;
        }

        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const pixels = imageData.data;
        const bytesPerRow = Math.ceil(targetWidth / 8);
        const totalBytes = bytesPerRow * targetHeight;

        let hexData = "";

        for (let y = 0; y < targetHeight; y += 1) {
          for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex += 1) {
            let byte = 0;

            for (let bit = 0; bit < 8; bit += 1) {
              const x = byteIndex * 8 + bit;

              if (x < targetWidth) {
                const pixelIndex = (y * targetWidth + x) * 4;
                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];
                const alpha = pixels[pixelIndex + 3];

                const brightness = (r + g + b) / 3;
                const isDark = alpha > 80 && brightness < 205;

                if (isDark) {
                  byte |= 1 << (7 - bit);
                }
              }
            }

            hexData += byte.toString(16).padStart(2, "0").toUpperCase();
          }
        }

        resolve({
          graphicCommand: `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}`,
        });
      };

      image.onerror = () => resolve(null);
      image.src = intralLogo;
    });
  };

  const buildZplLabel = async () => {
    const logoGraphic = await convertLogoToZplGraphic();

    const inventoryId = truncate(label.inventoryId, 34);
    const customer = truncate(label.customer, 30);
    const partNumber = truncate(label.partNumber, 32);
    const quantity = truncate(label.quantity, 18);
    const descriptionLine1 = truncate(label.description, 42);
    const descriptionLine2 = truncate(String(label.description || "").slice(42), 42);
    const poNumber = truncate(label.poNumber, 28);
    const countryOfOrigin = truncate(label.countryOfOrigin, 28);
    const site = truncate(label.site, 18);
    const amTag = truncate(label.amTag, 28);
    const squareFeet = truncate(label.squareFeet, 18);
    const date = truncate(label.date, 18);
    const printQty = Math.max(1, Number(labelPrintQty || 1));

    const isAmSite = site === "AM" || site === "A&M";
    const locationLabel = isAmSite ? "A&M TAG:" : "SITE:";
    const locationValue = isAmSite ? amTag || "N/A" : site || "INTRAL";

    const logoZpl = logoGraphic
      ? `^FO38,30${logoGraphic.graphicCommand}^FS`
      : "^FO55,48^A0N,58,58^FDINTRAL^FS";

    return `
^XA
^CI28
^PW863
^LL863
^LH0,0

^FO24,22^GB815,818,4^FS

${logoZpl}
^FO430,42^A0N,34,34^FDINTRAL INVENTORY LABEL^FS
^FO430,82^A0N,22,22^FD3PL Warehouse Operations^FS
^FO38,152^GB785,3,3^FS

^FO45,176^A0N,28,28^FDPART #:^FS
^FO205,176^A0N,30,30^FD${partNumber}^FS

^FO45,218^A0N,28,28^FDDESC:^FS
^FO205,218^A0N,25,25^FD${descriptionLine1}^FS
^FO205,250^A0N,25,25^FD${descriptionLine2}^FS

^FO45,295^A0N,28,28^FDCUSTOMER:^FS
^FO205,295^A0N,28,28^FD${customer}^FS

^FO45,337^A0N,28,28^FDPO #:^FS
^FO205,337^A0N,28,28^FD${poNumber}^FS

^FO45,379^A0N,28,28^FDCOO:^FS
^FO205,379^A0N,31,31^FD${countryOfOrigin}^FS

^FO45,421^A0N,28,28^FDQTY:^FS
^FO205,421^A0N,34,34^FD${quantity}^FS

^FO445,337^A0N,28,28^FD${locationLabel}^FS
^FO600,337^A0N,28,28^FD${locationValue}^FS

^FO445,379^A0N,28,28^FDSQ FT:^FS
^FO600,379^A0N,28,28^FD${squareFeet}^FS

^FO45,485^GB775,3,3^FS

^FO45,515^A0N,32,32^FDINV ID:^FS
^FO205,515^A0N,34,34^FD${inventoryId}^FS

^FO105,585^BY3,2,130
^BCN,130,Y,N,N
^FD${inventoryId}^FS

^FO45,800^A0N,24,24^FDDATE: ${date}^FS
^FO570,800^A0N,24,24^FDLABEL: 4.25 x 4.25^FS

^PQ${printQty}
^XZ
`;
  };

  const printLabel = async () => {
    if (!label.inventoryId) {
      alert("Inventory ID is required before printing.");
      return;
    }

    if (!labelPrintQty || Number(labelPrintQty) <= 0) {
      alert("Qty of Labels must be greater than zero.");
      return;
    }

    if (!("serial" in navigator)) {
      alert(
        "Serial printing is not supported in this browser. Use Google Chrome or Microsoft Edge on the computer connected to the Zebra printer."
      );
      return;
    }

    let port;
    let writer;

    try {
      port = await navigator.serial.requestPort();

      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      const zpl = await buildZplLabel();
      const encoder = new TextEncoder();

      writer = port.writable.getWriter();
      await writer.write(encoder.encode(zpl));
      writer.releaseLock();
      writer = null;

      await port.close();

      alert("Label sent to Zebra printer.");
    } catch (error) {
      try {
        if (writer) {
          writer.releaseLock();
        }

        if (port) {
          await port.close();
        }
      } catch (closeError) {
        console.warn("Printer port close warning:", closeError.message);
      }

      alert(`Label print failed: ${error.message}`);
    }
  };

  const clearLabel = () => {
    setIsReprintMode(false);
    setLabelPrintQty("1");

    setLabel({
      inventoryId: "",
      customer: "",
      partNumber: "",
      quantity: "",
      description: "",
      poNumber: "",
      countryOfOrigin: "",
      site: "INTRAL",
      amTag: "",
      squareFeet: "",
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const isAmPreview = label.site === "AM" || label.site === "A&M";

  return (
    <div className="card">
      <h2>
        {isReprintMode ? "Reprint Inventory Label" : "Inventory Label Generator"}
      </h2>

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "12px",
        }}
      >
        <strong>Printer Instructions</strong>
        <p style={{ margin: "6px 0" }}>Label Size: 4.25 x 4.25</p>
        <p style={{ margin: "6px 0" }}>
          Click Print Label → select the Zebra serial / Bluetooth / COM printer
          connection when prompted.
        </p>
        <p style={{ margin: "6px 0", fontSize: "13px", color: "#475569" }}>
          This uses the Zebra serial/COM function and sends ZPL directly to the printer.
          It does not use window.print().
        </p>
      </div>

      {isReprintMode && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontWeight: "700",
          }}
        >
          Reprint mode: fields are locked. This screen is for reprinting the
          existing inventory label only.
        </div>
      )}

      {!isReprintMode && (
        <>
          <div className="grid">
            <div>
              <label>Inventory ID</label>
              <input
                value={label.inventoryId}
                onChange={(e) => updateLabel("inventoryId", e.target.value)}
                placeholder="Inventory ID"
              />
            </div>

            <div>
              <label>Customer</label>
              <input
                value={label.customer}
                onChange={(e) => updateLabel("customer", e.target.value)}
                placeholder="Customer"
              />
            </div>

            <div>
              <label>Part Number</label>
              <input
                value={label.partNumber}
                onChange={(e) => updateLabel("partNumber", e.target.value)}
                placeholder="Part Number"
              />
            </div>

            <div>
              <label>Quantity</label>
              <input
                value={label.quantity}
                onChange={(e) => updateLabel("quantity", e.target.value)}
                placeholder="Quantity"
              />
            </div>

            <div>
              <label>PO Number</label>
              <input
                value={label.poNumber}
                onChange={(e) => updateLabel("poNumber", e.target.value)}
                placeholder="PO Number"
              />
            </div>

            <div>
              <label>COO / Country of Origin</label>
              <input
                value={label.countryOfOrigin}
                onChange={(e) => updateLabel("countryOfOrigin", e.target.value)}
                placeholder="Country of Origin"
              />
            </div>

            <div>
              <label>Site</label>
              <select
                value={label.site}
                onChange={(e) => updateLabel("site", e.target.value)}
              >
                <option value="INTRAL">INTRAL</option>
                <option value="AM">A&M</option>
                <option value="CUSTOMER">Customer</option>
                <option value="TRANSIT">In Transit</option>
              </select>
            </div>

            <div>
              <label>A&M Tag</label>
              <input
                value={label.amTag}
                onChange={(e) => updateLabel("amTag", e.target.value)}
                placeholder="A&M Tag"
              />
            </div>

            <div>
              <label>Square Feet</label>
              <input
                value={label.squareFeet}
                onChange={(e) => updateLabel("squareFeet", e.target.value)}
                placeholder="Square Feet"
              />
            </div>

            <div>
              <label>Date</label>
              <input
                type="date"
                value={label.date}
                onChange={(e) => updateLabel("date", e.target.value)}
              />
            </div>
          </div>

          <label>Description</label>
          <input
            value={label.description}
            onChange={(e) => updateLabel("description", e.target.value)}
            placeholder="Description"
          />
        </>
      )}

      <div
        style={{
          width: "4.25in",
          minHeight: "4.25in",
          border: "2px solid #111827",
          padding: "10px",
          marginTop: "20px",
          marginBottom: "20px",
          background: "#ffffff",
          color: "#111827",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "190px 1fr",
            gap: "10px",
            alignItems: "center",
            borderBottom: "2px solid #111827",
            paddingBottom: "7px",
            marginBottom: "7px",
          }}
        >
          <img
            src={intralLogo}
            alt="INTRAL Logo"
            style={{
              height: "72px",
              maxWidth: "190px",
              objectFit: "contain",
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", lineHeight: "18px" }}>
              INTRAL INVENTORY LABEL
            </h3>
            <div style={{ fontWeight: "bold", fontSize: "12px" }}>
              3PL Warehouse Operations
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
          <p style={{ margin: "3px 0" }}>
            <strong>Part #:</strong> {label.partNumber}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>Qty:</strong> {label.quantity}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>Customer:</strong> {label.customer}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>PO #:</strong> {label.poNumber}
          </p>
          <p style={{ margin: "3px 0", fontWeight: "700" }}>
            <strong>COO:</strong> {label.countryOfOrigin}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>{isAmPreview ? "A&M Tag:" : "Site:"}</strong>{" "}
            {isAmPreview ? label.amTag : label.site}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>Sq Ft:</strong> {label.squareFeet}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>Date:</strong> {label.date}
          </p>
        </div>

        <p style={{ margin: "6px 0 3px 0" }}>
          <strong>Description:</strong> {label.description}
        </p>

        <p style={{ margin: "8px 0 4px 0", fontSize: "17px" }}>
          <strong>Inventory ID:</strong> {label.inventoryId}
        </p>

        <div
          style={{
            marginTop: "6px",
            padding: "8px",
            border: "1px solid #111827",
            textAlign: "center",
            fontWeight: "bold",
            letterSpacing: "2px",
            minHeight: "48px",
          }}
        >
          *{label.inventoryId || "SCAN-ID"}*
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label>Qty of Labels</label>
        <input
          type="number"
          min="1"
          value={labelPrintQty}
          onChange={(e) => setLabelPrintQty(e.target.value)}
          placeholder="Qty of Labels"
        />
      </div>

      <button onClick={printLabel}>
        {isReprintMode ? "Reprint Label" : "Print Label"}
      </button>

      {!isReprintMode && <button onClick={clearLabel}>Clear Label</button>}
    </div>
  );
}

export default LabelGenerator;
