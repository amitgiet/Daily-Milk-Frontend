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
import { useQuery, useMutation } from "../hooks/useApi";
import { apiCall } from "../lib/apiCall";
import { allRoutes } from "../lib/apiRoutes";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import Receipt from "../components/Reciept";

interface MilkEntry {
  id: number;
  farmerId: number;
  farmerName?: string;
  date: string;
  shift: "morning" | "evening";
  quantity: number | string;
  fat: number | string;
  snf: number | string;
  rate: number | string;
  totalAmount: number | string;
  createdAt: string;
  farmer?: {
    id: number;
    name: string;
  };
}

interface Farmer {
  id: number;
  name: string;
  phone: string;
}

const MilkCollection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    isFarmerUser,
    isAdminUser,
    isDairyUser,
    canManageMilk,
    getFarmerFilterParams,
  } = usePermissions();
  const [selectedFarmer, setSelectedFarmer] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [snf, setSnf] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<string>("");
  const [shift, setShift] = useState<"morning" | "evening">("morning");
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | "">("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [savedMilkEntry, setSavedMilkEntry] = useState<any>(null);

  console.log(receiptData);
  // Fetch farmers list (only for admin/dairy users)
  const {
    data: farmersData,
    loading: farmersLoading,
    execute: fetchFarmers,
  } = useQuery(() => apiCall(allRoutes.farmers.getFarmers, "get"), {
    autoExecute: canManageMilk, // Only fetch if user can manage milk
  });

  // Fetch milk collection list with farmer filtering
  const {
    data: milkData,
    loading: milkLoading,
    execute: fetchMilk,
  } = useQuery(
    () => {
      // Use the permissions hook to get the correct API endpoint
      const filterParams = getFarmerFilterParams();

      // Extract farmerId from filterParams if it exists
      let farmerId: string | number = "";
      if (filterParams && filterParams.includes('farmerId=')) {
        const match = filterParams.match(/farmerId=([^&]+)/);
        if (match) {
          farmerId = match[1];
        }
      }

      // Call the list function with proper parameters
      const url = allRoutes.milkCollection.list(
        farmerId,
        undefined,
        undefined,
        selectedShift === "" ? undefined : selectedShift
      );

      return apiCall(url, "get");
    },
    {
      autoExecute: true,
    }
  );

  // Collect milk mutation (only for admin/dairy)
  const { execute: collectMilk, loading: collectingMilk } = useMutation(
    (data: Record<string, unknown>) =>
      apiCall(allRoutes.milkCollection.collect, "post", data),
    {
      onSuccess: () => {
        fetchMilk();
        resetForm();
      },
    }
  );

  // Update milk entry mutation (only for admin/dairy)
  const { execute: updateMilk, loading: updatingMilk } = useMutation(
    (data: { id: number; updateData: Record<string, unknown> }) =>
      apiCall(allRoutes.milkCollection.update(data.id), "put", data.updateData),
    {
      onSuccess: () => {
        fetchMilk();
        resetForm();
        setIsEditMode(false);
        setEditingEntry(null);
      },
    }
  );

  const farmers: Farmer[] = Array.isArray(farmersData?.data)
    ? farmersData.data
    : [];
  const milkEntries: MilkEntry[] = Array.isArray(milkData?.data)
    ? milkData.data
    : [];

  const resetForm = () => {
    setSelectedFarmer("");
    setFat("");
    setSnf("");
    setQuantity("");
    setShift("morning");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const calculateRate = (fatValue: number, snfValue: number) => {
    // Get rate settings from localStorage or use defaults
    const rateSettings = JSON.parse(
      localStorage.getItem("milkRateSettings") || "{}"
    );
    const fatRate = parseFloat(rateSettings.fatRate || "2.00");
    const snfRate = parseFloat(rateSettings.snfRate || "1.00");
    const formulaType = rateSettings.formulaType || "fatOnly";

    const baseRate = 50; // Base rate per liter

    switch (formulaType) {
      case "fatOnly":
        return baseRate + fatValue * fatRate;
      case "fatSnf":
        return baseRate + fatValue * fatRate + snfValue * snfRate;
      default:
        return baseRate + fatValue * fatRate;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFarmer || !fat || !snf || !quantity) {
      return;
    }
    setLoading(true);
    const rate = calculateRate(parseFloat(fat), parseFloat(snf));
    const totalAmount = rate * parseFloat(quantity);

    const milkData = {
      farmerId: parseInt(selectedFarmer),
      date,
      shift,
      quantity: parseFloat(quantity),
      fat: parseFloat(fat),
      snf: parseFloat(snf),
      rate,
      totalAmount,
    };

    if (isEditMode && editingEntry) {
      await updateMilk({ id: editingEntry.id, updateData: milkData });
    } else {
      await collectMilk(milkData);
    }
    setLoading(false);
  };

  const handleSaveAndPrint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFarmer || !fat || !snf || !quantity) {
      return;
    }
    setLoading(true);
    const rate = calculateRate(parseFloat(fat), parseFloat(snf));
    const totalAmount = rate * parseFloat(quantity);

    const milkData = {
      farmerId: parseInt(selectedFarmer),
      date,
      shift,
      quantity: parseFloat(quantity),
      fat: parseFloat(fat),
      snf: parseFloat(snf),
      rate,
      totalAmount,
    };

    try {
      if (isEditMode && editingEntry) {
        await updateMilk({ id: editingEntry.id, updateData: milkData });
      } else {
        await collectMilk(milkData);
      }

      // Get farmer name for receipt
      const selectedFarmerData = farmers.find(f => f.id.toString() === selectedFarmer);
      const farmerName = selectedFarmerData?.name || "Unknown Farmer";

      // Prepare receipt data
      const receipt = {
        address: "Dairy Management System",
        date: new Date(date).toLocaleDateString(),
        items: [{
          name: `${farmerName}`,
          price: totalAmount
        }],
        total: totalAmount,
        cash: totalAmount,
        change: 0,
        fatRate: parseFloat(fat),
        quantity: parseFloat(quantity),
        snfRate: parseFloat(snf)
      };

      setReceiptData(receipt);
      setSavedMilkEntry(milkData);
      setIsReceiptModalOpen(true);
      resetForm();
    } catch (error) {
      console.error("Error saving milk entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (receiptData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Milk Collection Receipt</title>
              <style>
                body { font-family: monospace; margin: 20px; }
                .receipt { width: 300px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                .items { margin: 10px 0; }
                .totals { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin: 10px 0; }
                .footer { text-align: center; margin-top: 10px; }
                .barcode { height: 50px; background: repeating-linear-gradient(to right, #000 0px, #000 2px, transparent 2px, transparent 4px); }
              </style>
            </head>
            <body>
              <div class="receipt">
                <div class="header">
                  <h2>Receipt</h2>
                  <p>Address: ${receiptData.address}</p>
                  <p>Date: ${receiptData.date}</p>
                </div>
                <div class="items">
                  ${receiptData.items.map((item: any) => `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                      <span>${item.name}</span>
                      <span>₹${item.price.toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="totals">
                 <div style="display: flex; justify-content: space-between;">
                    <span>Fat Rate</span>
                    <span>₹${receiptData.fatRate.toFixed(2)}</span>
                  </div>
                   <div style="display: flex; justify-content: space-between;">
                    <span>Quantity</span>
                    <span>₹${receiptData.quantity.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>SNF Rate</span>
                    <span>₹${receiptData.snfRate.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Total</span>
                    <span>₹${receiptData.total.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Cash</span>
                    <span>₹${receiptData.cash.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Change</span>
                    <span>₹${receiptData.change.toFixed(2)}</span>
                  </div>
                </div>
                <div class="footer">
                  <p>THANK YOU FOR SHOPPING</p>
                </div>
                <div class="barcode"></div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleEdit = (entry: MilkEntry) => {
    if (!canManageMilk) return; // Only admin/dairy can edit

    setIsEditMode(true);
    setEditingEntry(entry);
    setSelectedFarmer(entry.farmerId.toString());
    setFat(entry.fat?.toString() || "");
    setSnf(entry.snf?.toString() || "");
    setQuantity(entry.quantity?.toString() || "");
    setShift(entry.shift);
    setDate(entry.date);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingEntry(null);
    resetForm();
  };

  // Calculate summary with null checks and string-to-number conversion
  const totalLiters =
    milkEntries?.reduce(
      (sum, entry) =>
        sum + (parseFloat(entry.quantity?.toString() || "0") || 0),
      0
    ) || 0;
  const totalAmount =
    milkEntries?.reduce(
      (sum, entry) =>
        sum + (parseFloat(entry.totalAmount?.toString() || "0") || 0),
      0
    ) || 0;
  const totalFarmers = milkEntries
    ? new Set(milkEntries.map((entry) => entry.farmerId)).size
    : 0;
  const averageFat =
    milkEntries && milkEntries.length > 0
      ? milkEntries.reduce(
        (sum, entry) => sum + (parseFloat(entry.fat?.toString() || "0") || 0),
        0
      ) / milkEntries.length
      : 0;

  useEffect(() => {
    fetchMilk();
  }, [selectedShift]);
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("milkCollection.title")}</h1>
        {isFarmerUser && (
          <Badge variant="secondary" className="text-sm">
            {t("milkCollection.viewingOwnData")}
          </Badge>
        )}
      </div>

      {/* Milk Entry Form - Only show for admin/dairy users */}
      {canManageMilk && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode
                ? t("milkCollection.editEntry")
                : t("milkCollection.addEntry")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farmer">
                    {t("milkCollection.farmerName")}
                  </Label>
                  <Select
                    value={selectedFarmer}
                    onValueChange={setSelectedFarmer}
                    disabled={farmersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("milkCollection.selectFarmer")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map((farmer) => (
                        <SelectItem
                          key={farmer.id}
                          value={farmer.id.toString()}
                        >
                          {farmer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat">{t("milkCollection.fat")}</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {t("milkCollection.quantity")}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snf">{t("milkCollection.snf")}</Label>
                  <Input
                    id="snf"
                    type="number"
                    step="0.1"
                    value={snf}
                    onChange={(e) => setSnf(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t("milkCollection.date")}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">{t("milkCollection.shift")}</Label>
                  <Select
                    value={shift}
                    onValueChange={(value: "morning" | "evening") =>
                      setShift(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">
                        {t("milkCollection.morning")}
                      </SelectItem>
                      <SelectItem value="evening">
                        {t("milkCollection.evening")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={collectingMilk || updatingMilk || loading}
                >
                  {collectingMilk || updatingMilk
                    ? t("common.loading")
                    : isEditMode
                      ? t("common.update")
                      : t("common.submit")}
                </Button>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleSaveAndPrint}
                  disabled={collectingMilk || updatingMilk || loading}
                >
                  {collectingMilk || updatingMilk
                    ? t("common.loading")
                    : t("common.saveAndPrint")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalLiters.toFixed(1)} L</div>
            <div className="text-sm text-muted-foreground">
              {isFarmerUser
                ? t("milkCollection.myTotalLiters")
                : t("milkCollection.totalLiters")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              {isFarmerUser
                ? t("milkCollection.myTotalAmount")
                : t("milkCollection.totalAmount")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalFarmers}</div>
            <div className="text-sm text-muted-foreground">
              {isFarmerUser
                ? t("milkCollection.myCollections")
                : t("milkCollection.totalFarmers")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{averageFat.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {isFarmerUser
                ? t("milkCollection.myAverageFat")
                : t("milkCollection.averageFat")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milk Collection List */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between items-center gap-2">
              {isFarmerUser
                ? t("milkCollection.myCollectionList")
                : t("milkCollection.dailyList")}
              <Select
                value={selectedShift}
                onValueChange={(value: "morning" | "evening") =>
                  setSelectedShift(value)
                }
              >
                <SelectTrigger className="w-46">
                  <SelectValue placeholder={t("milkCollection.selectShift")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t("milkCollection.morning")}</SelectItem>
                  <SelectItem value="evening">{t("milkCollection.evening")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {milkLoading ? (
            <div className="text-center py-4">{t("common.loading")}</div>
          ) : milkEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {isFarmerUser
                ? t("milkCollection.noMyEntries")
                : t("milkCollection.noEntries")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!isFarmerUser && (
                    <TableHead>{t("milkCollection.farmerName")}</TableHead>
                  )}
                  <TableHead>{t("milkCollection.date")}</TableHead>
                  <TableHead>{t("milkCollection.shift")}</TableHead>
                  <TableHead>{t("milkCollection.fat")} </TableHead>
                  <TableHead>{t("milkCollection.snf")} </TableHead>
                  <TableHead>{t("milkCollection.quantity")} </TableHead>
                  <TableHead>{t("milkCollection.rate")} </TableHead>
                  <TableHead>{t("milkCollection.totalAmount")} (₹)</TableHead>
                  {canManageMilk && (
                    <TableHead>{t("common.actions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {milkEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    {!isFarmerUser && (
                      <TableCell>{entry.farmer?.name || "N/A"}</TableCell>
                    )}
                    <TableCell>
                      {new Date(entry.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.shift === "morning" ? "default" : "secondary"
                        }
                      >
                        {t(`milkCollection.${entry.shift}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(parseFloat(entry.fat?.toString() || "0") || 0).toFixed(
                        1
                      )}
                      %
                    </TableCell>
                    <TableCell>
                      {(parseFloat(entry.snf?.toString() || "0") || 0).toFixed(
                        1
                      )}
                      %
                    </TableCell>
                    <TableCell>
                      {(
                        parseFloat(entry.quantity?.toString() || "0") || 0
                      ).toFixed(1)}{" "}
                      L
                    </TableCell>
                    <TableCell>
                      ₹
                      {(parseFloat(entry.rate?.toString() || "0") || 0).toFixed(
                        2
                      )}
                    </TableCell>
                    <TableCell>
                      ₹
                      {(
                        parseFloat(entry.totalAmount?.toString() || "0") || 0
                      ).toFixed(2)}
                    </TableCell>
                    {canManageMilk && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          disabled={isEditMode}
                        >
                          {t("common.edit")}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("milkCollection.receipt")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {receiptData && (
              <Receipt
                address={receiptData.address}
                date={receiptData.date}
                items={receiptData.items}
                total={receiptData.total}
                cash={receiptData.total}
                change={receiptData.change}
                fatRate={receiptData.fatRate}
                quantity={receiptData.quantity}
                snfRate={receiptData.snfRate}
              />
            )}
            <div className="flex justify-center space-x-2">
              <Button onClick={handlePrint} variant="outline">
                {t("common.print")}
              </Button>
              <Button onClick={() => setIsReceiptModalOpen(false)}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MilkCollection;


