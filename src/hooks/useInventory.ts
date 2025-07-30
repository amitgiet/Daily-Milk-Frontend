import { useState, useCallback, useMemo } from "react";
import { Product, StockHistory, InventoryStats } from "@/types/inventory";
import { format, isBefore, addDays, parseISO } from "date-fns";

// Initial inventory data
const initialInventoryData: Product[] = [
  {
    id: "PRD-001",
    name: "Fresh Milk",
    category: "Milk",
    quantity: 500,
    unit: "Liters",
    minStock: 100,
    expiryDate: "2024-07-27",
    supplier: "Green Valley Farm",
    price: 45,
    status: "in-stock",
    createdAt: "2024-07-20T10:00:00Z",
    updatedAt: "2024-07-25T14:30:00Z"
  },
  {
    id: "PRD-002", 
    name: "Paneer",
    category: "Dairy Products",
    quantity: 8,
    unit: "kg",
    minStock: 10,
    expiryDate: "2024-07-26",
    supplier: "Fresh Dairy Co.",
    price: 400,
    status: "low-stock",
    createdAt: "2024-07-18T09:15:00Z",
    updatedAt: "2024-07-25T11:20:00Z"
  },
  {
    id: "PRD-003",
    name: "Curd",
    category: "Dairy Products", 
    quantity: 25,
    unit: "kg",
    minStock: 20,
    expiryDate: "2024-07-28",
    supplier: "Hill View Ranch",
    price: 80,
    status: "in-stock",
    createdAt: "2024-07-19T11:30:00Z",
    updatedAt: "2024-07-25T16:45:00Z"
  },
  {
    id: "PRD-004",
    name: "Ghee",
    category: "Dairy Products",
    quantity: 5,
    unit: "kg", 
    minStock: 15,
    expiryDate: "2024-08-15",
    supplier: "Pure Dairy",
    price: 500,
    status: "low-stock",
    createdAt: "2024-07-15T14:20:00Z",
    updatedAt: "2024-07-25T09:10:00Z"
  },
  {
    id: "PRD-005",
    name: "Butter",
    category: "Dairy Products",
    quantity: 0,
    unit: "kg",
    minStock: 5,
    expiryDate: "2024-07-30",
    supplier: "Fresh Dairy Co.",
    price: 450,
    status: "out-of-stock",
    createdAt: "2024-07-16T13:45:00Z",
    updatedAt: "2024-07-25T12:00:00Z"
  }
];

export function useInventory() {
  const [products, setProducts] = useState<Product[]>(initialInventoryData);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);

  const calculateProductStatus = useCallback((product: Product): Product["status"] => {
    if (product.quantity === 0) return "out-of-stock";
    
    // Check if expired
    if (isBefore(parseISO(product.expiryDate), new Date())) return "expired";
    
    // Check if low stock
    if (product.quantity <= product.minStock) return "low-stock";
    
    return "in-stock";
  }, []);

  const updateProductStatus = useCallback((product: Product): Product => {
    return {
      ...product,
      status: calculateProductStatus(product),
      updatedAt: new Date().toISOString()
    };
  }, [calculateProductStatus]);

  const addProduct = useCallback((productData: Omit<Product, "id" | "status" | "createdAt" | "updatedAt">) => {
    const newProduct: Product = {
      ...productData,
      id: `PRD-${String(Date.now()).slice(-6)}`,
      status: "in-stock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedProduct = updateProductStatus(newProduct);
    setProducts(prev => [...prev, updatedProduct]);

    // Add to stock history
    const historyEntry: StockHistory = {
      id: `HST-${Date.now()}`,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      type: "inflow",
      quantity: updatedProduct.quantity,
      previousQuantity: 0,
      newQuantity: updatedProduct.quantity,
      reason: "New product added",
      timestamp: new Date().toISOString()
    };
    setStockHistory(prev => [historyEntry, ...prev]);

    return updatedProduct;
  }, [updateProductStatus]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(product => {
        if (product.id === id) {
          const updatedProduct = updateProductStatus({
            ...product,
            ...updates
          });

          // Track quantity changes
          if (updates.quantity !== undefined && updates.quantity !== product.quantity) {
            const historyEntry: StockHistory = {
              id: `HST-${Date.now()}`,
              productId: id,
              productName: updatedProduct.name,
              type: updates.quantity > product.quantity ? "inflow" : "outflow",
              quantity: Math.abs(updates.quantity - product.quantity),
              previousQuantity: product.quantity,
              newQuantity: updates.quantity,
              reason: "Manual adjustment",
              timestamp: new Date().toISOString()
            };
            setStockHistory(prev => [historyEntry, ...prev]);
          }

          return updatedProduct;
        }
        return product;
      })
    );
  }, [updateProductStatus]);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    setStockHistory(prev => prev.filter(entry => entry.productId !== id));
  }, []);

  const adjustStock = useCallback((id: string, newQuantity: number, reason: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    updateProduct(id, { quantity: newQuantity });

    const historyEntry: StockHistory = {
      id: `HST-${Date.now()}`,
      productId: id,
      productName: product.name,
      type: "adjustment",
      quantity: Math.abs(newQuantity - product.quantity),
      previousQuantity: product.quantity,
      newQuantity,
      reason,
      timestamp: new Date().toISOString()
    };
    setStockHistory(prev => [historyEntry, ...prev]);
  }, [products, updateProduct]);

  const stats: InventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.status === "in-stock").length;
    const lowStock = products.filter(p => p.status === "low-stock").length;
    const outOfStock = products.filter(p => p.status === "out-of-stock").length;
    const expired = products.filter(p => p.status === "expired").length;
    
    // Products expiring in next 3 days
    const threeDaysFromNow = addDays(new Date(), 3);
    const expiringSoon = products.filter(p => 
      p.status !== "expired" && 
      isBefore(parseISO(p.expiryDate), threeDaysFromNow)
    ).length;

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      expired,
      expiringSoon
    };
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  return {
    products,
    stockHistory,
    stats,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock
  };
}