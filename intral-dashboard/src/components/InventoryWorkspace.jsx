import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import InventoryAllocationWorkspace from "./InventoryAllocationWorkspace";

function InventoryWorkspace({ inventoryView = "dashboard" }) {
  const [inventoryRows, setInventoryRows] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [message, setMessage] = useState("");

  const [filters, setFilters] = useState({
    inventoryId: "",
    partNumber: "",
    customer: "",
    location: "",
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const mapDbInventoryToUi = (row) => {
    return {
      id: row.inventory_id || "",
      receiptNumber: row.receipt_number || "",
      purchaseOrder: row.purchase_order || "",
      partNumber: row.part_number || "",
      customer: row.customer || row.vendor || "",
      vendor: row.vendor || "",
      description: row.description || "",
      qty: row.quantity || 0,
      allocated: 0,
      available: row.status === "Available" ? row.quantity || 0 : 0,
      site: row.warehouse_location || "",
      aisle: row.aisle_location || "",
      bin: row.bin_location || "",
      location: row.final_location || "",
      status: row.status || "Available",
      countryOfOrigin: row.country_of_origin || "",
      isAM: row.is_am || false,
      squareFeet: row.square_feet || "",
      tagNumber: row.tag_number || "",
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  };

  const loadInventory = async () => {
    setLoadingInventory(true);

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Inventory load error:", error.message);
      setMessage(`Inventory load error: ${error.message}`);
      setLoadingInventory(false);
      return;
    }

    setInventoryRows((data || []).map(mapDbInventoryToUi));
    setLoadingInventory(false);
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      inventoryId: "",
      partNumber: "",
      customer: "",
      location: "",
    });
  };

  const filteredInventoryRows = useMemo(() => {
    return inventoryRows.filter((row) => {
      const inventoryIdMatch = row.id
        .toLowerCase()
        .includes(filters.inventoryId.toLowerCase());

      const partNumberMatch = row.partNumber
        .toLowerCase()
        .includes(filters.partNumber.toLowerCase());

      const customerMatch = row.customer
        .toLowerCase()
        .includes(filters.customer.toLowerCase());

      const locationSearch = `${row.site} ${row.location} ${row.aisle} ${row.bin}`.toLowerCase();

      const locationMatch = locationSearch.includes(filters.location.toLowerCase());

      return inventoryIdMatch && partNumberMatch && customerMatch && locationMatch;
    });
  }, [inventoryRows, filters]);

  const totalLines = inventoryRows.length;

  const totalQty = inventoryRows.reduce((sum, row) => {
    return sum + Number(row.qty || 0);
  }, 0);

  const availableQty = inventoryRows.reduce((sum, row) => {
    return sum + Number(row.available || 0);
  }, 0);

  const uniqueSites = new Set(
    inventoryRows
      .map((row) => row.site)
      .filter((site) => site && site.trim())
  ).size;

  const inventoryKpis = [
    {
      title: "Inventory Lines",
      value: totalLines,
      note: "Live inventory records",
    },
    {
      title: "Available Qty",
      value: availableQty,
      note: "Inventory available for use",
    },
    {
      title: "Total Qty",
      value: totalQty,
      note: "Total quantity in inventory",
    },
    {
      title: "Sites",
      value: uniqueSites,
      note: "Active warehouse locations",
    },
  ];

  const renderInventoryTable = (rows, emptyMessage = "No inventory records found.") => {
    return (
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Inventory ID</th>
            <th>Receipt #</th>
            <th>Part #</th>
            <th>Customer</th>
            <th>Total Qty</th>
            <th>Available</th>
            <th>Site</th>
            <th>Location</th>
            <th>COO</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="10">{emptyMessage}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.receiptNumber || "-"}</td>
                <td>{row.partNumber}</td>
                <td>{row.customer}</td>
                <td>{row.qty}</td>
                <td>{row.available}</td>
                <td>{row.site}</td>
                <td>{row.location}</td>
                <td>{row.countryOfOrigin}</td>
                <td>{row.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

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
              Search live inventory by inventory ID, part number, customer,
              location, site, or status.
            </p>
          </div>
        </div>

        {message && <div className="dashboard-message">{message}</div>}

        <div className="inventory-searchbar">
          <input
            value={filters.inventoryId}
            onChange={(e) => updateFilter("inventoryId", e.target.value)}
            placeholder="Inventory ID"
          />

          <input
            value={filters.partNumber}
            onChange={(e) => updateFilter("partNumber", e.target.value)}
            placeholder="Part Number"
          />

          <input
            value={filters.customer}
            onChange={(e) => updateFilter("customer", e.target.value)}
            placeholder="Customer"
          />

          <input
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            placeholder="Site / Location"
          />

          <button onClick={loadInventory}>Refresh</button>
          <button onClick={clearFilters}>Clear</button>
        </div>

        <div className="inventory-panel">
          <h2>Lookup Results</h2>

          {loadingInventory ? (
            <p className="panel-note">Loading live inventory...</p>
          ) : (
            renderInventoryTable(filteredInventoryRows)
          )}
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
                <td>Live history pending</td>
                <td>-</td>
                <td>Coming soon</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
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
            Live inventory visibility, movement, allocation, and transfer
            history powered by putaway completion.
          </p>
        </div>

        <button className="inventory-primary-button" onClick={loadInventory}>
          Refresh Inventory
        </button>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

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

        {loadingInventory ? (
          <p className="panel-note">Loading live inventory...</p>
        ) : (
          renderInventoryTable(inventoryRows)
        )}
      </div>
    </div>
  );
}

export default InventoryWorkspace;
