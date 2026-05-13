import React, { useEffect, useMemo, useState } from "react";
import intralLogo from "../assets/intral-logo.jpg";

function clean(value) {
  return value || "N/A";
}

function makeSku({ customer, partNumber, date }) {
  const cust = (customer || "GEN").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const part = (partNumber || "PART").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const d = (date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const seq = String(Date.now()).slice(-4);

  return `${cust}-${part}-${d}-${seq}`;
}

function makeInventoryId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Date.now()).slice(-4);

  return `INV-${date}-${seq}`;
}

export default function LabelGenerator({ initialData }) {
  const [label, setLabel] = useState(
    initialData || {
      inventoryId: makeInventoryId(),
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
    }
  );

  useEffect(() => {
    if (initialData) {
      setLabel({
        inventoryId: initialData.inventoryId || makeInventoryId(),
        customer: initialData.customer || "",
        partNumber: initialData.partNumber || "",
        quantity: initialData.quantity || "",
        description: initialData.description || "",
        poNumber: initialData.poNumber || "",
        countryOfOrigin: initialData.countryOfOrigin || "",
        site: initialData.site || "INTRAL",
        amTag: initialData.amTag || "",
        squareFeet: initialData.squareFeet || "",
        date: initialData.date || new Date().toISOString().slice(0, 10),
      });
    }
  }, [initialData]);

  const operationalSku = useMemo(() => makeSku(label), [label]);

  const convertImageToZPL = async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = intralLogo;

      img.onerror = () => {
        alert("Logo failed to load.");
        resolve("");
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetWidth = 260;
        const targetHeight = 150;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const imgRatio = img.width / img.height;
        const boxRatio = targetWidth / targetHeight;

        let drawWidth;
        let drawHeight;
        let offsetX;
        let offsetY;

        if (imgRatio > boxRatio) {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgRatio;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgRatio;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight).data;

        const bytesPerRow = Math.ceil(targetWidth / 8);
        const totalBytes = bytesPerRow * targetHeight;

        let hex = "";

        for (let y = 0; y < targetHeight; y++) {
          for (let xByte = 0; xByte < bytesPerRow; xByte++) {
            let byte = 0;

            for (let bit = 0; bit < 8; bit++) {
              const x = xByte * 8 + bit;
              let pixelOn = 0;

              if (x < targetWidth) {
                const idx = (y * targetWidth + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];
                const avg = (r + g + b) / 3;

                pixelOn = avg < 150 ? 1 : 0;
              }

              byte = (byte << 1) | pixelOn;
            }

            hex += byte.toString(16).padStart(2, "0").toUpperCase();
          }
        }

        resolve(
          `^FO30,20^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}^FS`
        );
      };
    });
  };

  const zpl = useMemo(() => {
    const isAM = label.site === "AM";

    return `^XA
^PW812
^LL812
^CF0,26

^FO30,25^FDINTRAL 3PL^FS
^FO570,25^FDDATE: ${clean(label.date)}^FS

^FO30,70^GB750,3,3^FS

^CF0,36
^FO30,95^FDPART: ${clean(label.partNumber)}^FS

^CF0,26
^FO30,140^FDDESC: ${clean(label.description)}^FS

^CF0,38
^FO30,180^FDQTY: ${clean(label.quantity)}^FS

^CF0,24
^FO30,235^FDCUSTOMER: ${clean(label.customer)}^FS
^FO30,270^FDINV ID: ${clean(label.inventoryId)}^FS
^FO30,305^FDSKU: ${operationalSku}^FS
^FO30,340^FDPO: ${clean(label.poNumber)}^FS
^FO30,375^FDCOO: ${clean(label.countryOfOrigin)}^FS
^FO30,410^FDSITE: ${clean(label.site)}^FS

${isAM ? `^FO30,445^FDA&M TAG: ${clean(label.amTag)}^FS
^FO30,480^FDSQ FT: ${clean(label.squareFeet)}^FS` : ""}

^FO30,520^GB750,3,3^FS

^BY2,2,80
^FO80,550^BCN,80,Y,N,N
^FD${clean(label.inventoryId)}^FS

^BY2,2,70
^FO80,670^BCN,70,Y,N,N
^FD${operationalSku}^FS

^XZ`;
  }, [label, operationalSku]);

  const copyZpl = async () => {
    await navigator.clipboard.writeText(zpl);
    alert("ZPL label code copied.");
  };

  const downloadZpl = () => {
    const blob = new Blob([zpl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${operationalSku}.zpl`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const printToZebra = async () => {
    try {
      if (!("serial" in navigator)) {
        alert("Web Serial is not supported. Use Chrome or Edge.");
        return;
      }

      const logoZPL = await convertImageToZPL();
      const isAM = label.site === "AM";

      const finalZPL = `^XA
^PW812
^LL812

${logoZPL}

^CF0,26
^FO560,35^FDDATE: ${clean(label.date)}^FS

^FO30,185^GB750,3,3^FS

^CF0,36
^FO30,210^FDPART: ${clean(label.partNumber)}^FS

^CF0,25
^FO30,255^FDDESC: ${clean(label.description)}^FS

^CF0,38
^FO30,295^FDQTY: ${clean(label.quantity)}^FS

^CF0,23
^FO30,350^FDCUSTOMER: ${clean(label.customer)}^FS
^FO30,382^FDINV ID: ${clean(label.inventoryId)}^FS
^FO30,414^FDSKU: ${operationalSku}^FS
^FO30,446^FDPO: ${clean(label.poNumber)}^FS
^FO30,478^FDCOO: ${clean(label.countryOfOrigin)}^FS
^FO30,510^FDSITE: ${clean(label.site)}^FS

${isAM ? `^FO30,542^FDA&M TAG: ${clean(label.amTag)}^FS
^FO30,574^FDSQ FT: ${clean(label.squareFeet)}^FS` : ""}

^FO30,605^GB750,3,3^FS

^BY2,2,78
^FO80,630^BCN,78,Y,N,N
^FD${clean(label.inventoryId)}^FS

^BY2,2,65
^FO80,735^BCN,65,Y,N,N
^FD${operationalSku}^FS

^XZ`;

      const port = await navigator.serial.requestPort();

      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();

      await writer.write(encoder.encode(finalZPL));

      writer.releaseLock();
      await port.close();

      alert("Label sent to Zebra printer.");
    } catch (error) {
      alert("Print failed: " + error.message);
    }
  };

  return (
    <div className="card">
      <h2>Label Generator</h2>
      <p>Generate 4&quot; x 4&quot; Zebra ZT411 inventory labels.</p>

      <input
        placeholder="Inventory ID"
        value={label.inventoryId}
        onChange={(e) => setLabel({ ...label, inventoryId: e.target.value })}
      />

      <input
        placeholder="Customer"
        value={label.customer}
        onChange={(e) => setLabel({ ...label, customer: e.target.value })}
      />

      <input
        placeholder="Part Number"
        value={label.partNumber}
        onChange={(e) => setLabel({ ...label, partNumber: e.target.value })}
      />

      <input
        placeholder="Quantity"
        type="number"
        value={label.quantity}
        onChange={(e) => setLabel({ ...label, quantity: e.target.value })}
      />

      <input
        placeholder="Item Description"
        value={label.description}
        onChange={(e) => setLabel({ ...label, description: e.target.value })}
      />

      <input
        placeholder="PO Number / N/A"
        value={label.poNumber}
        onChange={(e) => setLabel({ ...label, poNumber: e.target.value })}
      />

      <input
        placeholder="Country of Origin"
        value={label.countryOfOrigin}
        onChange={(e) =>
          setLabel({ ...label, countryOfOrigin: e.target.value })
        }
      />

      <input
        type="date"
        value={label.date}
        onChange={(e) => setLabel({ ...label, date: e.target.value })}
      />

      <select
        value={label.site}
        onChange={(e) => setLabel({ ...label, site: e.target.value })}
      >
        <option value="INTRAL">INTRAL</option>
        <option value="AM">A&amp;M</option>
      </select>

      {label.site === "AM" && (
        <>
          <input
            placeholder="A&M Tag"
            value={label.amTag}
            onChange={(e) => setLabel({ ...label, amTag: e.target.value })}
          />

          <input
            placeholder="Square Feet"
            value={label.squareFeet}
            onChange={(e) =>
              setLabel({ ...label, squareFeet: e.target.value })
            }
          />
        </>
      )}

      <div className="card">
        <strong>Operational SKU:</strong>
        <p>{operationalSku}</p>
      </div>
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

  <p style={{ margin: "6px 0" }}>
    Label Size: 4.25 x 4.25
  </p>

  <p style={{ margin: "6px 0" }}>
    Click Print → select your local Zebra printer
  </p>
</div>

      <button onClick={copyZpl}>Copy ZPL</button>
      <button onClick={downloadZpl}>Download ZPL</button>
      <button onClick={printToZebra}>Print Label</button>

      <h3>ZPL Preview</h3>
      <textarea
        value={zpl}
        readOnly
        rows={18}
        style={{ width: "100%", fontFamily: "monospace" }}
      />
    </div>
  );
}