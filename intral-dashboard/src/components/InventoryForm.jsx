import React, { useState } from "react";

export default function InventoryForm({ onAddInventory }) {
  const [form, setForm] = useState({
    customer: "",
    requester: "",
    site: "",
    partNumber: "",
    description: "",
    quantity: "",
    uom: "EA",
    amTag: "",
    sqFt: "",
    locationDetail: "",
  });

  const isAM = form.site === "AM";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!form.customer || !form.requester || !form.site) {
      alert("Please fill required fields");
      return;
    }

    if (isAM && !form.amTag) {
      alert("A&M Tag is required for A&M inventory");
      return;
    }

      onAddInventory(form);

  alert("Inventory created");

    // Reset form
    setForm({
      customer: "",
      requester: "",
      site: "",
      partNumber: "",
      description: "",
      quantity: "",
      uom: "EA",
      amTag: "",
      sqFt: "",
      locationDetail: "",
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Create Inventory</h2>

      <form onSubmit={handleSubmit}>
        {/* Customer */}
        <input
          name="customer"
          placeholder="Customer"
          value={form.customer}
          onChange={handleChange}
          required
        />

        {/* Requester */}
        <input
          name="requester"
          placeholder="Requester"
          value={form.requester}
          onChange={handleChange}
          required
        />

        {/* Site */}
        <select name="site" value={form.site} onChange={handleChange} required>
          <option value="">Select Site</option>
          <option value="AM">A&M</option>
          <option value="INTRAL">Intral</option>
          <option value="CUSTOMER">Customer</option>
          <option value="TRANSIT">In Transit</option>
        </select>

        {/* A&M Fields */}
        {isAM && (
          <>
            <input
              name="amTag"
              placeholder="A&M Tag #"
              value={form.amTag}
              onChange={handleChange}
              required
            />

            <input
              name="sqFt"
              type="number"
              placeholder="Sq Ft"
              value={form.sqFt}
              onChange={handleChange}
            />
          </>
        )}

        {/* Location */}
        <input
          name="locationDetail"
          placeholder={
            isAM
              ? "Auto: A&M Tag used as location"
              : "Enter Rack / Bin / Area"
          }
          value={form.locationDetail}
          onChange={handleChange}
          disabled={isAM}
        />

        {/* Part Number */}
        <input
          name="partNumber"
          placeholder="Part Number"
          value={form.partNumber}
          onChange={handleChange}
        />

        {/* Description */}
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />

        {/* Quantity */}
        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />

        {/* UOM */}
        <select name="uom" value={form.uom} onChange={handleChange}>
          <option value="EA">Each</option>
          <option value="PLT">Pallet</option>
          <option value="BOX">Box</option>
        </select>

        <br /><br />

        <button type="submit">Create Inventory</button>
      </form>
    </div>
  );
}