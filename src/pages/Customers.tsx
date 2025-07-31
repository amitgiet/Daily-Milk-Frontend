import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, MapPin, CreditCard, CalendarIcon, Milk, DollarSign, TrendingUp, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";

// Interface for milk purchase history
interface MilkPurchaseHistory {
  id: string;
  date: string;
  fatPercentage: number;
  quantity: number;
  ratePerLiter: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending';
  paymentDate?: string;
}

// Interface for customer with milk history
interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  totalPurchases: number;
  totalAmount: number;
  pendingAmount: number;
  status: 'active' | 'inactive';
  lastPurchase: string;
  milkHistory: MilkPurchaseHistory[];
}

const initialCustomersData: Customer[] = [
  {
    id: "CUS-001",
    name: "Ram Singh",
    contact: "+91 98765 43220",
    email: "ram.singh@email.com",
    address: "Village: Ramgarh, District: Alwar, Rajasthan",
    totalPurchases: 45,
    totalAmount: 125000,
    pendingAmount: 2500,
    status: "active",
    lastPurchase: "2024-07-25",
    milkHistory: [
      {
        id: "MH-001",
        date: "2024-07-25",
        fatPercentage: 4.2,
        quantity: 15.5,
        ratePerLiter: 57,
        totalAmount: 883.5,
        paymentStatus: 'paid',
        paymentDate: "2024-07-25"
      },
      {
        id: "MH-002",
        date: "2024-07-24",
        fatPercentage: 3.8,
        quantity: 12.0,
        ratePerLiter: 53,
        totalAmount: 636.0,
        paymentStatus: 'paid',
        paymentDate: "2024-07-24"
      },
      {
        id: "MH-003",
        date: "2024-07-23",
        fatPercentage: 4.5,
        quantity: 18.0,
        ratePerLiter: 61,
        totalAmount: 1098.0,
        paymentStatus: 'pending'
      }
    ]
  },
  {
    id: "CUS-002",
    name: "Lakshmi Devi", 
    contact: "+91 98765 43221",
    email: "lakshmi.devi@email.com",
    address: "Village: Lakshmipura, District: Jaipur, Rajasthan",
    totalPurchases: 32,
    totalAmount: 89000,
    pendingAmount: 0,
    status: "active",
    lastPurchase: "2024-07-24",
    milkHistory: [
      {
        id: "MH-004",
        date: "2024-07-24",
        fatPercentage: 3.6,
        quantity: 10.5,
        ratePerLiter: 51,
        totalAmount: 535.5,
        paymentStatus: 'paid',
        paymentDate: "2024-07-24"
      },
      {
        id: "MH-005",
        date: "2024-07-23",
        fatPercentage: 4.0,
        quantity: 14.0,
        ratePerLiter: 55,
        totalAmount: 770.0,
        paymentStatus: 'paid',
        paymentDate: "2024-07-23"
      }
    ]
  },
  {
    id: "CUS-003",
    name: "Mohan Kumar",
    contact: "+91 98765 43222",
    email: "mohan.kumar@email.com",
    address: "Village: Mohanpur, District: Sikar, Rajasthan",
    totalPurchases: 28,
    totalAmount: 75000,
    pendingAmount: 1800,
    status: "active",
    lastPurchase: "2024-07-25",
    milkHistory: [
      {
        id: "MH-006",
        date: "2024-07-25",
        fatPercentage: 3.9,
        quantity: 11.0,
        ratePerLiter: 54,
        totalAmount: 594.0,
        paymentStatus: 'pending'
      },
      {
        id: "MH-007",
        date: "2024-07-24",
        fatPercentage: 4.1,
        quantity: 13.5,
        ratePerLiter: 56,
        totalAmount: 756.0,
        paymentStatus: 'paid',
        paymentDate: "2024-07-24"
      }
    ]
  }
];

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  contact: z.string().min(1, "Contact is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  totalPurchases: z.number().min(0, "Total purchases must be non-negative"),
  totalAmount: z.number().min(0, "Total amount must be non-negative"),
  pendingAmount: z.number().min(0, "Pending amount must be non-negative"),
  lastPurchase: z.date({
    message: "Last purchase date is required",
  }),
  status: z.enum(["active", "inactive"])
});
type CustomerFormData = z.infer<typeof customerSchema>;

