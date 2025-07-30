import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  History,
  Settings,
  Calendar,
  Clock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory } from "@/hooks/useInventory";
import { Product } from "@/types/inventory";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductDeleteDialog } from "@/components/inventory/ProductDeleteDialog";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { StockHistoryDialog } from "@/components/inventory/StockHistoryDialog";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, parseISO, addDays } from "date-fns";


export default function Inventory() {
  const { t } = useTranslation();
  const { products, stockHistory, stats, categories, addProduct, updateProduct, deleteProduct, adjustStock } = useInventory();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    expiryStatus: "all",
    minQuantity: "",
    maxQuantity: ""
  });

  // Listen for dashboard navigation event to open add dialog
  useEffect(() => {
    const handleOpenAddDialog = () => {
      setShowProductForm(true);
    };

    window.addEventListener('openAddDialog', handleOpenAddDialog);
    
    return () => {
      window.removeEventListener('openAddDialog', handleOpenAddDialog);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <Badge className="bg-success text-success-foreground">{t('inventory.inStock')}</Badge>;
      case "low-stock":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">{t('inventory.lowStock')}</Badge>;
      case "out-of-stock":
        return <Badge variant="destructive">{t('inventory.outOfStock')}</Badge>;
      case "expired":
        return <Badge variant="destructive" className="bg-destructive/90">{t('inventory.expired')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);

    if (isBefore(expiry, now)) {
      return { status: "expired", color: "text-destructive", icon: <AlertTriangle className="h-4 w-4" /> };
    } else if (isBefore(expiry, threeDaysFromNow)) {
      return { status: "expiring-soon", color: "text-warning", icon: <Clock className="h-4 w-4" /> };
    }
    return { status: "fresh", color: "text-muted-foreground", icon: <Calendar className="h-4 w-4" /> };
  };

  const handleAddProduct = (productData: Omit<Product, "id" | "status" | "createdAt" | "updatedAt">) => {
    addProduct(productData);
    setShowProductForm(false);
    toast({
      title: "Product Added",
      description: `${productData.name} has been added to inventory.`,
    });
  };

  const handleUpdateProduct = (productData: Omit<Product, "id" | "status" | "createdAt" | "updatedAt">) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
      toast({
        title: "Product Updated",
        description: `${productData.name} has been updated.`,
      });
    }
  };

  const handleDeleteProduct = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      toast({
        title: "Product Deleted",
        description: `${deletingProduct.name} has been removed from inventory.`,
        variant: "destructive",
      });
    }
  };

  const handleStockAdjustment = (newQuantity: number, reason: string) => {
    if (adjustingProduct) {
      adjustStock(adjustingProduct.id, newQuantity, reason);
      setAdjustingProduct(null);
      toast({
        title: "Stock Adjusted",
        description: `Stock for ${adjustingProduct.name} has been updated.`,
      });
    }
  };

  const filteredData = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    // Apply additional filters
    const matchesStatus = filters.status === "all" || item.status === filters.status;

    
    const matchesQuantity = (!filters.minQuantity || item.quantity >= parseInt(filters.minQuantity)) &&
                           (!filters.maxQuantity || item.quantity <= parseInt(filters.maxQuantity));
    
    let matchesExpiryStatus = true;
    if (filters.expiryStatus !== "all") {
      const expiryStatus = getExpiryStatus(item.expiryDate).status;
      matchesExpiryStatus = expiryStatus === filters.expiryStatus;
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesQuantity && matchesExpiryStatus;
  });

  const allCategories = ["all", ...categories];


  const resetFilters = () => {
    setFilters({
      status: "all",
      expiryStatus: "all",
      minQuantity: "",
      maxQuantity: ""
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== "all" && value !== "").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.description')}</p>
        </div>
        <Button onClick={() => setShowProductForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          {t('inventory.addProduct')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.totalProducts')}</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.inStock')}</p>
                <p className="text-2xl font-bold text-success">{stats.inStock}</p>
              </div>
              <Package className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.lowStock')}</p>
                <p className="text-2xl font-bold text-warning">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.outOfStock')}</p>
                <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
              </div>
              <Package className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.expired')}</p>
                <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.expiringSoon')}</p>
                <p className="text-2xl font-bold text-warning">{stats.expiringSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.productInventory')}</CardTitle>
          <CardDescription>{t('inventory.viewManageProducts')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('inventory.searchProducts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                {allCategories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? t('inventory.allCategories') : category}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={() => setShowFilterDialog(true)}>
                <Filter className="h-4 w-4 mr-2" />
                {t('inventory.filter')}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inventory.productId')}</TableHead>
                  <TableHead>{t('inventory.name')}</TableHead>
                  <TableHead>{t('inventory.category')}</TableHead>
                  <TableHead>{t('inventory.quantity')}</TableHead>
                  <TableHead>{t('inventory.minStock')}</TableHead>
                  <TableHead>{t('inventory.expiryDate')}</TableHead>

                  <TableHead>{t('inventory.price')}</TableHead>
                  <TableHead>{t('inventory.status')}</TableHead>
                  <TableHead>{t('inventory.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.quantity} {item.unit}</span>
                        {item.quantity <= item.minStock && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{format(parseISO(item.expiryDate), "MMM dd, yyyy")}</span>
                        {getExpiryStatus(item.expiryDate).icon}
                      </div>
                    </TableCell>

                    <TableCell>₹{item.price}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const productHistory = stockHistory.filter(h => h.productId === item.id);
                            setHistoryProduct(item);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setAdjustingProduct(item)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingProduct(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingProduct(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setShowProductForm(false);
          setEditingProduct(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('inventory.editProduct') : t('inventory.addNewProduct')}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct || undefined}
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ProductDeleteDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
      />

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        product={adjustingProduct}
        open={!!adjustingProduct}
        onOpenChange={(open) => !open && setAdjustingProduct(null)}
        onConfirm={handleStockAdjustment}
      />

      {/* Stock History Dialog */}
      <StockHistoryDialog
        productName={historyProduct?.name || ""}
        history={stockHistory.filter(h => h.productId === historyProduct?.id)}
        open={!!historyProduct}
        onOpenChange={(open) => !open && setHistoryProduct(null)}
      />

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('inventory.filterProducts')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('inventory.status')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">{t('inventory.allStatus')}</option>
                  <option value="in-stock">{t('inventory.inStock')}</option>
                  <option value="low-stock">{t('inventory.lowStock')}</option>
                  <option value="out-of-stock">{t('inventory.outOfStock')}</option>
                  <option value="expired">{t('inventory.expired')}</option>
                </select>
              </div>

              {/* Expiry Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('inventory.expiryStatus')}</label>
                <select
                  value={filters.expiryStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, expiryStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">{t('inventory.all')}</option>
                  <option value="fresh">{t('inventory.fresh')}</option>
                  <option value="expiring-soon">{t('inventory.expiringSoon')}</option>
                  <option value="expired">{t('inventory.expired')}</option>
                </select>
              </div>



              {/* Quantity Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('inventory.quantityRange')}</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={t('inventory.min')}
                    value={filters.minQuantity}
                    onChange={(e) => setFilters(prev => ({ ...prev, minQuantity: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder={t('inventory.max')}
                    value={filters.maxQuantity}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxQuantity: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {activeFiltersCount > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{t('inventory.activeFilters')}:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.status !== "all" && (
                    <Badge variant="secondary">{t('inventory.status')}: {filters.status}</Badge>
                  )}
                  {filters.expiryStatus !== "all" && (
                    <Badge variant="secondary">{t('inventory.expiryStatus')}: {filters.expiryStatus}</Badge>
                  )}

                  {filters.minQuantity && (
                    <Badge variant="secondary">{t('inventory.minQty')}: {filters.minQuantity}</Badge>
                  )}
                  {filters.maxQuantity && (
                    <Badge variant="secondary">{t('inventory.maxQty')}: {filters.maxQuantity}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetFilters}>
                {t('inventory.resetFilters')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  {t('inventory.cancel')}
                </Button>
                <Button onClick={() => setShowFilterDialog(false)}>
                  {t('inventory.applyFilters')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}