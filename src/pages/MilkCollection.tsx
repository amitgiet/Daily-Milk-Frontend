import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
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
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import Receipt from "../components/Reciept";
import { useParams } from "react-router-dom";
import { formatDisplayDate } from "@/lib/dateFormat";
import { DateInput } from "@/components/ui/date-input";
import { Milk } from "lucide-react";
import { SearchableFarmerSelect } from "@/components/farmers/SearchableFarmerSelect";
import {
  fetchAndSyncFarmers,
  getStoredFarmers,
  type StoredFarmer,
} from "@/lib/farmerStorage";
import {
  calculateMilkEntryFinancials,
  DEFAULT_MILK_RATE_SETTINGS,
  fetchAndSyncMilkRateSettings,
  getMilkRateSettings,
  type MilkRateSettingsRecord,
} from "@/lib/milkRateStorage";
import {
  getTodayDateString,
  getTodayLocalMilkEntries,
  isSystemOnline,
  isUnsyncedEntry,
  OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
  saveOfflineMilkEntry,
  syncOfflineMilkEntries,
  DuplicateOfflineMilkEntryError,
  type MilkCollectionPayload,
  type OfflineMilkEntry,
} from "@/lib/milkCollectionStorage";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  buildLocalMilkPrintReceipt,
  fetchMilkPrintReceipt,
  printMilkReceiptDocument,
  type MilkPrintReceiptData,
} from "@/lib/milkReceiptPrint";
import { toast } from "react-toastify";

interface MilkEntry {
  id: number;
  localId?: string;
  isLocal?: boolean;
  farmerId: number;
  farmerName?: string;
  date: string;
  shift: "morning" | "evening";
  quantity: number | string;
  fat: number | string;
  fatRate?: number | string;
  snf: number | string;
  snfRate?: number | string;
  rate: number | string;
  amount: number | string;
  subsidyDeduction: number | string;
  subsidyAmount: number | string;
  totalAmount: number | string;
  createdAt: string;
  farmer?: {
    id: number;
    name: string;
  };
}

type Farmer = StoredFarmer;

function buildReceiptDataFromEntry(entry: MilkEntry): MilkPrintReceiptData {
  return buildLocalMilkPrintReceipt({
    farmerName: entry.farmer?.name || entry.farmerName || "Unknown Farmer",
    date: entry.date,
    shift: entry.shift,
    fat: entry.fat,
    fatRate: entry.fatRate ?? "0",
    snf: entry.snf,
    snfRate: entry.snfRate ?? "0",
    rate: entry.rate,
    quantity: entry.quantity,
    amount: entry.amount,
    totalAmount: entry.totalAmount,
    subsidyDeduction: entry.subsidyDeduction,
    subsidyAmount: entry.subsidyAmount,
  });
}

function printMilkEntryReceipt(entry: MilkEntry) {
  printMilkReceiptDocument(
    buildLocalMilkPrintReceipt({
      farmerName: entry.farmer?.name || entry.farmerName || "Unknown Farmer",
      date: entry.date,
      shift: entry.shift,
      fat: entry.fat,
      fatRate: entry.fatRate ?? "0",
      snf: entry.snf,
      snfRate: entry.snfRate ?? "0",
      rate: entry.rate,
      quantity: entry.quantity,
      amount: entry.amount,
      totalAmount: entry.totalAmount,
      subsidyDeduction: entry.subsidyDeduction,
      subsidyAmount: entry.subsidyAmount,
    }),
  );
}

function mapLocalEntryToMilkEntry(entry: OfflineMilkEntry): MilkEntry {
  return {
    id: 0,
    localId: entry.localId,
    isLocal: true,
    farmerId: entry.farmerId,
    date: entry.date,
    shift: entry.shift,
    quantity: entry.quantity,
    fat: entry.fat,
    snf: entry.snf,
    fatRate: entry.fatRate,
    snfRate: entry.snfRate,
    rate: entry.rate,
    amount: entry.amount,
    subsidyDeduction: entry.subsidyDeduction,
    subsidyAmount: entry.subsidyAmount,
    totalAmount: entry.totalAmount,
    createdAt: entry.savedAt,
    farmer: {
      id: entry.farmerId,
      name: entry.farmerName,
    },
  };
}

