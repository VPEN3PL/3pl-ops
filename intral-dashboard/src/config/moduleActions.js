export const moduleActions = {
  receiving: [
    { label: "Receiving Dashboard", tab: "receiving" },
    { label: "Inbound", tab: "receiving-inbound" },
    { label: "Putaway", tab: "receiving-putaway" },
    { label: "Reprint Labels", tab: "receiving-reprint" },
    { label: "Dock Queue", tab: "receiving-dock" },
  ],

  inventory: [
    { label: "Inventory Dashboard", tab: "inventory" },
    { label: "Lookup", tab: "inventory-lookup" },
    { label: "Move", tab: "inventory-move" },
    { label: "Allocation", tab: "allocation" },
    { label: "Transfer History", tab: "inventory-history" },
  ],

  jobs: [
    {
      label: "Request",
      dropdown: true,
      items: [
        { label: "Movement", tab: "jobs-request-movement" },
        { label: "Shipping", tab: "jobs-request-shipping" },
        { label: "Logistics", tab: "jobs-request-logistics" },
      ],
    },
    { label: "Track Request", tab: "jobs-track" },
  ],

  orders: [
    { label: "Open Orders", tab: "orders-open" },
    { label: "Active Orders", tab: "orders-active" },
    { label: "Closed Orders", tab: "orders-closed" },
    { label: "Order Release", tab: "orders-release" },
  ],

  shipping: [
    { label: "Released Orders", tab: "shipping" },
    { label: "Started Orders", tab: "shipping-started" },
    { label: "Completed Orders", tab: "shipping-complete" },
  ],
};

export const getModuleKeyFromTab = (tab) => {
  if (
    tab === "receiving" ||
    tab === "receiving-inbound" ||
    tab === "receiving-putaway" ||
    tab === "receiving-reprint" ||
    tab === "receiving-dock"
  ) {
    return "receiving";
  }

  if (
    tab === "inventory" ||
    tab === "inventory-lookup" ||
    tab === "inventory-move" ||
    tab === "allocation" ||
    tab === "inventory-history"
  ) {
    return "inventory";
  }

  if (
    tab === "jobs" ||
    tab === "jobs-request-movement" ||
    tab === "jobs-request-shipping" ||
    tab === "jobs-request-logistics" ||
    tab === "jobs-track"
  ) {
    return "jobs";
  }

  if (
    tab === "orders" ||
    tab === "orders-open" ||
    tab === "orders-active" ||
    tab === "orders-closed" ||
    tab === "orders-release"
  ) {
    return "orders";
  }

  if (
    tab === "shipping" ||
    tab === "shipping-started" ||
    tab === "shipping-complete"
  ) {
    return "shipping";
  }

  return null;
};
