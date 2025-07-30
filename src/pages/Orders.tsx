import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, User, Calendar, CalendarIcon, Search, Filter, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const initialOrdersData = [
  {
    id: "ORD-001",
    customer: "Raj Dairy Store",
    date: "2024-07-25",
    items: "100L Milk, 5kg Paneer",
    total: 2500,
    status: "pending",
    deliveryDate: "2024-07-26"
  },
  {
    id: "ORD-002",
    customer: "Fresh Mart",
    date: "2024-07-24", 
    items: "50L Milk, 2kg Curd",
    total: 1400,
    status: "delivered",
    deliveryDate: "2024-07-25"
  },
  {
    id: "ORD-003",
    customer: "City Grocers",
    date: "2024-07-24",
    items: "200L Milk",
    total: 3000,
    status: "processing",
    deliveryDate: "2024-07-26"
  }
];

const orderSchema = z.object({
  customer: z.string().min(1, "Customer name is required"),
  date: z.date({ message: "Order date is required" }),
  items: z.string().min(1, "Items are required"),
  total: z.number().min(1, "Total must be greater than 0"),
  deliveryDate: z.date({ message: "Delivery date is required" }),
  status: z.enum(["pending", "processing", "delivered", "cancelled"])
});
type OrderFormData = z.infer<typeof orderSchema>;

export default function Orders() {
  const [orders, setOrders] = useState(initialOrdersData);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<typeof initialOrdersData[0] | null>(null);
  const [viewingOrder, setViewingOrder] = useState<typeof initialOrdersData[0] | null>(null);
  const [orderDateOpen, setOrderDateOpen] = useState(false);
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    dateRange: "",
    customer: "",
    minAmount: "",
    maxAmount: ""
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer: "",
      date: undefined,
      items: "",
      total: 0,
      deliveryDate: undefined,
      status: "pending"
    }
  });

  const selectedOrderDate = watch("date");
  const selectedDeliveryDate = watch("deliveryDate");

  const handleAddOrder = (data: OrderFormData) => {
    if (editingOrder) {
      // Update existing order
      const updatedOrders = orders.map(order => 
        order.id === editingOrder.id 
          ? {
              ...order,
              ...data,
              date: format(data.date, "yyyy-MM-dd"),
              deliveryDate: format(data.deliveryDate, "yyyy-MM-dd")
            }
          : order
      );
      setOrders(updatedOrders);
    } else {
      // Add new order
      const newOrder = {
        id: `ORD-${(orders.length + 1).toString().padStart(3, "0")}`,
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
        deliveryDate: format(data.deliveryDate, "yyyy-MM-dd")
      };
      setOrders([newOrder, ...orders]);
    }
    setShowAddDialog(false);
    setEditingOrder(null);
    setOrderDateOpen(false);
    setDeliveryDateOpen(false);
    reset();
  };

  const handleEditOrder = (order: typeof initialOrdersData[0]) => {
    setEditingOrder(order);
    // Pre-fill form with existing order data
    setValue("customer", order.customer);
    setValue("date", new Date(order.date));
    setValue("items", order.items);
    setValue("total", order.total);
    setValue("deliveryDate", new Date(order.deliveryDate));
    setValue("status", order.status as "pending" | "processing" | "delivered" | "cancelled");
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingOrder(null);
    setOrderDateOpen(false);
    setDeliveryDateOpen(false);
    reset();
  };

  const handleViewOrder = (order: typeof initialOrdersData[0]) => {
    setViewingOrder(order);
  };

  // Filter and search functionality
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(order.status);

    // Customer filter
    const matchesCustomer = !filters.customer || 
      order.customer.toLowerCase().includes(filters.customer.toLowerCase());

    // Amount filter
    const matchesMinAmount = !filters.minAmount || order.total >= Number(filters.minAmount);
    const matchesMaxAmount = !filters.maxAmount || order.total <= Number(filters.maxAmount);

    // Date range filter
    const matchesDateRange = !filters.dateRange || (() => {
      const orderDate = new Date(order.date);
      const today = new Date();
      switch (filters.dateRange) {
        case "today":
          return orderDate.toDateString() === today.toDateString();
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesCustomer && 
           matchesMinAmount && matchesMaxAmount && matchesDateRange;
  });

  const handleApplyFilters = () => {
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      dateRange: "",
      customer: "",
      minAmount: "",
      maxAmount: ""
    });
  };

  const activeFiltersCount = [
    ...filters.status,
    filters.dateRange,
    filters.customer,
    filters.minAmount,
    filters.maxAmount
  ].filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "delivered":
        return <Badge className="bg-success text-success-foreground">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={(open) => { 
        if (!open) {
          handleCloseDialog();
        } else {
          setShowAddDialog(open);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Order" : "Add New Order"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAddOrder)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name *</Label>
                <Input id="customer" {...register("customer")} placeholder="Enter customer name" />
                {errors.customer && <p className="text-sm text-destructive">{errors.customer.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Order Date *</Label>
                <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedOrderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedOrderDate ? format(selectedOrderDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedOrderDate}
                      onSelect={(date) => {
                        if (date) {
                          setValue("date", date);
                          setOrderDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="items">Items *</Label>
                <Input id="items" {...register("items")} placeholder="e.g. 100L Milk, 5kg Paneer" />
                {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total (₹) *</Label>
                <Input id="total" type="number" min="1" step="0.01" {...register("total", { valueAsNumber: true })} placeholder="Enter total amount" />
                {errors.total && <p className="text-sm text-destructive">{errors.total.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDeliveryDate ? format(selectedDeliveryDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDeliveryDate}
                      onSelect={(date) => {
                        if (date) {
                          setValue("deliveryDate", date);
                          setDeliveryDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.deliveryDate && <p className="text-sm text-destructive">{errors.deliveryDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select id="status" {...register("status")}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground w-full">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                {editingOrder ? "Update Order" : "Add Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => { if (!open) setViewingOrder(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {viewingOrder?.id}</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                    <p className="text-base font-medium">{viewingOrder.customer}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Date</h3>
                    <p className="text-base">{viewingOrder.date}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Delivery Date</h3>
                    <p className="text-base">{viewingOrder.deliveryDate}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    {getStatusBadge(viewingOrder.status)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h3>
                    <p className="text-base font-semibold text-primary">₹{viewingOrder.total}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Items Ordered</h3>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-base">{viewingOrder.items}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setViewingOrder(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewingOrder(null);
                  handleEditOrder(viewingOrder);
                }}>
                  Edit Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {filteredOrders.filter(order => order.status === "pending").length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-info">
                  {filteredOrders.filter(order => order.status === "processing").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-success">
                  {filteredOrders.filter(order => order.status === "delivered").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                  {["pending", "processing", "delivered", "cancelled"].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters(prev => ({
                              ...prev,
                              status: [...prev.status, status]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              status: prev.status.filter(s => s !== status)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={status} className="capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Customer</Label>
                <Input
                  value={filters.customer}
                  onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                  placeholder="Filter by customer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Min Amount</Label>
                  <Input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    placeholder="₹0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Amount</Label>
                  <Input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    placeholder="₹10000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>View and manage all customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders by ID, customer, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilterDialog(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {order.customer}
                      </div>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell className="font-medium">₹{order.total}</TableCell>
                    <TableCell>{order.deliveryDate}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}