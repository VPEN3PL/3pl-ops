import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import InventoryAllocationWorkspace from "./InventoryAllocationWorkspace";

function InventoryWorkspace({ inventoryView = "dashboard" }) {
  const [inventoryRows, setInventoryRows] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedSection, setExpandedSection] = useState("snapshot");

  const [filters, setFilters] = useState({
    inventoryId: "",
    partNumber: "",
    description: "",
    customer: "",
    location: "",
  });

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inventoryView === "lookup") setExpandedSection("lookup");
    if (inventoryView === "move") setExpandedSection("move");
    if (inventoryView === "history") setExpandedSection("history");
    if (inventoryView === "dashboard") setExpandedSection("snapshot");
  }, [inventoryView]);

  const mapDbInventoryToUi = (row) => ({
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
  });

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
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      inventoryId: "",
      partNumber: "",
      description: "",
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

      const descriptionMatch = String(row.description || "")
        .toLowerCase()
        .includes(filters.description.toLowerCase());

      const customerMatch = row.customer
        .toLowerCase()
        .includes(filters.customer.toLowerCase());

      const locationSearch = `${row.site} ${row.location} ${row.aisle} ${row.bin}`.toLowerCase();
      const locationMatch = locationSearch.includes(filters.location.toLowerCase());

      return (
        inventoryIdMatch &&
        partNumberMatch &&
        descriptionMatch &&
        customerMatch &&
        locationMatch
      );
    });
  }, [inventoryRows, filters]);

  const totalLines = inventoryRows.length;
  const totalQty = inventoryRows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const availableQty = inventoryRows.reduce((sum, row) => sum + Number(row.available || 0), 0);
  const uniqueSites = new Set(
    inventoryRows.map((row) => row.site).filter((site) => site && site.trim())
  ).size;

  const activeInventoryRows = inventoryRows.filter(
    (row) => String(row.status || "").toLowerCase() === "available"
  );

  const inventoryKpis = [
    { title: "Inventory Lines", value: totalLines, note: "Live inventory records" },
    { title: "Available Qty", value: availableQty, note: "Inventory available for use" },
    { title: "Total Qty", value: totalQty, note: "Total quantity in inventory" },
    { title: "Sites", value: uniqueSites, note: "Active warehouse locations" },
  ];

  const inventoryHealth =
    loadingInventory ? "Loading" : totalLines > 0 ? "Live" : "No Records";

  const toggleSection = (sectionKey) => {
    setExpandedSection((current) => (current === sectionKey ? "" : sectionKey));
  };

  const getSectionStatus = (sectionKey) => {
    if (sectionKey === "snapshot") return `${totalLines} Lines`;
    if (sectionKey === "lookup") return `${filteredInventoryRows.length} Results`;
    if (sectionKey === "move") return "Planning";
    if (sectionKey === "history") return "Pending";
    if (sectionKey === "governance") return `${uniqueSites} Sites`;
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

  const getShortInventoryId = (inventoryId) => {
    const value = String(inventoryId || "").trim();

    if (!value) return "-";
    if (value.length <= 16) return value;

    const firstSegmentMatch = value.match(/^INV-[^-]+/i);
    const firstSegment = firstSegmentMatch ? firstSegmentMatch[0] : value.slice(0, 8);
    const suffix = value.slice(-4);

    return `${firstSegment}...${suffix}`;
  };

  const renderInventoryTable = (rows, emptyMessage = "No inventory records found.") => (
    <table className="inventory-table inventory-workbench-table">
      <thead>
        <tr>
          <th>Inventory ID</th>
          <th>Receipt #</th>
          <th>Part #</th>
          <th>Description</th>
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
            <td colSpan="11">{emptyMessage}</td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id}>
              <td title={row.id}>{getShortInventoryId(row.id)}</td>
              <td>{row.receiptNumber || "-"}</td>
              <td>{row.partNumber}</td>
              <td title={row.description || ""}>{row.description || "-"}</td>
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

  const renderKpis = () => (
    <div className="inventory-kpi-grid inventory-workbench-kpi-grid">
      {inventoryKpis.map((kpi) => (
        <div key={kpi.title} className="inventory-kpi-card">
          <span>{kpi.title}</span>
          <h2>{kpi.value}</h2>
          <p>{kpi.note}</p>
        </div>
      ))}
    </div>
  );

  const renderSnapshotSection = () => (
    <div className="phase17-accordion-section">
      {renderAccordionHeader(
        "snapshot",
        "Live Inventory Snapshot",
        "Current inventory created from Receiving putaway"
      )}

      {expandedSection === "snapshot" && (
        <div className="phase17-accordion-body">
          {loadingInventory ? (
            <p className="panel-note">Loading live inventory...</p>
          ) : (
            renderInventoryTable(inventoryRows)
          )}
        </div>
      )}
    </div>
  );

  const renderLookupSection = () => (
    <div className="phase17-accordion-section">
      {renderAccordionHeader(
        "lookup",
        "Lookup & Search",
        "Search by inventory ID, part number, description, customer, site, or location"
      )}

      {expandedSection === "lookup" && (
        <div className="phase17-accordion-body">
          <div className="inventory-searchbar inventory-workbench-searchbar">
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
              value={filters.description}
              onChange={(e) => updateFilter("description", e.target.value)}
              placeholder="Description"
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

          {loadingInventory ? (
            <p className="panel-note">Loading live inventory...</p>
          ) : (
            renderInventoryTable(filteredInventoryRows)
          )}
        </div>
      )}
    </div>
  );

  const renderMoveSection = () => (
    <div className="phase17-accordion-section">
      {renderAccordionHeader(
        "move",
        "Inventory Movement",
        "Plan inventory movement between approved locations and staging areas"
      )}

      {expandedSection === "move" && (
        <div className="phase17-accordion-body">
          <div className="inventory-workbench-move-grid">
            <div>
              <div className="phase17-mini-table-header">
                <span>Live Inventory Source</span>
                <small>Use Lookup to confirm inventory first</small>
              </div>

              {loadingInventory ? (
                <p className="panel-note">Loading live inventory...</p>
              ) : (
                renderInventoryTable(
                  inventoryRows.slice(0, 6),
                  "No live inventory records available."
                )
              )}
            </div>

            <div className="inventory-workbench-move-card">
              <h3>Move Request</h3>

              <div className="inventory-form-grid inventory-workbench-form">
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
        </div>
      )}
    </div>
  );

  const renderHistorySection = () => (
    <div className="phase17-accordion-section">
      {renderAccordionHeader(
        "history",
        "Transfer History",
        "Historical movement, transfer, and allocation activity"
      )}

      {expandedSection === "history" && (
        <div className="phase17-accordion-body">
          <table className="inventory-table inventory-workbench-table">
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
      )}
    </div>
  );

  const renderGovernanceSection = () => (
    <div className="phase17-accordion-section">
      {renderAccordionHeader(
        "governance",
        "Location Governance",
        "Storage rules for bin, aisle, floor, and site control"
      )}

      {expandedSection === "governance" && (
        <div className="phase17-accordion-body">
          <div className="inventory-location-grid inventory-workbench-location-grid">
            <div>
              <span>Bin / Aisle</span>
              <strong>1K / 6K</strong>
            </div>

            <div>
              <span>Floor Only</span>
              <strong>Basement / A&M / DCIC / M-Building / 1L</strong>
            </div>

            <div>
              <span>Active Inventory</span>
              <strong>{activeInventoryRows.length}</strong>
            </div>

            <div>
              <span>Warehouse Sites</span>
              <strong>{uniqueSites}</strong>
            </div>
          </div>

          <div className="inventory-command-flow inventory-workbench-flow">
            <span>Receiving Putaway</span>
            <span>Live Inventory</span>
            <span>Lookup</span>
            <span>Move</span>
            <span>Allocate</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderSummary = () => (
    <aside className="phase17-smart-summary inventory-workbench-summary">
      <div className="job-request-summary-panel">
        <div className="job-summary-header">
          <span>Inventory Snapshot</span>
          <strong>{inventoryHealth}</strong>
        </div>

        <div className="job-summary-grid">
          <div>
            <span>Inventory Lines</span>
            <strong>{totalLines}</strong>
          </div>

          <div>
            <span>Available Qty</span>
            <strong>{availableQty}</strong>
          </div>

          <div>
            <span>Total Qty</span>
            <strong>{totalQty}</strong>
          </div>

          <div>
            <span>Active Sites</span>
            <strong>{uniqueSites}</strong>
          </div>

          <div>
            <span>Search Results</span>
            <strong>{filteredInventoryRows.length}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{loadingInventory ? "Loading" : "Ready"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="inventory-primary-button job-submit-button"
          onClick={loadInventory}
        >
          Refresh Inventory
        </button>

        <p className="job-summary-note">
          Inventory is powered by Receiving putaway and supports lookup,
          movement planning, allocation, and transfer history.
        </p>
      </div>
    </aside>
  );

  const getWorkbenchTitle = () => {
    if (inventoryView === "lookup") return "Inventory Lookup";
    if (inventoryView === "move") return "Inventory Move";
    if (inventoryView === "history") return "Transfer History";
    return "Inventory Workspace";
  };

  const renderWorkbenchSections = () => {
    if (inventoryView === "lookup") {
      return (
        <>
          {renderLookupSection()}
          {renderGovernanceSection()}
        </>
      );
    }

    if (inventoryView === "move") {
      return (
        <>
          {renderMoveSection()}
          {renderGovernanceSection()}
        </>
      );
    }

    if (inventoryView === "history") {
      return (
        <>
          {renderHistorySection()}
          {renderGovernanceSection()}
        </>
      );
    }

    return (
      <>
        {renderSnapshotSection()}
        {renderLookupSection()}
        {renderMoveSection()}
        {renderHistorySection()}
        {renderGovernanceSection()}
      </>
    );
  };

  if (inventoryView === "allocation") {
    return <InventoryAllocationWorkspace />;
  }

  return (
    <div className="inventory-subview inventory-transaction-workspace phase17-workbench-screen">
      <div className="inventory-header-row inventory-transaction-header">
        <div>
          <h1>{getWorkbenchTitle()}</h1>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}

      {inventoryView === "dashboard" && renderKpis()}

      <div className="phase17-smart-card-shell inventory-workbench-shell">
        <div className="phase17-smart-card">
          <div className="phase17-smart-card-header">
            <div>
              <span>Smart Inventory Command Card</span>
              <strong>{getWorkbenchTitle()}</strong>
              <p>Live inventory visibility, movement planning, allocation governance, and transfer history powered by Receiving putaway.</p>
            </div>

            <div className="phase17-progress">
              <span className={inventoryView === "dashboard" ? "active" : ""}>1 Snapshot</span>
              <span className={inventoryView === "lookup" ? "active" : ""}>2 Lookup</span>
              <span className={inventoryView === "move" ? "active" : ""}>3 Move</span>
              <span className={inventoryView === "history" ? "active" : ""}>4 History</span>
            </div>
          </div>

          <div className="phase17-smart-card-body">
            <div className="phase17-smart-sections">
              {renderWorkbenchSections()}
            </div>

            {renderSummary()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryWorkspace;
