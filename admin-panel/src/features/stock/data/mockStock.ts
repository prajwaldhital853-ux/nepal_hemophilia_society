export const categories = ["All", "Clotting Factor", "Bypassing Agent", "Supportive", "Equipment"];

export const stockStatus = ["All", "In Stock", "Low Stock", "Out of Stock", "Expiring Soon"];

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Expiring Soon";
export type StockCategory = "Clotting Factor" | "Bypassing Agent" | "Supportive" | "Equipment";

export type StockItem = {
  id: string;
  name: string;
  category: StockCategory;
  batchNumber: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string;
  status: StockStatus;
  manufacturer: string;
  lastUpdated: string;
};

export const stockTotals = {
  All: 156,
  "Clotting Factor": 45,
  "Bypassing Agent": 18,
  Supportive: 62,
  Equipment: 31,
};

export const allStockItems: StockItem[] = [
  {
    id: "STK-001",
    name: "Factor VIII Concentrate",
    category: "Clotting Factor",
    batchNumber: "F8-2024-089",
    quantity: 8420,
    unit: "IU",
    location: "NHS Central Store",
    expiryDate: "Dec 2025",
    status: "In Stock",
    manufacturer: "BioPharm Ltd",
    lastUpdated: "May 16, 2025",
  },
  {
    id: "STK-002",
    name: "Factor IX Concentrate",
    category: "Clotting Factor",
    batchNumber: "F9-2024-045",
    quantity: 5160,
    unit: "IU",
    location: "NHS Central Store",
    expiryDate: "Jan 2026",
    status: "In Stock",
    manufacturer: "MedLife Corp",
    lastUpdated: "May 16, 2025",
  },
  {
    id: "STK-003",
    name: "Emicizumab",
    category: "Bypassing Agent",
    batchNumber: "EMI-2024-012",
    quantity: 180,
    unit: "mg",
    location: "NHS Central Store",
    expiryDate: "Aug 2025",
    status: "Low Stock",
    manufacturer: "BioPharm Ltd",
    lastUpdated: "May 15, 2025",
  },
  {
    id: "STK-004",
    name: "Tranexamic Acid",
    category: "Supportive",
    batchNumber: "TXA-2024-078",
    quantity: 2400,
    unit: "tablets",
    location: "NHS Central Store",
    expiryDate: "Nov 2025",
    status: "In Stock",
    manufacturer: "PharmaCare",
    lastUpdated: "May 14, 2025",
  },
  {
    id: "STK-005",
    name: "Desmopressin",
    category: "Supportive",
    batchNumber: "DDAVP-2024-034",
    quantity: 2400,
    unit: "mcg",
    location: "Bagmati Province Store",
    expiryDate: "Oct 2025",
    status: "In Stock",
    manufacturer: "MedLife Corp",
    lastUpdated: "May 13, 2025",
  },
  {
    id: "STK-006",
    name: "Factor VIIa Concentrate",
    category: "Bypassing Agent",
    batchNumber: "F7A-2024-021",
    quantity: 45,
    unit: "mg",
    location: "NHS Central Store",
    expiryDate: "Jun 2025",
    status: "Expiring Soon",
    manufacturer: "BioPharm Ltd",
    lastUpdated: "May 16, 2025",
  },
  {
    id: "STK-007",
    name: "Syringes (20ml)",
    category: "Equipment",
    batchNumber: "SYR-2024-156",
    quantity: 5000,
    unit: "pieces",
    location: "NHS Central Store",
    expiryDate: "Dec 2026",
    status: "In Stock",
    manufacturer: "MedEquip Co",
    lastUpdated: "May 12, 2025",
  },
  {
    id: "STK-008",
    name: "IV Sets",
    category: "Equipment",
    batchNumber: "IV-2024-092",
    quantity: 3200,
    unit: "sets",
    location: "Bagmati Province Store",
    expiryDate: "Sep 2026",
    status: "In Stock",
    manufacturer: "MedEquip Co",
    lastUpdated: "May 10, 2025",
  },
  {
    id: "STK-009",
    name: "Factor VIII (Prophylaxis)",
    category: "Clotting Factor",
    batchNumber: "F8P-2024-067",
    quantity: 120,
    unit: "IU",
    location: "Koshi Province Store",
    expiryDate: "Jul 2025",
    status: "Low Stock",
    manufacturer: "BioPharm Ltd",
    lastUpdated: "May 11, 2025",
  },
  {
    id: "STK-010",
    name: "Bandages & Dressings",
    category: "Supportive",
    batchNumber: "BD-2024-189",
    quantity: 0,
    unit: "packs",
    location: "Gandaki Province Store",
    expiryDate: "N/A",
    status: "Out of Stock",
    manufacturer: "MedSupply Inc",
    lastUpdated: "May 09, 2025",
  },
];

export const stockOverview = {
  totalItems: 156,
  totalValue: "NPR 42,580,000",
  lowStockItems: 12,
  expiringItems: 5,
  outOfStock: 3,
  locations: 8,
};

export const stockMovement = [
  { month: "Jan", in: 4200, out: 3800 },
  { month: "Feb", in: 3900, out: 4100 },
  { month: "Mar", in: 5200, out: 3900 },
  { month: "Apr", in: 4800, out: 4200 },
  { month: "May", in: 5400, out: 3700 },
];

export const categoryDistribution = [
  { name: "Clotting Factor", value: 45, color: "#2F6FED" },
  { name: "Bypassing Agent", value: 18, color: "#F59E0B" },
  { name: "Supportive", value: 62, color: "#22C55E" },
  { name: "Equipment", value: 31, color: "#8B5CF6" },
];

export const recentActivity = [
  { action: "Stock Added", item: "Factor VIII", quantity: "+500 IU", time: "2 hours ago", user: "Admin" },
  { action: "Stock Issued", item: "Tranexamic Acid", quantity: "-200 tablets", time: "5 hours ago", user: "Treatment Center 1" },
  { action: "Low Stock Alert", item: "Emicizumab", quantity: "180 mg", time: "1 day ago", user: "System" },
  { action: "Stock Added", item: "Syringes", quantity: "+1000 pieces", time: "2 days ago", user: "Admin" },
];
