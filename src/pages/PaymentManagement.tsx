import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useQuery, useMutation } from "../hooks/useApi";
import { apiCall } from "../lib/apiCall";
import { allRoutes } from "../lib/apiRoutes";
import api from "../lib/axios";
import { formatDisplayDate } from "../lib/dateFormat";
import { DateInput } from "../components/ui/date-input";
import { toast } from "../hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, CreditCard, Filter, X, Download } from "lucide-react";
import { toast as notify } from "react-toastify";
import {
  fetchAndSyncFarmers,
  getStoredFarmers,
  type StoredFarmer,
} from "@/lib/farmerStorage";

type Farmer = StoredFarmer;

interface Payment {
  id: number;
  farmerId: number;
  dairyId: number;
  amount: string;
  paidAt: string;
  note: string;
  type?: string;
  paymentMethod?: string;
  paymentType?: string;
  createdAt?: string;
  updatedAt?: string;
  farmer?: {
    id: number;
    name: string;
    phone: string;
  };
}

function isPaymentEditable(createdAt?: string) {
  if (!createdAt) return false;

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;

  const today = new Date();
  return (
    createdDate.getFullYear() === today.getFullYear() &&
    createdDate.getMonth() === today.getMonth() &&
    createdDate.getDate() === today.getDate()
  );
}

function formatPaymentField(value?: string) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const PAYMENT_METHODS = ["cash", "upi", "bank"] as const;

