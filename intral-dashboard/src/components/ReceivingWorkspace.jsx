import React from "react";

function ReceivingWorkspace({ receivingView = "dashboard" }) {
  const inboundRows = [
    {
      trailer: "TR-10021",
      customer: "Gillette",
      status: "Docked",
      priority: "High",
      location: "Dock 3",
    },
    {
      trailer: "TR-10022",
      customer: "P&G",
      status: "Waiting",
      priority: "Medium",
      location: "Yard",
    },
    {
      trailer: "TR-10023",
      customer: "Gillette",
      status: "Receiving",
      priority: "High",
      location: "Dock 1",
    },
  ];

  const renderDashboard = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Receiving Workspace</h1>

            <p>
              Inbound operational visibility, receiving flow,
              putaway coordination, and dock management.
            </p>
          </div>
        </div>

        <div className="inventory-kpi-grid">
          <div className="inventory-kpi-card">
            <span>Inbound Trailers</span>
            <h2>12</h2>
            <p>Current inbound activity</p>
          </div>

          <div className="inventory-kpi-card">
            <span>Docked</span>
            <h2>5</h2>
            <p>Trailers at receiving docks</p>
          </div>

          <div className="inventory-kpi-card">
            <span>Putaway Queue</span>
            <h2>18</h2>
            <p>Pending inventory putaway tasks</p>
          </div>

          <div className="inventory-kpi-card">
            <span>Receiving Alerts</span>
            <h2>2</h2>
            <p>Priority inbound exceptions</p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Inbound Activity</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Trailer</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {inboundRows.map((row) => (
                <tr key={row.trailer}>
                  <td>{row.trailer}</td>
                  <td>{row.customer}</td>
                  <td>{row.status}</td>
                  <td>{row.priority}</td>
                  <td>{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInboundQueue = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Inbound Queue</h1>

            <p>
              Operational receiving queue and inbound trailer
              visibility.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Receiving Queue</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Trailer</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {inboundRows.map((row) => (
                <tr key={row.trailer}>
                  <td>{row.trailer}</td>
                  <td>{row.customer}</td>
                  <td>{row.status}</td>
                  <td>{row.priority}</td>
                  <td>{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPutaway = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Putaway Workspace</h1>

            <p>
              Coordinate inbound inventory movement into approved
              warehouse storage locations.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Putaway Assignment</h2>

          <div className="inventory-form-grid">
            <input placeholder="Inventory ID" />
            <input placeholder="Part Number" />
            <input placeholder="Receiving Location" />
            <input placeholder="Final Storage Location" />

            <textarea
              rows="4"
              placeholder="Putaway Notes"
            ></textarea>
          </div>

          <button className="inventory-primary-button">
            Confirm Putaway
          </button>
        </div>
      </div>
    );
  };

  const renderReprintLabels = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Reprint Labels</h1>

            <p>
              Reprint inventory labels, receiving labels, and
              operational warehouse labels.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Label Reprint</h2>

          <div className="inventory-form-grid">
            <input placeholder="Inventory ID" />
            <input placeholder="Part Number" />
            <input placeholder="Label Type" />
          </div>

          <button className="inventory-primary-button">
            Reprint Label
          </button>
        </div>
      </div>
    );
  };

  const renderDockQueue = () => {
    return (
      <div className="receiving-subview">
        <div className="receiving-header-row">
          <div>
            <h1>Dock Queue</h1>

            <p>
              Monitor dock usage, inbound trailer assignments,
              and receiving congestion.
            </p>
          </div>
        </div>

        <div className="inventory-panel">
          <h2>Dock Activity</h2>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Dock</th>
                <th>Trailer</th>
                <th>Status</th>
                <th>Customer</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Dock 1</td>
                <td>TR-10023</td>
                <td>Receiving</td>
                <td>Gillette</td>
              </tr>

              <tr>
                <td>Dock 3</td>
                <td>TR-10021</td>
                <td>Docked</td>
                <td>Gillette</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (receivingView === "inbound") {
    return renderInboundQueue();
  }

  if (receivingView === "putaway") {
    return renderPutaway();
  }

  if (receivingView === "reprint") {
    return renderReprintLabels();
  }

  if (receivingView === "dock") {
    return renderDockQueue();
  }

  return renderDashboard();
}

export default ReceivingWorkspace;