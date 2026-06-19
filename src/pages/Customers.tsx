import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, MapPin, Milk, Edit, Trash2, CreditCard, Filter, X, User, History } from "lucide-react";
import { cn, getProfilePictureUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { ApiResponse } from "@/types/auth";
import { formatDisplayDate } from "@/lib/dateFormat";
import { toast } from "sonner";
import { PayFarmerDialog } from "@/components/payments/PayFarmerDialog";
import { FarmerPaymentHistoryDialog } from "@/components/payments/FarmerPaymentHistoryDialog";

// Interface for farmer based on API response
interface Farmer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dairyId: number;
  pendingPayment?: string;
  profilePicture?: string | null;
  profilePictureUrl?: string | null;
  user?: {
    profilePictureUrl?: string | null;
    profilePicture?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

function getFarmerProfilePicture(farmer: Farmer) {
  return getProfilePictureUrl(farmer);
}

function getFarmerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Farmer form schema based on API requirements
const farmerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
});

type FarmerFormData = z.infer<typeof farmerSchema>;

export default function Customers() {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFarmerForPayment, setSelectedFarmerForPayment] = useState<Farmer | null>(null);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [selectedFarmerForHistory, setSelectedFarmerForHistory] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FarmerFormData>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // Fetch farmers from API
  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const response = (await apiCall(
        allRoutes.farmers.getFarmers,
        "get"
      )) as ApiResponse<{ data: Farmer[] }>;
      if (response.success && response.data) {
        const farmersData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setFarmers(farmersData);
      } else {
        setFarmers([]);
      }
    } catch (error) {
      console.error("Failed to fetch farmers:", error);
      toast.error(t("farmers.failedToLoad"));
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load farmers data on component mount
  useEffect(() => {
    fetchFarmers();
  }, []);

  // Handle add/edit farmer
  const handleSubmitFarmer = async (data: FarmerFormData) => {
    setSubmitting(true);
    try {
      if (editingFarmer) {
        // Update existing farmer
        const response = await apiCall(
          allRoutes.farmers.updateFarmer(editingFarmer.id),
          "put",
          data
        );
        if (response.success) {
          toast.success(t("farmers.farmerUpdated"));
          setShowAddDialog(false);
          setEditingFarmer(null);
          reset();
          fetchFarmers(); // Refresh the list
        }
      } else {
        // Add new farmer
        console.log("dsdsd", data);
        const response = await apiCall(allRoutes.farmers.addFarmer, "post", {
          ...data,
          password: data.phone,
        });
        if (response.success) {
          toast.success(t("farmers.farmerAdded"));
          setShowAddDialog(false);
          reset();
          fetchFarmers(); // Refresh the list
        }
      }
    } catch (error) {
      console.error("Failed to save farmer:", error);
      toast.error(
        editingFarmer ? t("farmers.failedToUpdate") : t("farmers.failedToAdd")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit farmer
  const handleEditFarmer = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setValue("name", farmer.name);
    setValue("phone", farmer.phone);
    setShowAddDialog(true);
  };

  // Handle delete farmer
  const handleDeleteFarmer = async (farmerId: number) => {
    try {
      const response = await apiCall(
        allRoutes.farmers.delete(farmerId),
        "delete"
      );
      if (response.success) {
        toast.success(t("farmers.farmerDeleted"));
        fetchFarmers(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete farmer:", error);
      toast.error(t("farmers.failedToDelete"));
    }
  };

  // Reset form when dialog closes
  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingFarmer(null);
    reset();
  };

  const handlePayment = (farmer: Farmer) => {
    setSelectedFarmerForPayment(farmer);
    setShowPaymentDialog(true);
  };

  const handleViewPaymentHistory = (farmer: Farmer) => {
    setSelectedFarmerForHistory(farmer);
    setShowPaymentHistoryDialog(true);
  };

  const applyFilters = () => {
    setAppliedSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const filteredFarmers = farmers.filter((farmer) => {
    if (!appliedSearch) return true;
    const query = appliedSearch.toLowerCase();
    return (
      farmer.name.toLowerCase().includes(query) ||
      farmer.phone.includes(appliedSearch) ||
      (farmer.email?.toLowerCase().includes(query) ?? false)
    );
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("customers.title")}
          </h1>
          <p className="text-muted-foreground">
            Manage farmers and track milk collections
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("farmers.addFarmer")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("dairyListing.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="farmerSearch">{t("dairyListing.searchFarmers")}</Label>
              <Input
                id="farmerSearch"
                placeholder={t("dairyListing.searchFarmers")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyFilters();
                  }
                }}
              />
            </div>

            <div className="flex items-end gap-2 ">
              <Button onClick={applyFilters} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                {t("common.filter")}
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Farmer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFarmer ? t("farmers.editFarmer") : t("farmers.addFarmer")}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleSubmitFarmer)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("farmers.name")} *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={t("farmers.farmerName")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("farmers.phone")} *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder={t("farmers.phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="password">
                  {editingFarmer ? t("farmers.newPassword") + " (" + t("farmers.leaveBlankForCurrent") + ")" : t("farmers.password") + " *"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder={editingFarmer ? t("farmers.newPassword") : t("farmers.password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div> */}
              {/* <div className="space-y-2">
                <Label htmlFor="dairyId">{t("farmers.dairyId")} *</Label>
                <Input
                  id="dairyId"
                  type="number"
                  {...register("dairyId", { valueAsNumber: true })}
                  placeholder={t("farmers.dairyId")}
                />
                {errors.dairyId && (
                  <p className="text-sm text-destructive">
                    {errors.dairyId.message}
                  </p>
                )}
              </div> */}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                {t("farmers.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? t("farmers.saving")
                  : editingFarmer
                  ? t("farmers.update")
                  : t("farmers.addFarmer")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PayFarmerDialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          setShowPaymentDialog(open);
          if (!open) setSelectedFarmerForPayment(null);
        }}
        farmer={selectedFarmerForPayment}
        onPaymentSuccess={fetchFarmers}
      />

      <FarmerPaymentHistoryDialog
        open={showPaymentHistoryDialog}
        onOpenChange={(open) => {
          setShowPaymentHistoryDialog(open);
          if (!open) setSelectedFarmerForHistory(null);
        }}
        farmer={selectedFarmerForHistory}
      />

      {/* Farmers List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("farmers.loading")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFarmers.map((farmer) => {
            const pendingAmount = Number(farmer.pendingPayment) || 0;
            const hasPendingPayment = pendingAmount > 0;
            const profilePicture = getFarmerProfilePicture(farmer);

            return (
              <Card
                key={farmer.id}
                className="group border border-border/60 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200 overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-green-50 border border-green-100 ring-2 ring-green-100 flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt={farmer.name}
                          crossOrigin="anonymous"
                          className="h-full w-full object-cover"
                        />
                      ) : getFarmerInitials(farmer.name) ? (
                        <span className="text-primary font-semibold text-base">
                          {getFarmerInitials(farmer.name)}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-primary/70" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold leading-tight truncate">
                            {farmer.name}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className="mt-1.5 font-mono text-[11px] tracking-wide bg-muted/80"
                          >
                            FRM-{String(farmer.id).padStart(4, "0")}
                          </Badge>
                          {farmer.createdAt && (
                    <p className="text-xs text-muted-foreground text-center pt-0.5">
                      {t("farmers.memberSince")}: {formatDisplayDate(farmer.createdAt)}
                    </p>
                  )}
                        </div>

                        <div className="flex shrink-0 gap-0.5 opacity-90 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleEditFarmer(farmer)}
                            title={t("farmers.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleViewPaymentHistory(farmer)}
                            title={t("customers.paymentHistory")}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          {hasPendingPayment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                              onClick={() => handlePayment(farmer)}
                              title={t("payments.payFarmer")}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                title={t("farmers.delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("farmers.deleteConfirm")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("farmers.deleteDescription")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("farmers.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFarmer(farmer.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("farmers.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-sm min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm">
                        <Phone className="h-4 w-4 text-primary" />
                      </span>
                      <span className="truncate font-medium">{farmer.phone}</span>
                    </div>

                    <div
                      className={cn(
                        "flex flex-col justify-center rounded-lg border px-3 py-2.5 min-w-0",
                        hasPendingPayment
                          ? "border-amber-200/80 bg-amber-50/80"
                          : "border-green-200/80 bg-green-50/80"
                      )}
                    >
                      <p className="text-xs text-muted-foreground truncate">
                        {t("customers.pendingAmount")}
                      </p>
                      <p
                        className={cn(
                          "text-base font-semibold leading-tight truncate",
                          hasPendingPayment ? "text-amber-800" : "text-green-800"
                        )}
                      >
                        {formatCurrency(pendingAmount)}
                      </p>
                    </div>
                  </div>

                   

                  <div className="space-y-2">
                    {farmer.email && (
                      <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm">
                          <Mail className="h-4 w-4 text-primary" />
                        </span>
                        <span className="truncate">{farmer.email}</span>
                      </div>
                    )}

                    {farmer.address && (
                      <div className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                        </span>
                        <span className="line-clamp-2 leading-snug">{farmer.address}</span>
                      </div>
                    )}
                  </div>

                  
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredFarmers.length === 0 && (
        <div className="text-center py-8">
          <Milk className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t("farmers.noFarmers")}</p>
          <p className="text-sm text-muted-foreground">
            {t("farmers.noFarmersDescription")}
          </p>
        </div>
      )}
    </div>
  );
}
