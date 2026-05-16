import React from "react";

function OrderCentralWorkspace() {
  return (
    <div className="inventory-subview">
      <div className="inventory-header-row">
        <div>
          <h1>Order Central</h1>

          <p>
            Review submitted job orders, add workloads, verify inventory
            allocation requirements, and release approved work into Shipping
            Operations.
          </p>
        </div>
      </div>

      <div className="inventory-panel">
        <h2>Order Release</h2>

        <div className="inventory-form-grid">
          <input placeholder="Enter JO Number, example JO-000100" />
        </div>

        <button className="inventory-primary-button">
          Load Job Order
        </button>
      </div>

      <div className="inventory-panel">
        <h2>Orders</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>JO #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Inventory Required</th>
              <th>Allocation Status</th>
              <th>Release Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>JO-000100</td>
              <td>Gillette</td>
              <td>Submitted</td>
              <td>Yes</td>
              <td>Pending Allocation</td>
              <td>Blocked</td>
            </tr>

            <tr>
              <td>JO-000101</td>
              <td>P&G</td>
              <td>Reviewed</td>
              <td>No</td>
              <td>Not Required</td>
              <td>Ready to Release</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="inventory-panel">
        <h2>Release Control Logic</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Condition</th>
              <th>System Action</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Inventory Required + Not Allocated</td>
              <td>Release blocked</td>
            </tr>

            <tr>
              <td>Inventory Required + Allocated</td>
              <td>Release allowed</td>
            </tr>

            <tr>
              <td>No Inventory Required</td>
              <td>Release allowed</td>
            </tr>

            <tr>
              <td>Release Approved</td>
              <td>SO number generated, example SO-000100</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderCentralWorkspace;