import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  Milk,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
  Printer,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for milk entry form
const milkEntrySchema = z.object({
  farmerName: z.string().min(1, "Farmer name is required"),
  fatPercentage: z
    .number()
    .min(0.1, "Fat percentage must be at least 0.1%")
    .max(10, "Fat percentage cannot exceed 10%"),
  quantity: z
    .number()
    .min(0.1, "Quantity must be at least 0.1 liters")
    .max(1000, "Quantity cannot exceed 1000 liters"),
  ratePerLiter: z.number().min(0, "Rate must be positive"),
  totalPrice: z.number().min(0, "Total price must be positive"),
});

type MilkEntryFormData = z.infer<typeof milkEntrySchema>;

// Interface for milk entry
interface MilkEntry {
  id: string;
  farmerName: string;
  fatPercentage: number;
  quantity: number;
  ratePerLiter: number;
  totalPrice: number;
  timestamp: Date;
}

// Mock farmers data
const mockFarmers = [
  "Ram Singh",
  "Lakshmi Devi",
  "Mohan Kumar",
  "Sita Ram",
  "Ganesh Prasad",
  "Radha Devi",
  "Hari Om",
  "Krishna Kumar",
  "Durga Devi",
  "Shiva Prasad",
];

// Fat percentage to rate mapping (₹ per liter)
const fatRateMapping: { [key: number]: number } = {
  3.0: 45,
  3.2: 47,
  3.4: 49,
  3.6: 51,
  3.8: 53,
  4.0: 55,
  4.2: 57,
  4.4: 59,
  4.6: 61,
  4.8: 63,
  5.0: 65,
  5.2: 67,
  5.4: 69,
  5.6: 71,
  5.8: 73,
  6.0: 75,
};

