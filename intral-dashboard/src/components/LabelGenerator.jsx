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
    labelType: "inventory",
    netWeight: "",
    dimensions: "",
    crateNumber: "",
    projectNumber: "",
    destinationCountry: "",
    shipTo: "",
    jobNumber: "",
    soNumber: "",
    carrier: "",
    trackingNumber: "",
    pieces: "",
    destination: "",
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
        quantity:
          initialData.quantity ||
          initialData.qty ||
          initialData.availableQty ||
          initialData.available_qty ||
          initialData.requestedQty ||
          initialData.requested_qty ||
          initialData.receivedQty ||
          initialData.received_qty ||
          initialData.pieces ||
          "",
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
        labelType: initialData.labelType || initialData.label_type || "inventory",
        netWeight: initialData.netWeight || initialData.net_weight || "",
        dimensions: initialData.dimensions || "",
        crateNumber: initialData.crateNumber || initialData.crate_number || "",
        projectNumber: initialData.projectNumber || initialData.project_number || "",
        destinationCountry:
          initialData.destinationCountry ||
          initialData.destination_country ||
          "",
        shipTo: initialData.shipTo || initialData.ship_to || "",
        jobNumber: initialData.jobNumber || initialData.job_number || "",
        soNumber: initialData.soNumber || initialData.so_number || "",
        carrier: initialData.carrier || "",
        trackingNumber:
          initialData.trackingNumber ||
          initialData.tracking_number ||
          "",
        pieces: initialData.pieces || "",
        destination: initialData.destination || "",
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

  const getLabelQuantity = () => {
    return (
      label.quantity ||
      label.qty ||
      label.availableQty ||
      label.available_qty ||
      label.requestedQty ||
      label.requested_qty ||
      label.receivedQty ||
      label.received_qty ||
      label.pieces ||
      ""
    );
  };

  const validateLabelQuantity = () => {
    const quantityValue = Number(getLabelQuantity() || 0);

    if (!quantityValue || quantityValue <= 0) {
      alert("Label quantity must be greater than zero. QTY 0 labels are not allowed.");
      setPrintStatus("Label blocked: QTY must be greater than zero.");
      return false;
    }

    return true;
  };

  const convertLogoToZplGraphic = () => {
    if (logoGraphicRef.current) {
      return Promise.resolve(logoGraphicRef.current);
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const targetWidth = 380;
        const targetHeight = 122;
        const canvas = document.createElement("canvas");

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        /*
          Zebra logo calibration:
          - The physical ZT411 output was clipping the left edge.
          - Moving ^FO alone did not visibly correct the logo enough because
            the rendered graphic is generated as one image block.
          - We shift the drawn logo inside the graphic canvas instead.
          - drawY is locked to 0 to remove the blank top space.
          - drawX = 14 corrects the remaining 1/4 inch right offset.
        */
        const drawHeight = 116;
        const drawWidth = 116;
        const drawX = 14;
        const drawY = 0;

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
    const quantity = truncate(getLabelQuantity(), 18);
    const descriptionLine1 = truncate(label.description, 42);
    const descriptionLine2 = truncate(String(label.description || "").slice(42), 42);
    const poNumber = truncate(label.poNumber, 28);
    const countryOfOrigin = truncate(label.countryOfOrigin, 28);
    const site = truncate(label.site, 18);
    const amTag = truncate(label.amTag, 28);
    const squareFeet = truncate(label.squareFeet, 18);
    const date = truncate(label.date, 18);
    const labelType = label.labelType || "inventory";
    const netWeight = truncate(label.netWeight, 22);
    const dimensions = truncate(label.dimensions, 24);
    const crateNumber = truncate(label.crateNumber, 22);
    const projectNumber = truncate(label.projectNumber, 22);
    const destinationCountry = truncate(label.destinationCountry, 24);
    const shipTo = truncate(label.shipTo, 34);
    const jobNumber = truncate(label.jobNumber, 24);
    const soNumber = truncate(label.soNumber, 24);
    const carrier = truncate(label.carrier, 24);
    const trackingNumber = truncate(label.trackingNumber, 34);
    const pieces = truncate(label.pieces, 18);
    // reserved for future Shipping Label destination field
    const printQty = Math.max(1, Number(labelPrintQty || 1));

    const isAmSite = site === "AM" || site === "A&M";
    const locationLabel = isAmSite ? "A&M TAG:" : "SITE:";
    const locationValue = isAmSite ? amTag || "N/A" : site || "INTRAL";

    const labelTitle =
      labelType === "am-crating"
        ? "A&M CRATING LABEL"
        : labelType === "shipping"
        ? "SHIPPING LABEL"
        : "INTRAL INVENTORY LABEL";

    const templateBlock =
      labelType === "am-crating"
        ? `
^FO45,463^A0N,26,26^FDNET WT:^FS
^FO205,463^A0N,26,26^FD${netWeight}^FS
^FO445,421^A0N,26,26^FDDIMS:^FS
^FO600,421^A0N,26,26^FD${dimensions}^FS
^FO445,463^A0N,26,26^FDCRATE #:^FS
^FO600,463^A0N,26,26^FD${crateNumber}^FS
^FO45,505^A0N,26,26^FDPROJECT:^FS
^FO205,505^A0N,26,26^FD${projectNumber}^FS
^FO445,505^A0N,26,26^FDDEST COO:^FS
^FO600,505^A0N,26,26^FD${destinationCountry}^FS
`
        : labelType === "shipping"
        ? `
^FO45,463^A0N,26,26^FDSHIP TO:^FS
^FO205,463^A0N,26,26^FD${shipTo}^FS
^FO45,505^A0N,26,26^FDJOB #:^FS
^FO205,505^A0N,26,26^FD${jobNumber}^FS
^FO445,421^A0N,26,26^FDSO #:^FS
^FO600,421^A0N,26,26^FD${soNumber}^FS
^FO445,463^A0N,26,26^FDCARRIER:^FS
^FO600,463^A0N,26,26^FD${carrier}^FS
^FO445,505^A0N,26,26^FDPIECES:^FS
^FO600,505^A0N,26,26^FD${pieces}^FS
`
        : "";

    const squareFeetBlock = squareFeet
      ? `
^FO505,505^A0N,34,34^FDSQ FT:^FS
^FO665,505^A0N,34,34^FD${squareFeet}^FS
`
      : "";

    const barcodeValue =
      labelType === "shipping"
        ? trackingNumber || soNumber || inventoryId
        : labelType === "am-crating"
        ? crateNumber || amTag || inventoryId
        : inventoryId;

    const logoZpl = logoGraphic
      ? `^FO38,38${logoGraphic.graphicCommand}^FS`
      : "^FO88,48^A0N,56,56^FDINTRAL^FS";

    return `
^XA
^CI28
^PW863
^LL820
^LH0,0

^FO18,18^GB827,790,4^FS

${logoZpl}
^FO310,44^A0N,42,42^FD${labelTitle}^FS
^FO310,94^A0N,30,30^FD3PL Warehouse Operations^FS
^FO38,160^GB785,5,5^FS

^FO45,178^A0N,35,35^FDPART #:^FS
^FO220,178^A0N,36,36^FD${partNumber}^FS

^FO45,228^A0N,35,35^FDDESC:^FS
^FO220,228^A0N,35,35^FD${descriptionLine1}^FS
^FO220,266^A0N,30,30^FD${descriptionLine2}^FS

^FO45,310^A0N,35,35^FDCUSTOMER:^FS
^FO260,310^A0N,34,34^FD${customer}^FS

^FO45,368^A0N,35,35^FDPO #:^FS
^FO220,368^A0N,34,34^FD${poNumber}^FS

^FO45,420^A0N,35,35^FDCOO:^FS
^FO220,420^A0N,36,36^FD${countryOfOrigin}^FS

^FO45,472^A0N,35,35^FDQTY:^FS
^FO220,472^A0N,38,38^FD${quantity}^FS

^FO505,368^A0N,35,35^FD${locationLabel}^FS
^FO665,368^A0N,36,36^FD${locationValue}^FS

${squareFeetBlock}
${templateBlock}
^FO38,548^GB785,5,5^FS

^FO45,578^A0N,39,39^FD${labelType === "shipping" ? "TRACK:" : labelType === "am-crating" ? "CRATE/INV:" : "INV ID:"}^FS
^FO220,578^A0N,41,41^FD${barcodeValue}^FS

^FO95,640^BY3,2,115
^BCN,115,Y,N,N
^FD${barcodeValue}^FS

^FO45,785^A0N,24,24^FDDATE: ${date}^FS
^FO560,785^A0N,24,24^FDLABEL: 4.25 x 4.25^FS

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
    const labelType = label.labelType || "inventory";
    const labelTitle =
      labelType === "am-crating"
        ? "A&M CRATING LABEL"
        : labelType === "shipping"
        ? "SHIPPING LABEL"
        : "INTRAL INVENTORY LABEL";
    const barcodeValue =
      labelType === "shipping"
        ? cleanZplText(label.trackingNumber || label.soNumber || label.inventoryId)
        : labelType === "am-crating"
        ? cleanZplText(label.crateNumber || label.amTag || label.inventoryId)
        : cleanZplText(label.inventoryId);

    const templatePreviewRows =
      labelType === "am-crating"
        ? `
              <p><strong>Net Wt:</strong> ${cleanZplText(label.netWeight)}</p>
              <p><strong>Dimensions:</strong> ${cleanZplText(label.dimensions)}</p>
              <p><strong>Crate #:</strong> ${cleanZplText(label.crateNumber)}</p>
              <p><strong>Project #:</strong> ${cleanZplText(label.projectNumber)}</p>
              <p><strong>Destination Country:</strong> ${cleanZplText(label.destinationCountry)}</p>
        `
        : labelType === "shipping"
        ? `
              <p><strong>Ship To:</strong> ${cleanZplText(label.shipTo)}</p>
              <p><strong>Job #:</strong> ${cleanZplText(label.jobNumber)}</p>
              <p><strong>SO #:</strong> ${cleanZplText(label.soNumber)}</p>
              <p><strong>Carrier:</strong> ${cleanZplText(label.carrier)}</p>
              <p><strong>Tracking:</strong> ${cleanZplText(label.trackingNumber)}</p>
              <p><strong>Pieces:</strong> ${cleanZplText(label.pieces)}</p>
              <p><strong>Destination:</strong> ${cleanZplText(label.destination)}</p>
        `
        : "";

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
                <h3>${labelTitle}</h3>
                <div class="subtitle">3PL Warehouse Operations</div>
              </div>
            </div>

            <div class="grid">
              <p><strong>Part #:</strong> ${cleanZplText(label.partNumber)}</p>
              <p><strong>Qty:</strong> ${cleanZplText(getLabelQuantity())}</p>
              <p><strong>Customer:</strong> ${cleanZplText(label.customer)}</p>
              <p><strong>PO #:</strong> ${cleanZplText(label.poNumber)}</p>
              <p><strong>COO:</strong> ${cleanZplText(label.countryOfOrigin)}</p>
              <p><strong>${isAmSite ? "A&M Tag:" : "Site:"}</strong> ${
                isAmSite ? cleanZplText(label.amTag) : cleanZplText(label.site)
              }</p>
              <p><strong>Sq Ft:</strong> ${cleanZplText(label.squareFeet)}</p>
              <p><strong>Date:</strong> ${cleanZplText(label.date)}</p>
              ${templatePreviewRows}
            </div>

            <p class="description"><strong>Description:</strong> ${cleanZplText(label.description)}</p>
            <p class="inventory-id"><strong>Inventory ID:</strong> ${cleanZplText(label.inventoryId)}</p>

            <div class="barcode">
              *${barcodeValue || "SCAN-ID"}*
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

    if (!validateLabelQuantity()) {
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

    if (!validateLabelQuantity()) {
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
      labelType: "inventory",
      netWeight: "",
      dimensions: "",
      crateNumber: "",
      projectNumber: "",
      destinationCountry: "",
      shipTo: "",
      jobNumber: "",
      soNumber: "",
      carrier: "",
      trackingNumber: "",
      pieces: "",
      destination: "",
    });
  };

  const isAmPreview = label.site === "AM" || label.site === "A&M";
  const previewBarcodeValue =
    label.labelType === "shipping"
      ? label.trackingNumber || label.soNumber || label.inventoryId
      : label.labelType === "am-crating"
      ? label.crateNumber || label.amTag || label.inventoryId
      : label.inventoryId;

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

      <div
        style={{
          background: "rgba(15, 23, 42, 0.82)",
          border: "1px solid rgba(96, 165, 250, 0.28)",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "12px",
        }}
      >
        <label
          style={{
            color: "#dbeafe",
            fontWeight: 900,
            display: "block",
            marginBottom: "6px",
          }}
        >
          Label Type
        </label>

        <select
          value={label.labelType}
          onChange={(e) => updateLabel("labelType", e.target.value)}
          style={{
            background: "#f8fafc",
            color: "#0f172a",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "9px",
            width: "100%",
            maxWidth: "360px",
            fontWeight: 800,
          }}
        >
          <option value="inventory">Inventory Label</option>
          <option value="am-crating">A&M Crating Label</option>
          <option value="shipping">Shipping Label</option>
        </select>

        {isReprintMode && (
          <p
            style={{
              color: "#cbd5e1",
              fontSize: "12px",
              margin: "7px 0 0",
              fontWeight: 700,
            }}
          >
            Reprint data is locked, but label template can be selected before printing.
          </p>
        )}
      </div>

      {Number(getLabelQuantity() || 0) <= 0 && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "8px 10px",
            borderRadius: "8px",
            marginBottom: "10px",
            fontWeight: "900",
            fontSize: "13px",
          }}
        >
          QTY must be greater than zero before previewing or printing a label.
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

          {label.labelType === "am-crating" && (
            <div className="grid">
              <div>
                <label>Net Weight</label>
                <input
                  value={label.netWeight}
                  onChange={(e) => updateLabel("netWeight", e.target.value)}
                  placeholder="Net Weight"
                />
              </div>

              <div>
                <label>Dimensions</label>
                <input
                  value={label.dimensions}
                  onChange={(e) => updateLabel("dimensions", e.target.value)}
                  placeholder="Dimensions"
                />
              </div>

              <div>
                <label>Crate Number</label>
                <input
                  value={label.crateNumber}
                  onChange={(e) => updateLabel("crateNumber", e.target.value)}
                  placeholder="Crate Number"
                />
              </div>

              <div>
                <label>Project Number</label>
                <input
                  value={label.projectNumber}
                  onChange={(e) => updateLabel("projectNumber", e.target.value)}
                  placeholder="Project Number"
                />
              </div>

              <div>
                <label>Destination Country</label>
                <input
                  value={label.destinationCountry}
                  onChange={(e) =>
                    updateLabel("destinationCountry", e.target.value)
                  }
                  placeholder="Destination Country"
                />
              </div>
            </div>
          )}

          {label.labelType === "shipping" && (
            <div className="grid">
              <div>
                <label>Ship To</label>
                <input
                  value={label.shipTo}
                  onChange={(e) => updateLabel("shipTo", e.target.value)}
                  placeholder="Ship To"
                />
              </div>

              <div>
                <label>Job Number</label>
                <input
                  value={label.jobNumber}
                  onChange={(e) => updateLabel("jobNumber", e.target.value)}
                  placeholder="Job Number"
                />
              </div>

              <div>
                <label>SO Number</label>
                <input
                  value={label.soNumber}
                  onChange={(e) => updateLabel("soNumber", e.target.value)}
                  placeholder="SO Number"
                />
              </div>

              <div>
                <label>Carrier</label>
                <input
                  value={label.carrier}
                  onChange={(e) => updateLabel("carrier", e.target.value)}
                  placeholder="Carrier"
                />
              </div>

              <div>
                <label>Tracking Number</label>
                <input
                  value={label.trackingNumber}
                  onChange={(e) =>
                    updateLabel("trackingNumber", e.target.value)
                  }
                  placeholder="Tracking Number"
                />
              </div>

              <div>
                <label>Pieces</label>
                <input
                  value={label.pieces}
                  onChange={(e) => updateLabel("pieces", e.target.value)}
                  placeholder="Pieces"
                />
              </div>

              <div>
                <label>Destination</label>
                <input
                  value={label.destination}
                  onChange={(e) => updateLabel("destination", e.target.value)}
                  placeholder="Destination"
                />
              </div>
            </div>
          )}

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
              {label.labelType === "am-crating"
                ? "A&M CRATING LABEL"
                : label.labelType === "shipping"
                ? "SHIPPING LABEL"
                : "INTRAL INVENTORY LABEL"}
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
            <strong>Qty:</strong> {getLabelQuantity()}
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

          {label.labelType === "am-crating" && (
            <>
              <p style={{ margin: "3px 0" }}>
                <strong>Net Wt:</strong> {label.netWeight}
              </p>
              <p style={{ margin: "3px 0" }}>
                <strong>Crate #:</strong> {label.crateNumber}
              </p>
              <p style={{ margin: "3px 0" }}>
                <strong>Project #:</strong> {label.projectNumber}
              </p>
              <p style={{ margin: "3px 0" }}>
                <strong>Dest COO:</strong> {label.destinationCountry}
              </p>
            </>
          )}

          {label.labelType === "shipping" && (
            <>
              <p style={{ margin: "3px 0" }}>
                <strong>Ship To:</strong> {label.shipTo}
              </p>
              <p style={{ margin: "3px 0" }}>
                <strong>SO #:</strong> {label.soNumber}
              </p>
              <p style={{ margin: "3px 0" }}>
                <strong>Carrier:</strong> {label.carrier}
              </p>
              <p style={{ margin: "3px 0" }}>
                <strong>Tracking:</strong> {label.trackingNumber}
              </p>
            </>
          )}
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
          *{previewBarcodeValue || "SCAN-ID"}*
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
