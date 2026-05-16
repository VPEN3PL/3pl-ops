export const moduleActions = {
  receiving: [
    {
      label: "Receiving Dashboard",
      tab: "receiving",
    },
    {
      label: "Inbound",
      tab: "receiving-inbound",
    },
    {
      label: "Putaway",
      tab: "receiving-putaway",
    },
    {
      label: "Reprint Labels",
      tab: "receiving-reprint",
    },
    {
      label: "Dock Queue",
      tab: "receiving-dock",
    },
  ],

  inventory: [
    {
      label: "Inventory Dashboard",
      tab: "inventory",
    },
    {
      label: "Lookup",
      tab: "inventory-lookup",
    },
    {
      label: "Move",
      tab: "inventory-move",
    },
    {
      label: "Allocation",
      tab: "allocation",
    },
    {
      label: "Transfer History",
      tab: "inventory-history",
    },
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

  return null;
};