import React, { useEffect, useRef, useState } from "react";
import intralLogo from "../assets/intral-logo.jpg";

function LabelGenerator({ initialData }) {
  const logoGraphicRef = useRef(null);

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
  const [printStatus, setPrintStatus] = useState("");
  const [printerProfile, setPrinterProfile] = useState(() => {
    try {
      const savedProfile = localStorage.getItem("intral-connect-printer-profile");
      return savedProfile
        ? JSON.parse(savedProfile)
        : {
            profileName: "Default Zebra Printer",
            printMode: "serial",
            notes: "Zebra ZT411 / COM / Bluetooth",
          };
    } catch (error) {
      return {
        profileName: "Default Zebra Printer",
        printMode: "serial",
        notes: "Zebra ZT411 / COM / Bluetooth",
      };
    }
  });

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

  const updatePrinterProfile = (field, value) => {
    setPrinterProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const savePrinterProfile = () => {
    localStorage.setItem(
      "intral-connect-printer-profile",
      JSON.stringify(printerProfile)
    );

    setPrintStatus(
      `Printer profile saved: ${printerProfile.profileName || "Printer Profile"}`
    );
  };

  const resetPrinterProfile = () => {
    const defaultProfile = {
      profileName: "Default Zebra Printer",
      printMode: "serial",
      notes: "Zebra ZT411 / COM / Bluetooth",
    };

    setPrinterProfile(defaultProfile);
    localStorage.setItem(
      "intral-connect-printer-profile",
      JSON.stringify(defaultProfile)
    );
    setPrintStatus("Printer profile reset to Zebra Serial / COM mode.");
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
    if (logoGraphicRef.current) {
      return Promise.resolve(logoGraphicRef.current);
    }

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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
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
                const isDark = alpha > 80 && brightness < 210;

                if (isDark) {
                  byte |= 1 << (7 - bit);
                }
              }
            }

            hexData += byte.toString(16).padStart(2, "0").toUpperCase();
          }
        }

        const result = {
          graphicCommand: `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}`,
        };

        logoGraphicRef.current = result;
        resolve(result);
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

  const delay = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

  const closePrinterPort = async (port, writer) => {
    try {
      if (writer) {
        writer.releaseLock();
      }
    } catch (releaseError) {
      console.warn("Printer writer release warning:", releaseError.message);
    }

    try {
      if (port?.readable || port?.writable) {
        await delay(150);
        await port.close();
      }
    } catch (closeError) {
      console.warn("Printer port close warning:", closeError.message);
    }
  };

  const buildBrowserPreviewHtml = () => {
    const isAmSite = label.site === "AM" || label.site === "A&M";

    return `
      <!doctype html>
      <html>
        <head>
          <title>INTRAL Inventory Label Preview - ${cleanZplText(label.inventoryId)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #111827; }
            .actions { width: 4.25in; margin: 16px auto 10px; display: flex; justify-content: flex-end; gap: 8px; }
            .actions button { border: none; border-radius: 8px; padding: 9px 12px; font-weight: 800; cursor: pointer; }
            .print-button { background: #2563eb; color: white; }
            .close-button { background: #e5e7eb; color: #111827; }
            .label { width: 4.25in; min-height: 4.25in; margin: 0 auto; border: 2px solid #111827; padding: 10px; background: #ffffff; color: #111827; }
            .header { display: grid; grid-template-columns: 190px 1fr; gap: 10px; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 7px; margin-bottom: 7px; }
            .logo { height: 72px; max-width: 190px; object-fit: contain; }
            h3 { margin: 0; font-size: 17px; line-height: 18px; }
            .subtitle { font-weight: bold; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; font-size: 13px; }
            p { margin: 3px 0; }
            .description { margin: 6px 0 3px; font-size: 13px; }
            .inventory-id { margin: 8px 0 4px; font-size: 17px; }
            .barcode { margin-top: 6px; padding: 8px; border: 1px solid #111827; text-align: center; font-weight: bold; letter-spacing: 2px; min-height: 48px; }
            @media print {
              body { background: #ffffff; }
              .actions { display: none; }
              .label { margin: 0; border: 2px solid #111827; page-break-after: always; }
              @page { size: 4.25in 4.25in; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <button class="close-button" onclick="window.close()">Close Preview</button>
            <button class="print-button" onclick="window.print()">Print Preview Label</button>
          </div>

          <div class="label">
            <div class="header">
              <img src="${intralLogo}" alt="INTRAL Logo" class="logo" />
              <div>
                <h3>INTRAL INVENTORY LABEL</h3>
                <div class="subtitle">3PL Warehouse Operations</div>
              </div>
            </div>

            <div class="grid">
              <p><strong>Part #:</strong> ${cleanZplText(label.partNumber)}</p>
              <p><strong>Qty:</strong> ${cleanZplText(label.quantity)}</p>
              <p><strong>Customer:</strong> ${cleanZplText(label.customer)}</p>
              <p><strong>PO #:</strong> ${cleanZplText(label.poNumber)}</p>
              <p><strong>COO:</strong> ${cleanZplText(label.countryOfOrigin)}</p>
              <p><strong>${isAmSite ? "A&M Tag:" : "Site:"}</strong> ${
                isAmSite ? cleanZplText(label.amTag) : cleanZplText(label.site)
              }</p>
              <p><strong>Sq Ft:</strong> ${cleanZplText(label.squareFeet)}</p>
              <p><strong>Date:</strong> ${cleanZplText(label.date)}</p>
            </div>

            <p class="description"><strong>Description:</strong> ${cleanZplText(label.description)}</p>
            <p class="inventory-id"><strong>Inventory ID:</strong> ${cleanZplText(label.inventoryId)}</p>

            <div class="barcode">
              *${cleanZplText(label.inventoryId) || "SCAN-ID"}*
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const printBrowserPreviewLabel = () => {
    if (!label.inventoryId) {
      alert("Inventory ID is required before previewing.");
      return;
    }

    const previewWindow = window.open("", "_blank", "width=720,height=720");

    if (!previewWindow) {
      alert("Popup blocked. Please allow popups to preview the label.");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(buildBrowserPreviewHtml());
    previewWindow.document.close();

    setPrintStatus("Browser preview opened. Use Print Preview Label if needed.");
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

    if (printerProfile.printMode === "browser") {
      printBrowserPreviewLabel();
      return;
    }

    if (!("serial" in navigator)) {
      alert(
        "Serial printing is not supported in this browser. Switch the Printer Profile to Browser Preview Only, or use Google Chrome / Microsoft Edge on the computer connected to the Zebra ZT411 printer."
      );
      return;
    }

    let port = null;
    let writer = null;

    try {
      setPrintStatus("Preparing ZPL label...");
      const zpl = await buildZplLabel();

      setPrintStatus(
        `Waiting for printer selection: ${printerProfile.profileName || "Zebra Serial / COM Printer"}`
      );
      port = await navigator.serial.requestPort();

      setPrintStatus("Opening Zebra printer port...");
      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      const encoder = new TextEncoder();
      const zplBytes = encoder.encode(zpl);

      setPrintStatus("Sending label to Zebra printer...");
      writer = port.writable.getWriter();
      await writer.write(zplBytes);

      await delay(250);
      await closePrinterPort(port, writer);

      writer = null;
      port = null;

      setPrintStatus("Label sent successfully.");
      alert("Label sent to Zebra printer.");
    } catch (error) {
      await closePrinterPort(port, writer);

      const message =
        error?.name === "NotFoundError"
          ? "Printer selection was cancelled. No label was sent."
          : error?.message || "Unknown printer error.";

      setPrintStatus(`Print failed: ${message}`);
      alert(`Label print failed: ${message}`);
    }
  };

  const clearLabel = () => {
    setIsReprintMode(false);
    setLabelPrintQty("1");
    setPrintStatus("");

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
          background: "rgba(15, 23, 42, 0.92)",
          border: "1px solid rgba(96, 165, 250, 0.35)",
          padding: "14px",
          borderRadius: "12px",
          marginBottom: "12px",
          boxShadow: "0 8px 22px rgba(0, 0, 0, 0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <div>
            <strong
              style={{
                color: "#ffffff",
                fontSize: "16px",
                letterSpacing: "0.02em",
              }}
            >
              Printer Profile
            </strong>
            <p
              style={{
                color: "#cbd5e1",
                fontSize: "12px",
                margin: "4px 0 0",
                fontWeight: 700,
              }}
            >
              Saved locally for this browser / workstation.
            </p>
          </div>

          <span
            style={{
              background:
                printerProfile.printMode === "serial"
                  ? "rgba(37, 99, 235, 0.28)"
                  : "rgba(22, 163, 74, 0.24)",
              border:
                printerProfile.printMode === "serial"
                  ? "1px solid rgba(147, 197, 253, 0.55)"
                  : "1px solid rgba(134, 239, 172, 0.55)",
              color:
                printerProfile.printMode === "serial" ? "#bfdbfe" : "#bbf7d0",
              borderRadius: "999px",
              padding: "7px 10px",
              fontSize: "11px",
              fontWeight: 900,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            {printerProfile.printMode === "serial"
              ? "Zebra Serial / COM"
              : "Browser Preview"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <label style={{ color: "#dbeafe", fontWeight: 900 }}>
              Profile Name
            </label>
            <input
              value={printerProfile.profileName}
              onChange={(e) =>
                updatePrinterProfile("profileName", e.target.value)
              }
              placeholder="Example: Oscar Zebra ZT411"
              style={{
                background: "#f8fafc",
                color: "#0f172a",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "9px",
                width: "100%",
                fontWeight: 800,
              }}
            />
          </div>

          <div>
            <label style={{ color: "#dbeafe", fontWeight: 900 }}>
              Print Mode
            </label>
            <select
              value={printerProfile.printMode}
              onChange={(e) =>
                updatePrinterProfile("printMode", e.target.value)
              }
              style={{
                background: "#f8fafc",
                color: "#0f172a",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "9px",
                width: "100%",
                fontWeight: 800,
              }}
            >
              <option value="serial">Zebra Serial / COM / Bluetooth</option>
              <option value="browser">Browser Preview Only</option>
            </select>
          </div>

          <div>
            <label style={{ color: "#dbeafe", fontWeight: 900 }}>
              Printer Notes
            </label>
            <input
              value={printerProfile.notes}
              onChange={(e) => updatePrinterProfile("notes", e.target.value)}
              placeholder="Example: Warehouse Zebra / COM3"
              style={{
                background: "#f8fafc",
                color: "#0f172a",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "9px",
                width: "100%",
                fontWeight: 800,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            onClick={savePrinterProfile}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Save Printer Profile
          </button>

          <button
            type="button"
            onClick={resetPrinterProfile}
            style={{
              background: "rgba(71, 85, 105, 0.92)",
              color: "#ffffff",
              border: "1px solid rgba(203, 213, 225, 0.35)",
              borderRadius: "8px",
              padding: "9px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={printBrowserPreviewLabel}
            style={{
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Preview Label
          </button>
        </div>

      </div>

      {printStatus && (
        <div
          style={{
            background: printStatus.includes("failed") ? "#fef2f2" : "#eff6ff",
            border: printStatus.includes("failed")
              ? "1px solid #fecaca"
              : "1px solid #bfdbfe",
            color: printStatus.includes("failed") ? "#991b1b" : "#1e3a8a",
            padding: "10px 12px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontWeight: "700",
          }}
        >
          {printStatus}
        </div>
      )}

      {isReprintMode && (
        <div
          style={{
            background: "rgba(22, 163, 74, 0.16)",
            border: "1px solid rgba(134, 239, 172, 0.45)",
            color: "#bbf7d0",
            padding: "8px 10px",
            borderRadius: "8px",
            marginBottom: "10px",
            fontWeight: "800",
            fontSize: "13px",
          }}
        >
          Reprint mode active — fields are locked.
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
