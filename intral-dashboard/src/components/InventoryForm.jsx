import React, { useState } from "react";

function InventoryForm({ onAddInventory }) {
  const [form, setForm] = useState({
    customer: "",
    partNumber: "",
    description: "",
    quantity: "",
    poNumber: "",
    countryOfOrigin: "",
    squareFeet: "",
    site: "INTRAL",
    locationDetail: "",
    amTag: "",
  });

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitInventory = () => {
    if (!form.customer.trim()) {
      alert("Customer is required.");
      return;
    }

    if (!form.partNumber.trim()) {
      alert("Part Number is required.");
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    if (form.site === "AM" && !form.amTag.trim()) {
      alert("A&M Tag is required when receiving inventory to A&M.");
      return;
    }

    if (form.site === "AM" && !form.squareFeet.trim()) {
      alert("Square Feet is required when receiving inventory to A&M.");
      return;
    }

    if (form.site !== "AM" && !form.locationDetail.trim()) {
      alert("Location is required when receiving inventory to INTRAL / Customer / Transit.");
      return;
    }

    onAddInventory({
      customer: form.customer.trim(),
      partNumber: form.partNumber.trim(),
      description: form.description.trim(),
      quantity: Number(form.quantity || 0),
      poNumber: form.poNumber.trim(),
      countryOfOrigin: form.countryOfOrigin.trim(),
      squareFeet: form.squareFeet.trim(),
      site: form.site,
      locationDetail: form.site === "AM" ? "" : form.locationDetail.trim(),
      amTag: form.site === "AM" ? form.amTag.trim() : "",
    });

    setForm({
      customer: "",
      partNumber: "",
      description: "",
      quantity: "",
      poNumber: "",
      countryOfOrigin: "",
      squareFeet: "",
      site: "INTRAL",
      locationDetail: "",
      amTag: "",
    });
  };

  return (
    <div>
      <div className="grid">
        <div>
          <label>Customer</label>
          <input
            value={form.customer}
            onChange={(e) => updateForm("customer", e.target.value)}
            placeholder="Customer"
          />
        </div>

        <div>
          <label>Part Number</label>
          <input
            value={form.partNumber}
            onChange={(e) => updateForm("partNumber", e.target.value)}
            placeholder="Part Number"
          />
        </div>

        <div>
          <label>Quantity</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => updateForm("quantity", e.target.value)}
            placeholder="Quantity"
          />
        </div>

        <div>
          <label>PO Number</label>
          <input
            value={form.poNumber}
            onChange={(e) => updateForm("poNumber", e.target.value)}
            placeholder="PO Number"
          />
        </div>

        <div>
          <label>COO / Country of Origin</label>
          <input
            value={form.countryOfOrigin}
            onChange={(e) => updateForm("countryOfOrigin", e.target.value)}
            placeholder="Country of Origin"
          />
        </div>

        <div>
          <label>Square Feet</label>
          <input
            value={form.squareFeet}
            onChange={(e) => updateForm("squareFeet", e.target.value)}
            placeholder={form.site === "AM" ? "Required for A&M" : "Square Feet"}
          />
        </div>

        <div>
          <label>Site</label>
          <select
            value={form.site}
            onChange={(e) => updateForm("site", e.target.value)}
          >
            <option value="INTRAL">INTRAL</option>
            <option value="AM">A&M</option>
            <option value="CUSTOMER">Customer</option>
            <option value="TRANSIT">In Transit</option>
          </select>
        </div>

        {form.site === "AM" ? (
          <div>
            <label>A&M Tag</label>
            <input
              value={form.amTag}
              onChange={(e) => updateForm("amTag", e.target.value)}
              placeholder="A&M Tag"
            />
          </div>
        ) : (
          <div>
            <label>Location / Rack / Bin / Area</label>
            <input
              value={form.locationDetail}
              onChange={(e) => updateForm("locationDetail", e.target.value)}
              placeholder="Location / Rack / Bin / Area"
            />
          </div>
        )}
      </div>

      <label>Description</label>
      <input
        value={form.description}
        onChange={(e) => updateForm("description", e.target.value)}
        placeholder="Description"
      />

      <button onClick={submitInventory}>Receive Inventory</button>
    </div>
  );
}

export default InventoryForm;
