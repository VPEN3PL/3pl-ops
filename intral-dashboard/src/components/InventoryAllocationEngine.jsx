import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function InventoryAllocationEngine({ session, profile }) {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [allocationForm, setAllocationForm] = useState({
    jobId: "",
    inventoryDbId: "",
    allocateQty: "",
    notes: "",
  });

  const userRole = String(profile?.role || "").toLowerCase().trim();
  const canAllocate =
    userRole === "admin" || userRole === "manager" || userRole === "employee";

  const loadAllocationData = async () => {
    if (!canAllocate) {
      setMessage("You do not have permission to allocate inventory.");
      return;
    }

    setLoading(true);
    setMessage("Loading allocation data...");

    const [inventoryResult, jobsResult, allocationsResult] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("*")
        .neq("status", "Shipped")
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_allocations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    if (inventoryResult.error) {
      setMessage(`Inventory load failed: ${inventoryResult.error.message}`);
      setLoading(false);
      return;
    }

    if (jobsResult.error) {
      setMessage(`Jobs load failed: ${jobsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (allocationsResult.error) {
      setMessage(`Allocation load failed: ${allocationsResult.error.message}`);
      setLoading(false);
      return;
    }

    setInventoryItems(inventoryResult.data || []);
    setJobs(jobsResult.data || []);
    setAllocations(allocationsResult.data || []);
    setMessage("");
    setLoading(false);
  };

  useEffect(() => {
    if (canAllocate) {
      loadAllocationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAllocate]);

  useEffect(() => {
    if (!canAllocate) return;

    const channel = supabase
      .channel("realtime-inventory-allocations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_allocations" },
        () => {
          loadAllocationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAllocate]);

  const selectedJob = jobs.find((job) => job.id === allocationForm.jobId);
  const selectedInventory = inventoryItems.find(
    (item) => item.id === allocationForm.inventoryDbId
  );

  const availableInventory = useMemo(() => {
    return inventoryItems.filter((item) => Number(item.quantity || 0) > 0);
  }, [inventoryItems]);

  const filteredInventory = useMemo(() => {
    const cleanSearch = search.toLowerCase().trim();

    if (!cleanSearch) return availableInventory;

    return availableInventory.filter((item) => {
      return (
        String(item.inventory_id || "").toLowerCase().includes(cleanSearch) ||
        String(item.job_number || "").toLowerCase().includes(cleanSearch) ||
        String(item.customer || "").toLowerCase().includes(cleanSearch) ||
        String(item.part_number || "").toLowerCase().includes(cleanSearch) ||
        String(item.description || "").toLowerCase().includes(cleanSearch) ||
        String(item.site || "").toLowerCase().includes(cleanSearch) ||
        String(item.location_detail || "").toLowerCase().includes(cleanSearch) ||
        String(item.am_tag || "").toLowerCase().includes(cleanSearch)
      );
    });
  }, [availableInventory, search]);

  const activeAllocations = allocations.filter(
    (item) => item.status !== "Cancelled" && item.status !== "Completed"
  );

  const completedAllocations = allocations.filter(
    (item) => item.status === "Completed"
  );

  const cancelledAllocations = allocations.filter(
    (item) => item.status === "Cancelled"
  );

  const totalAllocatedQty = activeAllocations.reduce(
    (sum, item) => sum + Number(item.allocated_qty || 0),
    0
  );

  const formatDateTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const updateAllocationForm = (field, value) => {
    setAllocationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const createAllocation = async () => {
    if (!canAllocate) {
      alert("You do not have permission to allocate inventory.");
      return;
    }

    if (!selectedJob) {
      alert("Select a job.");
      return;
    }

    if (!selectedInventory) {
      alert("Select an inventory item.");
      return;
    }

    const allocateQty = Number(allocationForm.allocateQty);
    const availableQty = Number(selectedInventory.quantity || 0);

    if (!allocateQty || allocateQty <= 0) {
      alert("Allocation quantity must be greater than zero.");
      return;
    }

    if (allocateQty > availableQty) {
      alert("Allocation quantity cannot exceed available inventory quantity.");
      return;
    }

    const allocationSuffix = Date.now();
    const sourceInventoryId = selectedInventory.inventory_id || "";
    const allocatedInventoryId = `${sourceInventoryId}-ALLOC-${allocationSuffix}`;
    const remainingQty = availableQty - allocateQty;

    const confirmed = window.confirm(
      `Allocate ${allocateQty} unit(s) from ${sourceInventoryId} to Job ${selectedJob.job_number}?`
    );

    if (!confirmed) return;

    setLoading(true);

    const { data: allocationData, error: allocationError } = await supabase
      .from("inventory_allocations")
      .insert([
        {
          job_id: selectedJob.id,
          job_number: selectedJob.job_number || "",
          source_inventory_db_id: selectedInventory.id,
          source_inventory_id: sourceInventoryId,
          allocated_inventory_id: allocatedInventoryId,
          customer: selectedInventory.customer || "",
          part_number: selectedInventory.part_number || "",
          description: selectedInventory.description || "",
          allocated_qty: allocateQty,
          status: "Allocated",
          allocated_by: session?.user?.id || null,
          allocated_by_email: session?.user?.email || "",
          notes: allocationForm.notes || "",
        },
      ])
      .select()
      .single();

    if (allocationError) {
      setLoading(false);
      alert(`Allocation failed: ${allocationError.message}`);
      return;
    }

    const { error: inventoryError } = await supabase
      .from("inventory_items")
      .update({
        quantity: remainingQty,
        status: remainingQty === 0 ? "Fully Allocated" : "Available",
      })
      .eq("id", selectedInventory.id);

    if (inventoryError) {
      setLoading(false);
      alert(
        `Allocation record created, but inventory quantity update failed: ${inventoryError.message}`
      );
      return;
    }

    try {
      await supabase.from("audit_logs").insert([
        {
          user_id: session?.user?.id || null,
          user_email: session?.user?.email || "",
          user_role: profile?.role || "",
          action: "Inventory allocated",
          module: "Inventory Allocation",
          job_id: selectedJob.id,
          job_number: selectedJob.job_number || "",
          inventory_id: allocatedInventoryId,
          new_status: "Allocated",
          quantity: allocateQty,
          notes: `Allocated from ${sourceInventoryId}. ${allocationForm.notes || ""}`,
        },
      ]);
    } catch (error) {
      console.warn("Allocation audit failed:", error.message);
    }

    setAllocationForm({
      jobId: "",
      inventoryDbId: "",
      allocateQty: "",
      notes: "",
    });

    setAllocations((prev) => [allocationData, ...prev]);

    await loadAllocationData();

    alert("Inventory allocated successfully.");
    setLoading(false);
  };

  const cancelAllocation = async (allocation) => {
    if (!canAllocate) {
      alert("You do not have permission to cancel allocations.");
      return;
    }

    if (!allocation?.id) {
      alert("Allocation ID is missing.");
      return;
    }

    if (allocation.status === "Cancelled") {
      alert("This allocation is already cancelled.");
      return;
    }

    if (allocation.status === "Completed") {
      alert("Completed allocations cannot be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel allocation ${allocation.allocated_inventory_id} and restore ${allocation.allocated_qty} unit(s) to source inventory?`
    );

    if (!confirmed) return;

    setLoading(true);

    const sourceItem = inventoryItems.find(
      (item) => item.id === allocation.source_inventory_db_id
    );

    if (!sourceItem) {
      setLoading(false);
      alert("Source inventory item was not found. Cannot safely restore quantity.");
      return;
    }

    const restoredQty =
      Number(sourceItem.quantity || 0) + Number(allocation.allocated_qty || 0);

    const { error: allocationError } = await supabase
      .from("inventory_allocations")
      .update({
        status: "Cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", allocation.id);

    if (allocationError) {
      setLoading(false);
      alert(`Cancel allocation failed: ${allocationError.message}`);
      return;
    }

    const { error: inventoryError } = await supabase
      .from("inventory_items")
      .update({
        quantity: restoredQty,
        status: "Available",
      })
      .eq("id", allocation.source_inventory_db_id);

    if (inventoryError) {
      setLoading(false);
      alert(
        `Allocation cancelled, but inventory restore failed: ${inventoryError.message}`
      );
      return;
    }

    try {
      await supabase.from("audit_logs").insert([
        {
          user_id: session?.user?.id || null,
          user_email: session?.user?.email || "",
          user_role: profile?.role || "",
          action: "Inventory allocation cancelled",
          module: "Inventory Allocation",
          job_id: allocation.job_id || null,
          job_number: allocation.job_number || "",
          inventory_id: allocation.allocated_inventory_id || "",
          old_status: "Allocated",
          new_status: "Cancelled",
          quantity: allocation.allocated_qty || null,
          notes: `Restored quantity to ${allocation.source_inventory_id}`,
        },
      ]);
    } catch (error) {
      console.warn("Cancel allocation audit failed:", error.message);
    }

    await loadAllocationData();

    alert("Allocation cancelled and quantity restored.");
    setLoading(false);
  };

  const markAllocationComplete = async (allocation) => {
    if (!canAllocate) {
      alert("You do not have permission to complete allocations.");
      return;
    }

    if (!allocation?.id) {
      alert("Allocation ID is missing.");
      return;
    }

    if (allocation.status === "Cancelled") {
      alert("Cancelled allocations cannot be completed.");
      return;
    }

    const confirmed = window.confirm(
      `Mark allocation ${allocation.allocated_inventory_id} complete?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("inventory_allocations")
      .update({
        status: "Completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", allocation.id);

    if (error) {
      alert(`Complete allocation failed: ${error.message}`);
      return;
    }

    try {
      await supabase.from("audit_logs").insert([
        {
          user_id: session?.user?.id || null,
          user_email: session?.user?.email || "",
          user_role: profile?.role || "",
          action: "Inventory allocation completed",
          module: "Inventory Allocation",
          job_id: allocation.job_id || null,
          job_number: allocation.job_number || "",
          inventory_id: allocation.allocated_inventory_id || "",
          old_status: allocation.status || "",
          new_status: "Completed",
          quantity: allocation.allocated_qty || null,
          notes: "Allocation marked complete.",
        },
      ]);
    } catch (auditError) {
      console.warn("Complete allocation audit failed:", auditError.message);
    }

    await loadAllocationData();

    alert("Allocation marked complete.");
  };

  if (!canAllocate) {
    return (
      <div className="card">
        <h2>Inventory Allocation</h2>
        <p>You do not have permission to allocate inventory.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Phase 2A — Inventory Allocation Engine</h2>
        <p>
          Allocate available inventory to active jobs, reserve quantities, reduce
          available stock, and maintain allocation history.
        </p>

        <button onClick={loadAllocationData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Allocation Data"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "12px",
              fontWeight: "700",
              color: message.includes("failed") ? "#991b1b" : "#475569",
            }}
          >
            {message}
          </p>
        )}
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <h3>Available Inventory Lines</h3>
          <p>{availableInventory.length}</p>
        </div>

        <div className="kpi-card green">
          <h3>Active Jobs</h3>
          <p>{jobs.length}</p>
        </div>

        <div className="kpi-card orange">
          <h3>Active Allocations</h3>
          <p>{activeAllocations.length}</p>
        </div>

        <div className="kpi-card purple">
          <h3>Total Allocated Qty</h3>
          <p>{totalAllocatedQty}</p>
        </div>

        <div className="kpi-card red">
          <h3>Cancelled</h3>
          <p>{cancelledAllocations.length}</p>
        </div>
      </div>

      <div className="card">
        <h3>Create Inventory Allocation</h3>
        <p>
          Select an active job, select available inventory, then enter the
          quantity to reserve for that job.
        </p>

        <div className="grid">
          <div>
            <label>Active Job</label>
            <select
              value={allocationForm.jobId}
              onChange={(e) => updateAllocationForm("jobId", e.target.value)}
            >
              <option value="">Select Job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.job_number} | {job.requestor_name || "Unknown"} |{" "}
                  {job.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Search Inventory</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory, PN, customer, location"
            />
          </div>

          <div>
            <label>Available Inventory</label>
            <select
              value={allocationForm.inventoryDbId}
              onChange={(e) =>
                updateAllocationForm("inventoryDbId", e.target.value)
              }
            >
              <option value="">Select Inventory</option>
              {filteredInventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.inventory_id} | Qty: {item.quantity} |{" "}
                  {item.part_number || "No PN"} | {item.customer || "No Customer"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Allocate Qty</label>
            <input
              type="number"
              value={allocationForm.allocateQty}
              onChange={(e) =>
                updateAllocationForm("allocateQty", e.target.value)
              }
              placeholder="Quantity"
            />
          </div>
        </div>

        {selectedInventory && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "14px",
              marginTop: "14px",
            }}
          >
            <strong>Selected Inventory</strong>
            <p>
              <strong>ID:</strong> {selectedInventory.inventory_id} |{" "}
              <strong>Available Qty:</strong> {selectedInventory.quantity} |{" "}
              <strong>PN:</strong> {selectedInventory.part_number || "-"} |{" "}
              <strong>Customer:</strong> {selectedInventory.customer || "-"}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {selectedInventory.site === "AM"
                ? `A&M Tag: ${selectedInventory.am_tag || "-"}`
                : `${selectedInventory.site || "-"} / ${
                    selectedInventory.location_detail || "-"
                  }`}
            </p>
          </div>
        )}

        <label>Allocation Notes</label>
        <input
          value={allocationForm.notes}
          onChange={(e) => updateAllocationForm("notes", e.target.value)}
          placeholder="Optional allocation notes"
        />

        <button onClick={createAllocation} disabled={loading}>
          Create Allocation
        </button>
      </div>

      <div className="card">
        <h3>Active Allocation Queue</h3>

        {activeAllocations.length === 0 ? (
          <p>No active allocations found.</p>
        ) : (
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Allocated ID</th>
                  <th>Job #</th>
                  <th>Status</th>
                  <th>Source Inventory</th>
                  <th>Customer</th>
                  <th>Part #</th>
                  <th>Description</th>
                  <th>Allocated Qty</th>
                  <th>Allocated By</th>
                  <th>Created</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {activeAllocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td>{allocation.allocated_inventory_id}</td>
                    <td>{allocation.job_number}</td>
                    <td>
                      <strong>{allocation.status}</strong>
                    </td>
                    <td>{allocation.source_inventory_id}</td>
                    <td>{allocation.customer}</td>
                    <td>{allocation.part_number}</td>
                    <td>{allocation.description}</td>
                    <td>{allocation.allocated_qty}</td>
                    <td>{allocation.allocated_by_email}</td>
                    <td>{formatDateTime(allocation.created_at)}</td>
                    <td>{allocation.notes || "-"}</td>
                    <td>
                      <button onClick={() => markAllocationComplete(allocation)}>
                        Complete
                      </button>
                      <button
                        onClick={() => cancelAllocation(allocation)}
                        style={{
                          background: "#991b1b",
                          color: "white",
                          fontWeight: "800",
                        }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Allocation History</h3>

        {allocations.length === 0 ? (
          <p>No allocation history found.</p>
        ) : (
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Allocated ID</th>
                  <th>Job #</th>
                  <th>Status</th>
                  <th>Source Inventory</th>
                  <th>Part #</th>
                  <th>Qty</th>
                  <th>Created</th>
                  <th>Cancelled</th>
                  <th>Completed</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {allocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td>{allocation.allocated_inventory_id}</td>
                    <td>{allocation.job_number}</td>
                    <td>{allocation.status}</td>
                    <td>{allocation.source_inventory_id}</td>
                    <td>{allocation.part_number}</td>
                    <td>{allocation.allocated_qty}</td>
                    <td>{formatDateTime(allocation.created_at)}</td>
                    <td>{formatDateTime(allocation.cancelled_at)}</td>
                    <td>{formatDateTime(allocation.completed_at)}</td>
                    <td>{allocation.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {completedAllocations.length > 0 && (
          <p style={{ marginTop: "12px", color: "#475569", fontWeight: "700" }}>
            Completed allocations: {completedAllocations.length}
          </p>
        )}
      </div>
    </div>
  );
}

export default InventoryAllocationEngine;
