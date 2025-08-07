import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  Milk,
  Edit,
  Trash2,
} from "lucide-react";
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
import { toast } from "react-toastify";

// Interface for milk purchase history
interface MilkPurchaseHistory {
  id: string;
  date: string;
  fatPercentage: number;
  quantity: number;
  ratePerLiter: number;
  totalAmount: number;
  paymentStatus: "paid" | "pending";
  paymentDate?: string;
}

// Interface for farmer based on API response
interface Farmer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dairyId: number;
  currentMonthMilkAmount?: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        const response = await apiCall(
          allRoutes.farmers.addFarmer,
          "post",
          {...data, password: data.phone}
        );
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

      {/* Farmers List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("farmers.loading")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers.map((farmer) => (
            <Card key={farmer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {farmer.name}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFarmer(farmer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
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
                    </AlertDialog>
                  </div>
                </CardTitle>
                <CardDescription>ID: {farmer.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {farmer.phone}
                  </div>
                  {farmer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {farmer.email}
                    </div>
                  )}
                  {farmer.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {farmer.address}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                    Current Month Amount:
                    </span>
                    <span className="font-medium">{farmer.currentMonthMilkAmount}</span>
                  </div>
                  {farmer.address && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Address:
                      </span>
                      <span className="text-sm">
                        {farmer.address}
                      </span>
                    </div>
                  )}
                  {farmer.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("farmers.createdAt")}:
                      </span>
                      <span className="text-sm">
                        {new Date(farmer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && farmers.length === 0 && (
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
