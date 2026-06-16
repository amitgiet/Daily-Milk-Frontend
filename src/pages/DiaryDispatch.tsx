import React, { useState } from "react";
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
import { toast } from "../hooks/use-toast";
import { formatDisplayDate } from "../lib/dateFormat";
import { DateInput } from "../components/ui/date-input";
import { Edit, Trash2, Truck } from "lucide-react";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<DispatchEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dispatchToDelete, setDispatchToDelete] = useState<DispatchEntry | null>(null);

  const [formData, setFormData] = useState({
    bmcId: "",
    bmcName: "",
    date: new Date().toISOString().split("T")[0],
    shift: "morning" as "morning" | "evening",
    quantity: "",
    fat: "",
    snf: "",
    ratePerLitre: "",
    note: "",
  });

  const { data: dispatchesData, execute: fetchDispatches, loading: isLoading } = useQuery(
    () => apiCall(allRoutes.diaryDispatch.list, "get"),
    { autoExecute: true },
  );

  const { execute: addDispatch, loading: isAdding } = useMutation(
    (dispatchData: Record<string, unknown>) =>
      apiCall(allRoutes.diaryDispatch.add, "post", dispatchData),
    {
      onSuccess: () => {
        toast({
          title: t("dispatch.dispatchAdded"),
          description: t("dispatch.dispatchAdded"),
        });
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
    },
  );

  const { execute: updateDispatch, loading: isUpdating } = useMutation(
    (dispatchData: Record<string, unknown>) =>
      apiCall(allRoutes.diaryDispatch.update(editingDispatch?.id || 0), "put", dispatchData),
    {
      onSuccess: () => {
        toast({
          title: t("dispatch.dispatchUpdated"),
          description: t("dispatch.dispatchUpdated"),
        });
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
    },
  );

  const { execute: deleteDispatch, loading: isDeleting } = useMutation(
    () => apiCall(allRoutes.diaryDispatch.delete(dispatchToDelete?.id || 0), "delete"),
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
    },
  );

  const resetForm = () => {
    setFormData({
      bmcId: "",
      bmcName: "",
      date: new Date().toISOString().split("T")[0],
      shift: "morning",
      quantity: "",
      fat: "",
      snf: "",
      ratePerLitre: "",
      note: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dispatchData = {
      bmcId: formData.bmcId ? parseInt(formData.bmcId) : null,
      bmcName: formData.bmcName,
      date: formData.date,
      shift: formData.shift,
      quantity: parseFloat(formData.quantity),
      fat: parseFloat(formData.fat),
      snf: parseFloat(formData.snf),
      ratePerLitre: parseFloat(formData.ratePerLitre),
      note: formData.note,
    };

    if (isEditMode && editingDispatch) {
      updateDispatch(dispatchData);
      return;
    }

    addDispatch(dispatchData);
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
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingDispatch(null);
    resetForm();
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

  const dispatches: DispatchEntry[] = dispatchesData?.data || [];

  const totalLiters =
    dispatches.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0) || 0;
  const totalAmount =
    dispatches.reduce(
      (sum, entry) =>
        sum + (Number(entry.quantity) || 0) * (Number(entry.ratePerLitre) || 0),
      0,
    ) || 0;
  const averageFat =
    dispatches.length > 0
      ? dispatches.reduce((sum, entry) => sum + (Number(entry.fat) || 0), 0) /
        dispatches.length
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            {t("dispatch.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("dispatch.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {isEditMode ? t("dispatch.editDispatch") : t("dispatch.addDispatch")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="overflow-x-auto pb-1">
              <div className="grid w-full min-w-[880px] grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.95fr)] items-end gap-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="bmcName" className="block truncate text-sm leading-tight">
                  {t("dispatch.bmcName")}
                </Label>
                <Input
                  id="bmcName"
                  className="w-full min-w-0"
                  placeholder={t("dispatch.bmcNamePlaceholder")}
                  value={formData.bmcName}
                  onChange={(e) => handleInputChange("bmcName", e.target.value)}
                  required
                />
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="date" className="block truncate text-sm leading-tight">
                  {t("dispatch.date")}
                </Label>
                <DateInput
                  id="date"
                  className="w-full min-w-0"
                  value={formData.date}
                  onChange={(value) => handleInputChange("date", value)}
                  required
                />
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="shift" className="block truncate text-sm leading-tight">
                  {t("dispatch.shift")}
                </Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value: "morning" | "evening") =>
                    handleInputChange("shift", value)
                  }
                >
                  <SelectTrigger id="shift" className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">{t("dispatch.morning")}</SelectItem>
                    <SelectItem value="evening">{t("dispatch.evening")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="quantity" className="block truncate text-sm leading-tight">
                  {t("dispatch.quantity")}
                </Label>
                <Input
                  id="quantity"
                  type="text" 
                  className="w-full min-w-0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="fat" className="block truncate text-sm leading-tight">
                  {t("dispatch.fat")}
                </Label>
                <Input
                  id="fat"
                  type="text" 
                  className="w-full min-w-0"
                  value={formData.fat}
                  onChange={(e) => handleInputChange("fat", e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="snf" className="block truncate text-sm leading-tight">
                  {t("dispatch.snf")}
                </Label>
                <Input
                  id="snf"
                  type="text" 
                  className="w-full min-w-0"
                  value={formData.snf}
                  onChange={(e) => handleInputChange("snf", e.target.value)}
                  placeholder="0.0"
                   
                />
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="ratePerLitre" className="block truncate text-sm leading-tight">
                  {t("dispatch.ratePerLitre")}
                </Label>
                <Input
                  id="ratePerLitre"
                  type="text" 
                  className="w-full min-w-0"
                  value={formData.ratePerLitre}
                  onChange={(e) => handleInputChange("ratePerLitre", e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>
              </div>
            </div>

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

            <div className="flex gap-2">
              <Button type="submit" disabled={isAdding || isUpdating}>
                {isAdding || isUpdating
                  ? t("common.loading")
                  : isEditMode
                    ? t("common.update")
                    : t("common.submit")}
              </Button>
              {isEditMode && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalLiters.toFixed(1)} L</div>
            <div className="text-sm text-muted-foreground">
              {t("dispatch.totalLiters")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              {t("dispatch.totalAmount")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{dispatches.length}</div>
            <div className="text-sm text-muted-foreground">
              {t("dispatch.totalDispatches")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{averageFat.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {t("dispatch.averageFat")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t("dispatch.dailyList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">{t("common.loading")}</div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {t("dispatch.noDispatches")}
            </div>
          ) : (
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
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.bmcName}</TableCell>
                    <TableCell>
                      {formatDisplayDate(dispatch.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dispatch.shift === "morning" ? "default" : "secondary"
                        }
                      >
                        {t(`dispatch.${dispatch.shift}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{dispatch.quantity} L</TableCell>
                    <TableCell>{dispatch.fat}%</TableCell>
                    <TableCell>{dispatch.snf}%</TableCell>
                    <TableCell>₹{dispatch.ratePerLitre}</TableCell>
                    <TableCell>
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
          )}
        </CardContent>
      </Card>

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
              {isDeleting ? t("common.loading") : t("dispatch.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiaryDispatch;