function buildMilkEntryFromPayload(
  payload: MilkCollectionPayload,
  farmerName: string,
  isLocal = false,
): MilkEntry {
  return {
    id: 0,
    isLocal,
    farmerId: payload.farmerId,
    farmerName,
    date: payload.date,
    shift: payload.shift,
    quantity: payload.quantity,
    fat: payload.fat,
    snf: payload.snf,
    fatRate: payload.fatRate,
    snfRate: payload.snfRate,
    rate: payload.rate,
    amount: payload.amount,
    subsidyDeduction: payload.subsidyDeduction,
    subsidyAmount: payload.subsidyAmount,
    totalAmount: payload.totalAmount,
    createdAt: new Date().toISOString(),
    farmer: {
      id: payload.farmerId,
      name: farmerName,
    },
  };
}

function getDefaultShift(referenceDate: Date = new Date()): "morning" | "evening" {
  return referenceDate.getHours() >= 14 ? "evening" : "morning";
}

const MilkCollection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const [searchParams] = useSearchParams();
  const dairyId = searchParams.get('dairyId');
  const [selectedDairyId, setSelectedDairyId] = useState<number | null>(null);
  
  useEffect(() => {
    if (dairyId) {
      const dairyIdNumber = parseInt(dairyId, 10);
      if (!isNaN(dairyIdNumber)) {
        setSelectedDairyId(dairyIdNumber);
      }
      return;
    }

    if (user?.dairyId) {
      setSelectedDairyId(user.dairyId);
    }
  }, [dairyId, user?.dairyId]);
  
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
  const [shift, setShift] = useState<"morning" | "evening">(() => getDefaultShift());
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | "">("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<MilkPrintReceiptData | null>(null);
  const [savedMilkEntry, setSavedMilkEntry] = useState<MilkEntry | null>(null);
  const [milkRateSettings, setMilkRateSettings] =
    useState<MilkRateSettingsRecord>(DEFAULT_MILK_RATE_SETTINGS);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [localMilkEntries, setLocalMilkEntries] = useState<OfflineMilkEntry[]>([]);
  const [localMilkLoading, setLocalMilkLoading] = useState(false);
  const isSyncingOfflineRef = useRef(false);
  const [printingEntryId, setPrintingEntryId] = useState<number | string | null>(
    null,
  );

  const loadLocalMilkEntries = async () => {
    setLocalMilkLoading(true);
    try {
      const shift =
        selectedShift === "" ? undefined : selectedShift;
      const entries = await getTodayLocalMilkEntries(shift);
      setLocalMilkEntries(entries);
    } catch (error) {
      console.error("Failed to load local milk entries:", error);
    } finally {
      setLocalMilkLoading(false);
    }
  };

  useEffect(() => {
    getMilkRateSettings()
      .then(setMilkRateSettings)
      .catch((error) => {
        console.error("Failed to load cached milk rate settings:", error);
      });

    fetchAndSyncMilkRateSettings()
      .then(setMilkRateSettings)
      .catch((error) => {
        console.error("Failed to sync milk rate settings:", error);
      });
  }, []);

  useEffect(() => {
    if (!canManageMilk) return;

    let active = true;

    getStoredFarmers()
      .then((cached) => {
        if (!active || cached.length === 0) return;
        setFarmers(cached);
        setFarmersLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load cached farmers:", error);
      });

    setFarmersLoading(true);
    fetchAndSyncFarmers()
      .then((farmers) => {
        if (active) setFarmers(farmers);
      })
      .catch((error) => {
        console.error("Failed to load farmers:", error);
      })
      .finally(() => {
        if (active) setFarmersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canManageMilk]);

  useEffect(() => {
    if (!canManageMilk) return;

    loadLocalMilkEntries();

    function handleLocalEntriesUpdated() {
      loadLocalMilkEntries();
    }

    window.addEventListener(
      OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
      handleLocalEntriesUpdated,
    );

    return () => {
      window.removeEventListener(
        OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
        handleLocalEntriesUpdated,
      );
    };
  }, [canManageMilk, selectedShift]);

  // Fetch milk collection list from API for farmer users only
  const {
    data: milkData,
    loading: milkLoading,
    execute: fetchMilk,
  } = useQuery(
    () => {
      const filterParams = getFarmerFilterParams();

      let farmerId: string | number = "";
      if (filterParams && filterParams.includes("farmerId=")) {
        const match = filterParams.match(/farmerId=([^&]+)/);
        if (match) {
          farmerId = match[1];
        }
      }

      const url = allRoutes.milkCollection.list(
        farmerId,
        undefined,
        undefined,
        selectedShift === "" ? undefined : selectedShift,
        dairyId != undefined ? dairyId : undefined,
        getTodayDateString(),
      );

      return apiCall(url, "get");
    },
    {
      autoExecute: true,
    },
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

  const apiMilkEntries: MilkEntry[] = Array.isArray(milkData?.data)
    ? milkData.data
    : [];

  const pendingLocalEntries = localMilkEntries.filter(isUnsyncedEntry);

  const milkEntries: MilkEntry[] = canManageMilk
    ? isOnline
      ? [
          ...pendingLocalEntries.map(mapLocalEntryToMilkEntry),
          ...apiMilkEntries,
        ]
      : pendingLocalEntries.map(mapLocalEntryToMilkEntry)
    : apiMilkEntries;

  const listLoading = canManageMilk
    ? isOnline
      ? milkLoading || localMilkLoading
      : localMilkLoading
    : milkLoading;

  const resetForm = () => {
    setSelectedFarmer("");
    setFat("");
    setSnf("");
    setQuantity("");
    setShift(getDefaultShift());
    setDate(new Date().toISOString().split("T")[0]);
  };

  const buildMilkPayload = (): MilkCollectionPayload | null => {
    if (!selectedFarmer || !fat || !snf || !quantity) return null;

    const fatValue = parseFloat(fat);
    const snfValue = parseFloat(snf);
    const quantityValue = parseFloat(quantity);
    const financials = calculateMilkEntryFinancials(
      fatValue,
      snfValue,
      quantityValue,
      milkRateSettings,
    );

    return {
      farmerId: parseInt(selectedFarmer, 10),
      dairyId: selectedDairyId ?? user?.dairyId ?? undefined,
      date,
      shift,
      quantity: quantityValue,
      fat: fatValue,
      fatRate: parseFloat(milkRateSettings.fatRate),
      snf: snfValue,
      snfRate: parseFloat(milkRateSettings.snfRate),
      rate: financials.rate,
      amount: financials.amount,
      subsidyDeduction: financials.subsidyDeduction,
      subsidyAmount: financials.subsidyAmount,
      totalAmount: financials.totalAmount, 
    };
  };

  const getSelectedFarmerName = () =>
    farmers.find((farmer) => farmer.id.toString() === selectedFarmer)?.name ??
    "Unknown Farmer";

  function handleOfflineSaveError(error: unknown) {
    if (error instanceof DuplicateOfflineMilkEntryError) {
      const { existingEntry } = error;
      toast.error(
        t("milkCollection.duplicateOfflineEntry", {
          farmer: existingEntry.farmerName,
          date: formatDisplayDate(existingEntry.date),
          shift: t(`milkCollection.${existingEntry.shift}`),
        }),
      );
      return;
    }

    console.error("Error saving offline milk entry:", error);
    toast.error(t("milkCollection.failedToSaveOffline"));
  }

  const saveMilkEntryOffline = async (payload: MilkCollectionPayload) => {
    await saveOfflineMilkEntry(payload, getSelectedFarmerName());
    toast.info(t("milkCollection.savedOffline"));
    await loadLocalMilkEntries();
    resetForm();
  };

  const saveMilkEntryOnline = async (payload: MilkCollectionPayload) => {
    await collectMilk(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const milkPayload = buildMilkPayload();
    if (!milkPayload) return;

    if (isEditMode && editingEntry) {
      if (!isOnline) {
        toast.error(t("milkCollection.editRequiresOnline"));
        return;
      }

      setLoading(true);
      await updateMilk({ id: editingEntry.id, updateData: milkPayload });
      setLoading(false);
      return;
    }

    setLoading(true);

    if (!isSystemOnline()) {
      try {
        await saveMilkEntryOffline(milkPayload);
      } catch (error) {
        handleOfflineSaveError(error);
      } finally {
        setLoading(false);
      }
      return;
    }

    await saveMilkEntryOnline(milkPayload);
    setLoading(false);
  };

  const handleSaveAndPrint = async (e: React.FormEvent) => {
    e.preventDefault();

    const milkPayload = buildMilkPayload();
    if (!milkPayload) return;

    if (isEditMode && editingEntry && !isOnline) {
      toast.error(t("milkCollection.editRequiresOnline"));
      return;
    }

    setLoading(true);
    const farmerName = getSelectedFarmerName();
    const isLocalSave = !isEditMode && !isSystemOnline();

    try {
      if (isEditMode && editingEntry) {
        await updateMilk({ id: editingEntry.id, updateData: milkPayload });
      } else if (isLocalSave) {
        await saveOfflineMilkEntry(milkPayload, farmerName);
        toast.info(t("milkCollection.savedOffline"));
        await loadLocalMilkEntries();
      } else {
        await saveMilkEntryOnline(milkPayload);
      }

      const milkEntry = buildMilkEntryFromPayload(milkPayload, farmerName, isLocalSave);
      const receipt = buildReceiptDataFromEntry(milkEntry);

      setReceiptData(receipt);
      setSavedMilkEntry(milkEntry);
      setIsReceiptModalOpen(true);
      resetForm();
    } catch (error) {
      handleOfflineSaveError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (savedMilkEntry) {
      printMilkEntryReceipt(savedMilkEntry);
    }
  };

  const handlePrintEntry = async (entry: MilkEntry) => {
    const entryKey = entry.localId ?? entry.id;
    setPrintingEntryId(entryKey);

    try {
      if (entry.id > 0 && !entry.isLocal && isSystemOnline()) {
        const receipt = await fetchMilkPrintReceipt(entry.id);
        if (receipt) {
          printMilkReceiptDocument(receipt);
          return;
        }

        toast.error(t("milkCollection.printReceiptFailed"));
        return;
      }

      printMilkEntryReceipt(entry);
    } catch (error) {
      console.error("Failed to print milk receipt:", error);
      toast.error(t("milkCollection.printReceiptFailed"));
    } finally {
      setPrintingEntryId(null);
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
    if (!canManageMilk || !isOnline || isSyncingOfflineRef.current) return;

    let active = true;
    isSyncingOfflineRef.current = true;

    async function syncPendingEntries() {
      try {
        const { synced, failed, message } = await syncOfflineMilkEntries();
        if (!active) return;

        await loadLocalMilkEntries();

        if (synced > 0) {
          toast.success(message ?? t("dashboard.offlineMilkEntriesSynced", { count: synced }));
          fetchMilk();
        }

        if (failed > 0) {
          toast.error(
            t("dashboard.offlineMilkEntriesSyncFailed", { count: failed }),
          );
        }
      } catch (error) {
        console.error("Failed to sync offline milk entries:", error);
      } finally {
        isSyncingOfflineRef.current = false;
      }
    }

    syncPendingEntries();

    return () => {
      active = false;
    };
  }, [canManageMilk, isOnline]);

  useEffect(() => {
    if (isOnline) {
      fetchMilk();
    }
  }, [selectedShift, isOnline]);
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Milk className="h-6 w-6 text-primary" />
            {t("milkCollection.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("milkCollection.subtitle")}
          </p>
        </div>
      </div>
 

      {/* Milk Entry Form - Only show for admin/dairy users */}
      {canManageMilk && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <CardTitle className="text-lg font-semibold">
                  {isEditMode
                    ? t("milkCollection.editEntry")
                    : t("milkCollection.addEntry")}
                </CardTitle>
                <div className="flex flex-row flex-nowrap items-end gap-3 shrink-0">
                  <div className="min-w-[140px] space-y-2">
                    {/* <Label htmlFor="date">{t("milkCollection.date")}</Label> */}
                    <DateInput
                      id="date"
                      className="w-full"
                      value={date}
                      onChange={(newDate) => {
                        setDate(newDate);
                        if (
                          !isEditMode &&
                          newDate === new Date().toISOString().split("T")[0]
                        ) {
                          setShift(getDefaultShift());
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="min-w-[130px] space-y-2">
                   {/*  <Label htmlFor="shift">{t("milkCollection.shift")}</Label> */}
                    <Select
                      value={shift}
                      onValueChange={(value: "morning" | "evening") =>
                        setShift(value)
                      }
                    >
                      <SelectTrigger id="shift" className="w-full">
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row flex-nowrap items-end gap-3 overflow-x-auto pb-1">
                <div className="min-w-[210px] flex-1 space-y-2">
                  <Label htmlFor="farmer">
                    {t("milkCollection.farmerName")}
                  </Label>
                  <SearchableFarmerSelect
                    id="farmer"
                    farmers={farmers}
                    value={selectedFarmer}
                    onValueChange={setSelectedFarmer}
                    disabled={farmersLoading}
                    placeholder={t("milkCollection.selectFarmer")}
                  />
                </div>

                <div className="min-w-[110px] flex-1 space-y-2">
                  <Label htmlFor="fat">{t("milkCollection.fat")}</Label>
                  <Input
                    id="fat"
                    type="text" 
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>

                <div className="min-w-[110px] flex-1 space-y-2">
                  <Label htmlFor="snf">{t("milkCollection.snf")}</Label>
                  <Input
                    id="snf"
                    type="text"
                    value={snf}
                    onChange={(e) => setSnf(e.target.value)}
                    placeholder="0.0"
                     
                  />
                </div>

                <div className="min-w-[130px] flex-1 space-y-2">
                  <Label htmlFor="quantity">
                    {t("milkCollection.quantity")}
                  </Label>
                  <Input
                    id="quantity"
                    type="text" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>

                <div className="shrink-0 space-y-2">
                  <Label className="invisible select-none" aria-hidden="true">
                    .
                  </Label>
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
                </div>
              </div>
            </CardContent>
          </form>
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
          <CardTitle className="text-lg font-semibold">
            <div className="flex justify-between items-center gap-2">
              {isFarmerUser
                ? t("milkCollection.myCollectionList")
                : t("milkCollection.todaysCollection")}
              <Select
                value={selectedShift || "all"}
                onValueChange={(value) =>
                  setSelectedShift(value === "all" ? "" : (value as "morning" | "evening"))
                }
              >
                <SelectTrigger className="w-46">
                  <SelectValue placeholder={t("milkCollection.selectShift")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("milkCollection.allShifts")}</SelectItem>
                  <SelectItem value="morning">{t("milkCollection.morning")}</SelectItem>
                  <SelectItem value="evening">{t("milkCollection.evening")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
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
                  <TableHead>{t("milkCollection.total")} </TableHead>
                  <TableHead>{t("milkCollection.subsidyDeductionAmount")} </TableHead>
                  <TableHead>{t("milkCollection.netAmount")} (₹)</TableHead>
                  {canManageMilk && (
                    <TableHead>{t("common.actions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {milkEntries.map((entry) => (
                  <TableRow key={entry.localId ?? entry.id}>
                    {!isFarmerUser && (
                      <TableCell>{entry.farmer?.name || "N/A"}</TableCell>
                    )}
                    <TableCell>
                      {formatDisplayDate(entry.date)}
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
                        parseFloat(entry.amount?.toString() || "0") || 0
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                     - ₹
                      {(
                        parseFloat(entry.subsidyAmount?.toString() || "0") || 0
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ₹
                      {(
                        parseFloat(entry.totalAmount?.toString() || "0") || 0
                      ).toFixed(2)}
                    </TableCell>
                    {canManageMilk && (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintEntry(entry)}
                            disabled={printingEntryId === (entry.localId ?? entry.id)}
                          >
                            {printingEntryId === (entry.localId ?? entry.id)
                              ? t("common.loading")
                              : t("common.print")}
                          </Button>
                          {!entry.isLocal && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                              disabled={isEditMode}
                            >
                              {t("common.edit")}
                            </Button>
                          )}
                        </div>
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
            {receiptData && <Receipt receipt={receiptData} />}
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