const MilkCollection: React.FC = () => {
  const { t } = useTranslation();
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MilkEntryFormData>({
    resolver: zodResolver(milkEntrySchema),
    defaultValues: {
      farmerName: "",
      fatPercentage: 3.8,
      quantity: 0,
      ratePerLiter: 53,
      totalPrice: 0,
    },
  });

  const watchedFatPercentage = watch("fatPercentage");
  const watchedQuantity = watch("quantity");
  const watchedRatePerLiter = watch("ratePerLiter");

  // Calculate rate based on fat percentage
  const calculateRateFromFat = (fatPercentage: number): number => {
    const fatRounded = Math.round(fatPercentage * 10) / 10;
    return fatRateMapping[fatRounded] || 53; // Default rate if not found
  };

  // Calculate total price
  const calculateTotalPrice = (quantity: number, rate: number): number => {
    return Math.round(quantity * rate * 100) / 100; // Round to 2 decimal places
  };

  // Update rate when fat percentage changes
  useEffect(() => {
    if (watchedFatPercentage > 0) {
      const newRate = calculateRateFromFat(watchedFatPercentage);
      setValue("ratePerLiter", newRate);
    }
  }, [watchedFatPercentage, setValue]);

  // Update total price when quantity or rate changes
  useEffect(() => {
    if (watchedQuantity > 0 && watchedRatePerLiter > 0) {
      const total = calculateTotalPrice(watchedQuantity, watchedRatePerLiter);
      setValue("totalPrice", total);
    }
  }, [watchedQuantity, watchedRatePerLiter, setValue]);

  const onSubmit = async (data: MilkEntryFormData) => {
    setIsSubmitting(true);

    try {
      const newEntry: MilkEntry = {
        id: editingEntry?.id || Date.now().toString(),
        farmerName: data.farmerName,
        fatPercentage: data.fatPercentage,
        quantity: data.quantity,
        ratePerLiter: data.ratePerLiter,
        totalPrice: data.totalPrice,
        timestamp: editingEntry?.timestamp || new Date(),
      };

      if (editingEntry) {
        // Update existing entry
        setMilkEntries((prev) =>
          prev.map((entry) => (entry.id === editingEntry.id ? newEntry : entry))
        );
        setEditingEntry(null);
      } else {
        // Add new entry
        setMilkEntries((prev) => [newEntry, ...prev]);
      }

      reset();
    } catch (error) {
      console.error("Error saving milk entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: MilkEntry) => {
    setEditingEntry(entry);
    setValue("farmerName", entry.farmerName);
    setValue("fatPercentage", entry.fatPercentage);
    setValue("quantity", entry.quantity);
    setValue("ratePerLiter", entry.ratePerLiter);
    setValue("totalPrice", entry.totalPrice);
  };

  const handleDelete = (id: string) => {
    setMilkEntries((prev) => prev.filter((entry) => entry.id !== id));
    setShowDeleteDialog(null);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    reset();
  };

  // Calculate totals
  const totalLiters = milkEntries.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  );
  const totalAmount = milkEntries.reduce(
    (sum, entry) => sum + entry.totalPrice,
    0
  );
  const averageFat =
    milkEntries.length > 0
      ? milkEntries.reduce((sum, entry) => sum + entry.fatPercentage, 0) /
        milkEntries.length
      : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("milkCollection.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("milkCollection.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t("milkCollection.export")}
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            {t("milkCollection.print")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Milk className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("milkCollection.totalLiters")}
                </p>
                <p className="text-2xl font-bold">{totalLiters.toFixed(1)} L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("milkCollection.totalAmount")}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("milkCollection.farmers")}
                </p>
                <p className="text-2xl font-bold">
                  {new Set(milkEntries.map((e) => e.farmerName)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("milkCollection.averageFat")}
                </p>
                <p className="text-2xl font-bold">{averageFat.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milk Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingEntry
              ? t("milkCollection.editEntry")
              : t("milkCollection.addEntry")}
          </CardTitle>
          <CardDescription>
            {t("milkCollection.formDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Farmer Name */}
              <div className="space-y-2">
                <Label htmlFor="farmerName">
                  {t("milkCollection.farmerName")}
                </Label>
                <Select
                  value={watch("farmerName")}
                  onValueChange={(value) => setValue("farmerName", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("milkCollection.selectFarmer")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {mockFarmers.map((farmer) => (
                      <SelectItem key={farmer} value={farmer}>
                        {farmer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.farmerName && (
                  <p className="text-sm text-destructive">
                    {errors.farmerName.message}
                  </p>
                )}
              </div>

              {/* Fat Percentage */}
              <div className="space-y-2">
                <Label htmlFor="fatPercentage">
                  {t("milkCollection.fatPercentage")}
                </Label>
                <Input
                  id="fatPercentage"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  {...register("fatPercentage", { valueAsNumber: true })}
                />
                {errors.fatPercentage && (
                  <p className="text-sm text-destructive">
                    {errors.fatPercentage.message}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">{t("milkCollection.quantity")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

                             {/* Rate per Liter */}
               <div className="space-y-2">
                 <Label htmlFor="ratePerLiter">{t('milkCollection.ratePerLiter')}</Label>
                <Input
                  id="ratePerLiter"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("ratePerLiter", { valueAsNumber: true })}
                />
                {errors.ratePerLiter && (
                  <p className="text-sm text-destructive">
                    {errors.ratePerLiter.message}
                  </p>
                )}
              </div>

                             {/* Total Price */}
               <div className="space-y-2">
                 <Label htmlFor="totalPrice">{t('milkCollection.totalPrice')}</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  readOnly
                  {...register("totalPrice", { valueAsNumber: true })}
                  className="bg-muted"
                />
                {errors.totalPrice && (
                  <p className="text-sm text-destructive">
                    {errors.totalPrice.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('milkCollection.saving')}
                  </div>
                ) : (
                  <>{editingEntry ? t('milkCollection.updateEntryButton') : t('milkCollection.addEntryButton')}</>
                )}
              </Button>

              {editingEntry && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  {t('milkCollection.cancelButton')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Milk Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('milkCollection.todaysCollection')}          
          </CardTitle>
          <CardDescription>
            {t('milkCollection.entriesCollected')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milkEntries.length === 0 ? (
            <div className="text-center py-8">
              <Milk className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('milkCollection.noEntries')}</p>
              <p className="text-sm text-muted-foreground">
                {t('milkCollection.noEntriesDescription')}
              </p>  
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('milkCollection.farmerNameColumn')}</TableHead>
                    <TableHead>{t('milkCollection.fatColumn')}</TableHead>
                    <TableHead>{t('milkCollection.quantityColumn')}</TableHead>
                    <TableHead>{t('milkCollection.rateColumn')}</TableHead>
                    <TableHead>{t('milkCollection.totalColumn')}</TableHead>
                    <TableHead>{t('milkCollection.timeColumn')}</TableHead>
                    <TableHead>{t('milkCollection.actionsColumn')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milkEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.farmerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {entry.fatPercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.quantity.toFixed(1)} L</TableCell>
                      <TableCell>₹{entry.ratePerLiter}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(entry.totalPrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteDialog(entry.id)}
                            className="text-destructive hover:text-destructive"
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!showDeleteDialog}
        onOpenChange={() => setShowDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("milkCollection.deleteEntry")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("milkCollection.deleteConfirm")}
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
              >
                {t("milkCollection.cancelButton")}
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  showDeleteDialog && handleDelete(showDeleteDialog)
                }
              >
                {t("milkCollection.deleteButton")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MilkCollection;
