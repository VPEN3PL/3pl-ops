import React from "react";

function ShippingOperationsWorkspace() {
  return (
    <div className="inventory-subview">
      <div className="inventory-header-row">
        <div>
          <h1>Shipping Operations</h1>

          <p>
            Execute released operational work orders, monitor status flow,
            and complete outbound or movement-related activities.
          </p>
        </div>
      </div>

      <div className="inventory-panel">
        <h2>Load Released Order</h2>

        <div className="inventory-form-grid">
          <input placeholder="Enter SO Number, example SO-000100" />
        </div>

        <button className="inventory-primary-button">
          Load Shipping Order
        </button>
      </div>

      <div className="inventory-panel">
        <h2>Released Orders</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>SO #</th>
              <th>JO #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Released By</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>SO-000100</td>
              <td>JO-000101</td>
              <td>P&G</td>
              <td>Released</td>
              <td>Manager</td>
            </tr>

            <tr>
              <td>SO-000101</td>
              <td>JO-000102</td>
              <td>Gillette</td>
              <td>Started</td>
              <td>Admin</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="inventory-panel">
        <h2>Execution Workflow</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Behavior</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Released</td>
              <td>Order available for execution</td>
            </tr>

            <tr>
              <td>Started</td>
              <td>Release action becomes locked</td>
            </tr>

            <tr>
              <td>Complete</td>
              <td>Workflow finalized and printable completion enabled</td>
            </tr>

            <tr>
              <td>Reopen</td>
              <td>Admin / Manager only</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ShippingOperationsWorkspace;