export default function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomersData);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Example of using apiCall utility to fetch farmers
  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const response = await apiCall(allRoutes.farmers.getAll, 'get');
      if (response.success && response.data) {
        // Transform API data to match our Customer interface
        const transformedData = response.data.map((farmer: Record<string, unknown>) => ({
          id: farmer.id,
          name: farmer.name,
          contact: farmer.phone,
          email: farmer.email || '',
          address: farmer.address || '',
          totalPurchases: farmer.totalPurchases || 0,
          totalAmount: farmer.totalAmount || 0,
          pendingAmount: farmer.pendingAmount || 0,
          status: farmer.status || 'active',
          lastPurchase: farmer.lastPurchase || new Date().toISOString().split('T')[0],
          milkHistory: farmer.milkHistory || []
        }));
        setCustomers(transformedData);
      }
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load farmers data on component mount
  useEffect(() => {
    fetchFarmers();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      address: "",
      totalPurchases: 0,
      totalAmount: 0,
      pendingAmount: 0,
      lastPurchase: new Date(),
      status: "active"
    }
  });

  const selectedDate = watch("lastPurchase");

  const handleAddCustomer = (data: CustomerFormData) => {
    const newCustomer: Customer = {
      id: `CUS-${(customers.length + 1).toString().padStart(3, "0")}`,
      ...data,
      lastPurchase: format(data.lastPurchase, "yyyy-MM-dd"),
      milkHistory: []
    };
    setCustomers([newCustomer, ...customers]);
    setShowAddDialog(false);
    reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const calculateTotalLiters = (history: MilkPurchaseHistory[]) => {
    return history.reduce((sum, purchase) => sum + purchase.quantity, 0);
  };

  const calculateAverageFat = (history: MilkPurchaseHistory[]) => {
    if (history.length === 0) return 0;
    const totalFat = history.reduce((sum, purchase) => sum + purchase.fatPercentage, 0);
    return totalFat / history.length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('customers.title')}</h1>
          <p className="text-muted-foreground">Manage farmers and track milk purchases</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('customers.addCustomer')}
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('customers.addCustomer')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAddCustomer)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('customers.customerName')} *</Label>
                <Input id="name" {...register("name")} placeholder="Enter farmer name" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">{t('customers.phone')} *</Label>
                <Input id="contact" {...register("contact")} placeholder="Enter contact number" />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('customers.email')} *</Label>
                <Input id="email" {...register("email")} placeholder="Enter email" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('customers.address')} *</Label>
                <Input id="address" {...register("address")} placeholder="Enter address" />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPurchases">Total Purchases *</Label>
                <Input id="totalPurchases" type="number" min="0" step="1" {...register("totalPurchases", { valueAsNumber: true })} placeholder="Enter total purchases" />
                {errors.totalPurchases && <p className="text-sm text-destructive">{errors.totalPurchases.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount (₹) *</Label>
                <Input id="totalAmount" type="number" min="0" step="0.01" {...register("totalAmount", { valueAsNumber: true })} placeholder="Enter total amount" />
                {errors.totalAmount && <p className="text-sm text-destructive">{errors.totalAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pendingAmount">Pending Amount (₹) *</Label>
                <Input id="pendingAmount" type="number" min="0" step="0.01" {...register("pendingAmount", { valueAsNumber: true })} placeholder="Enter pending amount" />
                {errors.pendingAmount && <p className="text-sm text-destructive">{errors.pendingAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Last Purchase Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setValue("lastPurchase", date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.lastPurchase && <p className="text-sm text-destructive">{errors.lastPurchase.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select id="status" {...register("status")}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground w-full">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); reset(); }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-primary">
                {t('customers.addCustomer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Milk History Dialog */}
      <Dialog open={!!viewHistoryCustomer} onOpenChange={(open) => { if (!open) setViewHistoryCustomer(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Milk className="h-5 w-5" />
              Milk Purchase History - {viewHistoryCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewHistoryCustomer && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Milk className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                        <p className="text-2xl font-bold">{viewHistoryCustomer.totalPurchases}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">{formatCurrency(viewHistoryCustomer.totalAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Liters</p>
                        <p className="text-2xl font-bold">{calculateTotalLiters(viewHistoryCustomer.milkHistory).toFixed(1)} L</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <History className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Fat %</p>
                        <p className="text-2xl font-bold">{calculateAverageFat(viewHistoryCustomer.milkHistory).toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Milk History Table */}
              {viewHistoryCustomer.milkHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fat %</TableHead>
                        <TableHead>Quantity (L)</TableHead>
                        <TableHead>Rate/Liter (₹)</TableHead>
                        <TableHead>Total Amount (₹)</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Payment Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewHistoryCustomer.milkHistory.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">{purchase.date}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{purchase.fatPercentage}%</Badge>
                          </TableCell>
                          <TableCell>{purchase.quantity.toFixed(1)} L</TableCell>
                          <TableCell>₹{purchase.ratePerLiter}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(purchase.totalAmount)}
                          </TableCell>
                          <TableCell>
                                                         <Badge variant={purchase.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                               {purchase.paymentStatus === 'paid' ? t('customers.paid') : t('customers.pending')}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {purchase.paymentDate || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Milk className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                     <p className="text-muted-foreground">{t('customers.noHistory')}</p>
                   <p className="text-sm text-muted-foreground">{t('customers.noHistoryDescription')}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setViewHistoryCustomer(null)}>
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {customer.name}
                <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                  {customer.status}
                </Badge>
              </CardTitle>
              <CardDescription>ID: {customer.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.contact}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {customer.address}
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('customers.totalPurchases')}:</span>
                  <span className="font-medium">{customer.totalPurchases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('customers.totalAmount')}:</span>
                  <span className="font-medium">{formatCurrency(customer.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('customers.pendingAmount')}:</span>
                  <span className={`font-medium ${customer.pendingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                    {formatCurrency(customer.pendingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('customers.lastPurchase')}:</span>
                  <span className="text-sm">{customer.lastPurchase}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => setViewHistoryCustomer(customer)}
                >
                                     <History className="h-4 w-4 mr-2" />
                   {t('customers.viewHistory')}
                </Button>
                <Button variant="ghost" size="sm">
                  <CreditCard className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}