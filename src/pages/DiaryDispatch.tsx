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
import { Textarea } from "../components/ui/textarea";
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
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Package, DollarSign } from "lucide-react";

interface DispatchEntry {
  id: number;
  bmcId: number | null;
  bmcName: string;
  date: string;
  shift: "morning" | "evening";
  quantity: number;
  fat: number;
  snf: number;
  ratePerLitre: number;
  note: string;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const DiaryDispatch = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<DispatchEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dispatchToDelete, setDispatchToDelete] = useState<DispatchEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bmcId: "",
    bmcName: "",
    date: new Date().toISOString().split('T')[0],
    shift: "morning" as "morning" | "evening",
    quantity: "",
    fat: "",
    snf: "",
    ratePerLitre: "",
    note: "",
  });

  // Fetch dispatches
  const { data: dispatchesData, execute: fetchDispatches, loading: isLoading } = useQuery(
    () => apiCall(allRoutes.diaryDispatch.list, 'get'),
    {
      autoExecute: true,
      onSuccess: (data) => {
        console.log('Dispatches fetched:', data);
      },
      onError: (error) => {
        console.error('Failed to fetch dispatches:', error);
      }
    }
  );

  // Add dispatch mutation
  const { execute: addDispatch, loading: isAdding } = useMutation(
    (dispatchData: any) => apiCall(allRoutes.diaryDispatch.add, 'post', dispatchData),
    {
      onSuccess: () => {
        toast({
          title: t("dispatch.dispatchAdded"),
          description: t("dispatch.dispatchAdded"),
        });
        setIsFormOpen(false);
        resetForm();
        fetchDispatches();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error || "Failed to add dispatch",
          variant: "destructive",
        });
      },
    }
  );

  // Update dispatch mutation
  const { execute: updateDispatch, loading: isUpdating } = useMutation(
    (dispatchData: any) => apiCall(allRoutes.diaryDispatch.update(editingDispatch?.id || 0), 'put', dispatchData),
    {
      onSuccess: () => {
        toast({
          title: t("dispatch.dispatchUpdated"),
          description: t("dispatch.dispatchUpdated"),
        });
        setIsFormOpen(false);
        setIsEditMode(false);
        setEditingDispatch(null);
        resetForm();
        fetchDispatches();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error || "Failed to update dispatch",
          variant: "destructive",
        });
      },
    }
  );

  // Delete dispatch mutation
  const { execute: deleteDispatch, loading: isDeleting } = useMutation(
    () => apiCall(allRoutes.diaryDispatch.delete(dispatchToDelete?.id || 0), 'delete'),
    {
      onSuccess: () => {
        toast({
          title: t("dispatch.dispatchDeleted"),
          description: t("dispatch.dispatchDeleted"),
        });
        setDeleteDialogOpen(false);
        setDispatchToDelete(null);
        fetchDispatches();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error || "Failed to delete dispatch",
          variant: "destructive",
        });
      },
    }
  );

  const resetForm = () => {
    setFormData({
      bmcId: "",
      bmcName: "",
      date: new Date().toISOString().split('T')[0],
      shift: "morning",
      quantity: "",
      fat: "",
      snf: "",
      ratePerLitre: "",
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
    
    // Calculate total amount
    const quantity = parseFloat(formData.quantity);
    const ratePerLitre = parseFloat(formData.ratePerLitre);
    const totalAmount = quantity * ratePerLitre;

    const dispatchData = {
      bmcId: formData.bmcId ? parseInt(formData.bmcId) : null,
      bmcName: formData.bmcName,
      date: formData.date,
      shift: formData.shift,
      quantity: quantity,
      fat: parseFloat(formData.fat),
      snf: parseFloat(formData.snf),
      ratePerLitre: ratePerLitre,
      note: formData.note,
    };

    if (isEditMode && editingDispatch) {
      updateDispatch(dispatchData);
    } else {
      addDispatch(dispatchData);
    }
  };

  const handleEdit = (dispatch: DispatchEntry) => {
    setEditingDispatch(dispatch);
    setIsEditMode(true);
    setFormData({
      bmcId: dispatch.bmcId?.toString() || "",
      bmcName: dispatch.bmcName,
      date: dispatch.date,
      shift: dispatch.shift,
      quantity: dispatch.quantity.toString(),
      fat: dispatch.fat.toString(),
      snf: dispatch.snf.toString(),
      ratePerLitre: dispatch.ratePerLitre.toString(),
      note: dispatch.note,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (dispatch: DispatchEntry) => {
    setDispatchToDelete(dispatch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (dispatchToDelete) {
      deleteDispatch();
    }
  };

  const openAddForm = () => {
    setIsEditMode(false);
    setEditingDispatch(null);
    resetForm();
    setIsFormOpen(true);
  };

  const dispatches: DispatchEntry[] = dispatchesData?.data || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            {t("dispatch.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage milk dispatches to BMC
          </p>
        </div>
        <Button onClick={openAddForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("dispatch.addDispatch")}
        </Button>
      </div>

      {/* Dispatches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("dispatch.title")} List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">{t("dispatch.loading")}</div>
            </div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("dispatch.noDispatches")}</h3>
              <p className="text-muted-foreground mb-4">{t("dispatch.noDispatchesDescription")}</p>
              <Button onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t("dispatch.addDispatch")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dispatch.bmcName")}</TableHead>
                    <TableHead>{t("dispatch.date")}</TableHead>
                    <TableHead>{t("dispatch.shift")}</TableHead>
                    <TableHead>{t("dispatch.quantity")}</TableHead>
                    <TableHead>{t("dispatch.fat")}</TableHead>
                    <TableHead>{t("dispatch.snf")}</TableHead>
                    <TableHead>{t("dispatch.ratePerLitre")}</TableHead>
                    <TableHead>{t("dispatch.totalAmount")}</TableHead>
                    <TableHead>{t("dispatch.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((dispatch) => (
                    <TableRow key={dispatch.id}>
                      <TableCell className="font-medium">
                        {dispatch.bmcName}
                      </TableCell>
                      <TableCell>
                        {new Date(dispatch.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dispatch.shift === "morning" ? "default" : "secondary"}>
                          {t(`dispatch.${dispatch.shift}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{dispatch.quantity} L</TableCell>
                      <TableCell>{dispatch.fat}%</TableCell>
                      <TableCell>{dispatch.snf}%</TableCell>
                      <TableCell>₹{dispatch.ratePerLitre}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{(dispatch.quantity * dispatch.ratePerLitre).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(dispatch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(dispatch)}
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

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {isEditMode ? t("dispatch.editDispatch") : t("dispatch.addDispatch")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* BMC Name */}
              <div className="space-y-2">
                <Label htmlFor="bmcName">{t("dispatch.bmcName")} *</Label>
                <Input
                  id="bmcName"
                  placeholder={t("dispatch.bmcNamePlaceholder")}
                  value={formData.bmcName}
                  onChange={(e) => handleInputChange("bmcName", e.target.value)}
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">{t("dispatch.date")} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              {/* Shift */}
              <div className="space-y-2">
                <Label htmlFor="shift">{t("dispatch.shift")} *</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value: "morning" | "evening") => handleInputChange("shift", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("dispatch.shift")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">{t("dispatch.morning")}</SelectItem>
                    <SelectItem value="evening">{t("dispatch.evening")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">{t("dispatch.quantity")} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="Enter quantity in liters"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  required
                />
              </div>

              {/* Fat */}
              <div className="space-y-2">
                <Label htmlFor="fat">{t("dispatch.fat")} *</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.01"
                  placeholder="Enter fat percentage"
                  value={formData.fat}
                  onChange={(e) => handleInputChange("fat", e.target.value)}
                  required
                />
              </div>

              {/* SNF */}
              <div className="space-y-2">
                <Label htmlFor="snf">{t("dispatch.snf")} *</Label>
                <Input
                  id="snf"
                  type="number"
                  step="0.01"
                  placeholder="Enter SNF percentage"
                  value={formData.snf}
                  onChange={(e) => handleInputChange("snf", e.target.value)}
                  required
                />
              </div>

              {/* Rate per Liter */}
              <div className="space-y-2">
                <Label htmlFor="ratePerLitre">{t("dispatch.ratePerLitre")} *</Label>
                <Input
                  id="ratePerLitre"
                  type="number"
                  step="0.01"
                  placeholder="Enter rate per liter"
                  value={formData.ratePerLitre}
                  onChange={(e) => handleInputChange("ratePerLitre", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">{t("dispatch.note")}</Label>
              <Textarea
                id="note"
                placeholder={t("dispatch.notePlaceholder")}
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                rows={3}
              />
            </div>

            {/* Total Amount Display */}
            {formData.quantity && formData.ratePerLitre && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-5 w-5" />
                  {t("dispatch.totalAmount")}: ₹{(parseFloat(formData.quantity) * parseFloat(formData.ratePerLitre)).toFixed(2)}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                {t("dispatch.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isAdding || isUpdating}
                className="flex items-center gap-2"
              >
                {isAdding || isUpdating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    {isEditMode ? t("dispatch.updating") : t("dispatch.saving")}
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    {isEditMode ? t("dispatch.update") : t("dispatch.save")}
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
            <AlertDialogTitle>{t("dispatch.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dispatch.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dispatch.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
              ) : null}
              {t("dispatch.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiaryDispatch;    