const PaymentManagement = () => {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Filter states
  const [selectedFarmer, setSelectedFarmer] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    farmerId: "",
    amount: "",
    paidAt: new Date().toISOString().split('T')[0],
    paymentMethod: "cash",
    note: "",
  });

  const [farmers, setFarmers] = useState<Farmer[]>([]);

  useEffect(() => {
    let active = true;

    getStoredFarmers()
      .then((cached) => {
        if (active && cached.length > 0) setFarmers(cached);
      })
      .catch((error) => {
        console.error("Failed to load cached farmers:", error);
      });

    fetchAndSyncFarmers()
      .then((farmers) => {
        if (active) setFarmers(farmers);
      })
      .catch((error) => {
        console.error("Failed to load farmers:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch payments
  const { data: paymentsData, execute: fetchPayments, loading: isLoading } = useQuery(
    () => apiCall(allRoutes.dairy.getFarmerPayments(selectedFarmer === "all" ? "" : selectedFarmer, startDate, endDate), 'get'),
    {
      autoExecute: true,
    }
  );

  // Add payment mutation
  const { execute: addPayment, loading: isAdding } = useMutation(
    (paymentData: any) => apiCall(allRoutes.dairy.addFarmerPayments, 'post', paymentData),
    {
      onSuccess: () => {
        toast({
          title: t("payments.paymentAdded"),
          description: t("payments.paymentAdded"),
        });
        setIsFormOpen(false);
        resetForm();
        fetchPayments();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error || "Failed to add payment",
          variant: "destructive",
        });
      },
    }
  );

  // Update payment mutation
  const { execute: updatePayment, loading: isUpdating } = useMutation(
    (paymentData: any) => apiCall(allRoutes.dairy.updateFarmerPayments(editingPayment?.id || 0), 'put', paymentData),
    {
      onSuccess: () => {
        toast({
          title: t("payments.paymentUpdated"),
          description: t("payments.paymentUpdated"),
        });
        setIsFormOpen(false);
        setIsEditMode(false);
        setEditingPayment(null);
        resetForm();
        fetchPayments();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error || "Failed to update payment",
          variant: "destructive",
        });
      },
    }
  );

  // Delete payment mutation
  const { execute: deletePayment, loading: isDeleting } = useMutation(
    () => apiCall(allRoutes.dairy.updateFarmerPayments(paymentToDelete?.id || 0), 'delete'),
    {
      onSuccess: () => {
        toast({
          title: t("payments.paymentDeleted"),
          description: t("payments.paymentDeleted"),
        });
        setDeleteDialogOpen(false);
        setPaymentToDelete(null);
        fetchPayments();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error || "Failed to delete payment",
          variant: "destructive",
        });
      },
    }
  );

  const resetForm = () => {
    setFormData({
      farmerId: "",
      amount: "",
      paidAt: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      note: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentData = {
      farmerId: parseInt(formData.farmerId),
      amount: parseFloat(formData.amount),
      paidAt: formData.paidAt,
      paymentMethod: formData.paymentMethod,
      note: formData.note,
    };

    if (isEditMode && editingPayment) {
      updatePayment(paymentData);
    } else {
      addPayment(paymentData);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditMode(true);
    setFormData({
      farmerId: payment.farmerId.toString(),
      amount: payment.amount.toString(),
      paidAt: payment.paidAt.split('T')[0],
      paymentMethod: payment.paymentMethod || "cash",
      note: payment.note,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      deletePayment();
    }
  };

  const openAddForm = () => {
    setIsEditMode(false);
    setEditingPayment(null);
    resetForm();
    setIsFormOpen(true);
  };

  const clearFilters = () => {
    setSelectedFarmer("all");
    setStartDate("");
    setEndDate("");
  };

  const applyFilters = () => {
    fetchPayments();
  };

  const handleDownloadPaymentStatement = async () => {
    if (selectedFarmer === "all") {
      notify.error(t("payments.selectFarmerForStatement"));
      return;
    }

    setPdfDownloading(true);
    try {
      const url = allRoutes.reports.paymentStatementPdf(
        selectedFarmer,
        startDate,
        endDate,
      );
      const response = await api.get(url, { responseType: "blob" });
      const blob = response.data;

      if (blob.type?.includes("application/json")) {
        const errorData = JSON.parse(await blob.text());
        notify.error(errorData.message || t("payments.paymentStatementDownloadError"));
        return;
      }

      const fileName = `payment-statement-${selectedFarmer}-${startDate || "all"}-${endDate || "all"}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(objectUrl);
      notify.success(t("payments.paymentStatementDownloadSuccess"));
    } catch (error) {
      console.error("Error downloading payment statement:", error);
      notify.error(t("payments.paymentStatementDownloadError"));
    } finally {
      setPdfDownloading(false);
    }
  };

  const payments: Payment[] = paymentsData?.data || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {t("payments.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage farmer payments and track payment history
          </p>
        </div>
       {/*  <Button onClick={openAddForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("payments.addPayment")}
        </Button> */}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("payments.filterByFarmer")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("payments.selectFarmer")}</Label>
              <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
                <SelectTrigger>
                  <SelectValue placeholder={t("payments.allFarmers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("payments.allFarmers")}</SelectItem>
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id.toString()}>
                      {farmer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("payments.fromDate")}</Label>
              <DateInput
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("payments.toDate")}</Label>
              <DateInput
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("payments.paymentHistory")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPaymentStatement}
            disabled={pdfDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {pdfDownloading
              ? t("common.loading")
              : t("payments.downloadPaymentStatement")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">{t("payments.loading")}</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("payments.noPayments")}</h3>
              <p className="text-muted-foreground mb-4">{t("payments.noPaymentsDescription")}</p>
              <Button onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t("payments.addPayment")}
              </Button>
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("payments.farmerName")}</TableHead>
                    <TableHead>{t("payments.paymentDate")}</TableHead>
                    <TableHead>{t("payments.amount")}</TableHead>
                    <TableHead>{t("payments.type")}</TableHead>
                    <TableHead>{t("payments.paymentMethod")}</TableHead>
                    <TableHead>{t("payments.paymentType")}</TableHead>
                    <TableHead className="text-right">{t("payments.note")}</TableHead>
                    {/* <TableHead>{t("payments.actions")}</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.farmer?.name || `Farmer ${payment.farmerId}`}
                      </TableCell>
                      <TableCell>
                        {formatDisplayDate(payment.paidAt)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{parseFloat(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatPaymentField(payment.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatPaymentField(payment.paymentMethod)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{formatPaymentField(payment.paymentType)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{payment.note || "-"}</TableCell>
                      {/* <TableCell>
                        {isPaymentEditable(payment.createdAt) ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(payment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(payment)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {isEditMode ? t("payments.editPayment") : t("payments.addPayment")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmerId">{t("payments.farmerName")} *</Label>
              <Select
                value={formData.farmerId}
                onValueChange={(value) => handleInputChange("farmerId", value)}
              >
                <SelectTrigger id="farmerId">
                  <SelectValue placeholder={t("payments.selectFarmer")} />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id.toString()}>
                      {farmer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t("payments.amount")} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder={t("payments.amountPlaceholder")}
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAt">{t("payments.paidAt")} *</Label>
              <DateInput
                id="paidAt"
                value={formData.paidAt}
                onChange={(value) => handleInputChange("paidAt", value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t("payments.paymentMethod")} *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange("paymentMethod", value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder={t("payments.selectPaymentMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`payments.paymentMethods.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">{t("payments.note")}</Label>
              <Input
                id="note"
                placeholder={t("payments.notePlaceholder")}
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                {t("payments.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isAdding || isUpdating}
                className="flex items-center gap-2"
              >
                {isAdding || isUpdating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    {isEditMode ? t("payments.updating") : t("payments.saving")}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {isEditMode ? t("payments.update") : t("payments.save")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("payments.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("payments.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("payments.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
              ) : null}
              {t("payments.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentManagement;
