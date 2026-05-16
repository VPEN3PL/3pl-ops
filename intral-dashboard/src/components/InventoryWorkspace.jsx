import React from "react";
import InventoryAllocationWorkspace from "./InventoryAllocationWorkspace";

function InventoryWorkspace({ inventoryView = "dashboard" }) {
  const inventoryKpis = [
    {
      title: "Inventory Lines",
      value: "3",
      note: "Current demo inventory records",
    },
    {
      title: "Available Qty",
      value: "395",
      note: "Inventory available for use",
    },
    {
      title: "Allocated Qty",
      value: "35",
      note: "Reserved inventory quantity",
    },
    {
      title: "Sites",
      value: "3",
      note: "1K, 6K, and A&M",
    },
  ];

  const inventoryRows = [
    {
      id: "INV-1001",
      partNumber: "PN-45882",
      customer: "Gillette",
      qty: 120,
      allocated: 20,
      available: 100,
      site: "1K",
      location: "1K-22-A1",
      status: "Available",
    },
    {
      id: "INV-1002",
      partNumber: "PN-77811",
      customer: "Gillette",
      qty: 60,
      allocated: 15,
      available: 45,
      site: "A&M",
      location: "AM-14-C2",
      status: "Allocated",
    },
    {
      id: "INV-1003",
      partNumber: "PN-99021",
      customer: "P&G",
      qty: 250,
      allocated: 0,
      available: 250,
      site: "6K",
      location: "6K-88-D1",
      status: "Available",
    },
  ];

  if (inventoryView === "allocation") {
    return <InventoryAllocationWorkspace />;
  }

  if (inventoryView === "lookup") {
    return (
      <div className="inventory-subview">
        <div className="inventory-header-row">
          <div>
            <h1>Inventory Lookup</h1>

            <p>
              Search inventory by inventory ID, part number, customer,
              location, site, or status.
            </p>
          </div>
        </div>

        <div className="inventory-searchbar">
          <input placeholder="Inventory ID" />
          <input placeholder="Part Number" />
          <input placeholder="Customer" />
          <input placeholder="Site / Location" />

          <button>Search</button>
        </div>

        <div className="inventory-panel">
          <h2>Lookup Results</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Inventory ID</th>
                <th>Part #</th>
                <th>Customer</th>
                <th>Available</th>
                <th>Site</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {inventoryRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.partNumber}</td>
                  <td>{row.customer}</td>
                  <td>{row.available}</td>
                  <td>{row.site}</td>
                  <td>{row.location}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (inventoryView === "move") {
    return (
      <div className="inventory-subview">
        <div className="inventory-header-row">
          <div>
            <h1>Inventory Move</h1>

            <p>
              Move inventory between approved locations and staging areas.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Move Request</h2>

          <div className="inventory-form-grid">
            <input placeholder="Inventory ID" />
            <input placeholder="Move Qty" />
            <input placeholder="From Location" />
            <input placeholder="To Location" />

            <textarea rows="4" placeholder="Move Notes"></textarea>
          </div>

          <button className="inventory-primary-button">
            Submit Move
          </button>
        </div>
      </div>
    );
  }

  if (inventoryView === "history") {
    return (
      <div className="inventory-subview">
        <div className="inventory-header-row">
          <div>
            <h1>Transfer History</h1>

            <p>
              Historical movement, transfer, and allocation activity.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Recent Inventory Activity</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Inventory ID</th>
                <th>Action</th>
                <th>Qty</th>
                <th>From</th>
                <th>To</th>
                <th>User</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>05/15/2026</td>
                <td>INV-1002</td>
                <td>Allocated</td>
                <td>15</td>
                <td>AM-14-C2</td>
                <td>JOB-8821</td>
                <td>Admin</td>
              </tr>

              <tr>
                <td>05/14/2026</td>
                <td>INV-1001</td>
                <td>Moved</td>
                <td>20</td>
                <td>1K-20-A1</td>
                <td>1K-22-A1</td>
                <td>Manager</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-subview">
      <div className="inventory-header-row">
        <div>
          <h1>Inventory Workspace</h1>

          <p>
            Inventory visibility, movement, allocation, and transfer history.
          </p>
        </div>
      </div>

      <div className="inventory-kpi-grid">
        {inventoryKpis.map((kpi) => (
          <div key={kpi.title} className="inventory-kpi-card">
            <span>{kpi.title}</span>

            <h2>{kpi.value}</h2>

            <p>{kpi.note}</p>
          </div>
        ))}
      </div>

      <div className="inventory-panel">
        <h2>Inventory Snapshot</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Inventory ID</th>
              <th>Part #</th>
              <th>Customer</th>
              <th>Total Qty</th>
              <th>Allocated</th>
              <th>Available</th>
              <th>Site</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {inventoryRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.partNumber}</td>
                <td>{row.customer}</td>
                <td>{row.qty}</td>
                <td>{row.allocated}</td>
                <td>{row.available}</td>
                <td>{row.site}</td>
                <td>{row.location}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryWorkspace;
