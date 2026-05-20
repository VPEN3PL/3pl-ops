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
        const targetWidth = 330;
        const targetHeight = 105;
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

    const inventoryId = truncate(label.inventoryId, 36);
    const customer = truncate(label.customer, 32);
    const partNumber = truncate(label.partNumber, 32);
    const quantity = truncate(label.quantity, 18);
    const descriptionLine1 = truncate(label.description, 44);
    const descriptionLine2 = truncate(String(label.description || "").slice(44), 44);
    const poNumber = truncate(label.poNumber, 28);
    const countryOfOrigin = truncate(label.countryOfOrigin, 28);
    const site = truncate(label.site, 18);
    const amTag = truncate(label.amTag, 34);
    const squareFeet = truncate(label.squareFeet, 18);
    const date = truncate(label.date, 18);
    const printQty = Math.max(1, Number(labelPrintQty || 1));

    const isAmSite = site === "AM" || site === "A&M";
    const locationLabel = isAmSite ? "A&M TAG:" : "SITE:";
    const locationValue = isAmSite ? amTag || "N/A" : site || "INTRAL";

    const logoZpl = logoGraphic
      ? `^FO45,28${logoGraphic.graphicCommand}^FS`
      : "^FO55,48^A0N,54,54^FDINTRAL^FS";

    return `
^XA
^CI28
^PW863
^LL863
^LH0,0

^FO30,25^GB803,813,4^FS

${logoZpl}
^FO405,48^A0N,34,34^FDINTRAL INVENTORY LABEL^FS
^FO405,88^A0N,24,24^FD3PL Warehouse Operations^FS
^FO45,140^GB773,3,3^FS

^FO45,166^A0N,29,29^FDCUSTOMER:^FS
^FO245,166^A0N,29,29^FD${customer}^FS

^FO45,209^A0N,29,29^FDPART #:^FS
^FO245,209^A0N,29,29^FD${partNumber}^FS

^FO45,252^A0N,29,29^FDQTY:^FS
^FO245,252^A0N,29,29^FD${quantity}^FS

^FO45,295^A0N,29,29^FDPO #:^FS
^FO245,295^A0N,29,29^FD${poNumber}^FS

^FO45,338^A0N,29,29^FDCOO:^FS
^FO245,338^A0N,29,29^FD${countryOfOrigin}^FS

^FO45,381^A0N,29,29^FD${locationLabel}^FS
^FO245,381^A0N,29,29^FD${locationValue}^FS

^FO45,424^A0N,29,29^FDSQ FT:^FS
^FO245,424^A0N,29,29^FD${squareFeet}^FS

^FO45,469^A0N,26,26^FDDESC:^FS
^FO45,503^A0N,25,25^FD${descriptionLine1}^FS
^FO45,535^A0N,25,25^FD${descriptionLine2}^FS

^FO45,582^A0N,30,30^FDINV ID:^FS
^FO245,582^A0N,30,30^FD${inventoryId}^FS

^FO85,642^BY3,2,112
^BCN,112,Y,N,N
^FD${inventoryId}^FS

^FO45,800^A0N,24,24^FDDATE: ${date}^FS
^FO625,800^A0N,24,24^FD4.25 x 4.25^FS

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
      <h2>{isReprintMode ? "Reprint Inventory Label" : "Inventory Label Generator"}</h2>

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
          Reprint mode: fields are locked. This screen is for reprinting the existing inventory label only.
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
          padding: "12px",
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
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "2px solid #111827",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          <img
            src={intralLogo}
            alt="INTRAL Logo"
            style={{
              height: "62px",
              maxWidth: "185px",
              objectFit: "contain",
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: "18px" }}>INTRAL</h3>
            <div style={{ fontWeight: "bold", fontSize: "13px" }}>
              3PL INVENTORY LABEL
            </div>
          </div>
        </div>

        <p style={{ margin: "4px 0" }}>
          <strong>Customer:</strong> {label.customer}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Part #:</strong> {label.partNumber}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Qty:</strong> {label.quantity}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>PO #:</strong> {label.poNumber}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>COO:</strong> {label.countryOfOrigin}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>{isAmPreview ? "A&M Tag:" : "Site:"}</strong>{" "}
          {isAmPreview ? label.amTag : label.site}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Sq Ft:</strong> {label.squareFeet}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Description:</strong> {label.description}
        </p>
        <p style={{ margin: "10px 0 4px 0", fontSize: "18px" }}>
          <strong>Inventory ID:</strong> {label.inventoryId}
        </p>
        <div
          style={{
            marginTop: "10px",
            padding: "8px",
            border: "1px solid #111827",
            textAlign: "center",
            fontWeight: "bold",
            letterSpacing: "2px",
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
