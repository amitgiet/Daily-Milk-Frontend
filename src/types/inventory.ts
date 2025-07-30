export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: "Liters" | "kg" | "Units";
  minStock: number;
  expiryDate: string;
  supplier: string;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  type: "inflow" | "outflow" | "adjustment";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expired: number;
  expiringSoon: number;
}