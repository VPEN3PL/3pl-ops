export const moduleActions = {
  receiving: [
    { label: "Receiving Dashboard", tab: "receiving" },
    {
      label: "Action",
      dropdown: true,
      items: [
        { label: "Receiving", tab: "receiving-create" },
        { label: "Putaway", tab: "receiving-putaway" },
        { label: "Reprint Labels", tab: "receiving-reprint" },
      ],
    },
  ],

  inventory: [
    { label: "Inventory Dashboard", tab: "inventory" },
    {
      label: "Action",
      dropdown: true,
      items: [
        { label: "Lookup", tab: "inventory-lookup" },
        { label: "Move", tab: "inventory-move" },
        { label: "Allocation", tab: "allocation" },
        { label: "Transfer History", tab: "inventory-history" },
      ],
    },
  ],

  jobs: [
    { label: "Job Request Dashboard", tab: "jobs" },
    {
      label: "Request",
      dropdown: true,
      items: [
        { label: "Inventory Movement", tab: "jobs-request-movement" },
        { label: "Shipping", tab: "jobs-request-shipping" },
        { label: "Logistics Support", tab: "jobs-request-logistics" },
      ],
    },
    { label: "Track Request", tab: "jobs-track" },
  ],

  orders: [
    { label: "Order Central Dashboard", tab: "orders" },
    {
      label: "View Orders",
      dropdown: true,
      items: [
        { label: "Open Orders", tab: "orders-open" },
        { label: "Active Orders", tab: "orders-released" },
        { label: "Closed Orders", tab: "orders-closed" },
      ],
    },
    {
      label: "Action",
      dropdown: true,
      items: [
        { label: "View", tab: "orders-action-view" },
        { label: "Add Additional Work", tab: "orders-action-add-work" },
        { label: "Release", tab: "orders-action-release" },
      ],
    },
  ],

  shipping: [
    { label: "Shipping Dashboard", tab: "shipping-dashboard" },
    {
      label: "Action",
      dropdown: true,
      items: [
        { label: "Active Orders", tab: "shipping" },
        { label: "Started Orders", tab: "shipping-started" },
        { label: "Completed Orders", tab: "shipping-complete" },
      ],
    },
  ],
};

export const getModuleKeyFromTab = (tab) => {
  if (
    tab === "receiving" ||
    tab === "receiving-create" ||
    tab === "receiving-putaway" ||
    tab === "receiving-reprint"
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
    tab === "orders-released" ||
    tab === "orders-closed" ||
    tab === "orders-action-view" ||
    tab === "orders-action-add-work" ||
    tab === "orders-action-release"
  ) {
    return "orders";
  }

  if (
    tab === "shipping-dashboard" ||
    tab === "shipping" ||
    tab === "shipping-started" ||
    tab === "shipping-complete"
  ) {
    return "shipping";
  }

  return null;
};
