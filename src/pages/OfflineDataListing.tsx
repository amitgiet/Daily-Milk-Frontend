import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CloudOff, RefreshCw, Trash2, Printer, Database } from "lucide-react";
import { toast } from "react-toastify";
import { formatDisplayDate } from "@/lib/dateFormat";
import {
  getOfflineMilkEntries,
  isUnsyncedEntry,
  removeOfflineMilkEntry,
  syncOfflineMilkEntries,
  OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
  type OfflineMilkEntry,
} from "@/lib/milkCollectionStorage";
import {
  buildLocalMilkPrintReceipt,
  printMilkReceiptDocument,
} from "@/lib/milkReceiptPrint";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

type StatusFilter = "all" | "pending" | "failed";
type ShiftFilter = "all" | "morning" | "evening";

function OfflineDataListing() {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();
  const { isFarmerUser } = usePermissions();
  const { user } = useAuth();

  const [entries, setEntries] = useState<OfflineMilkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfflineMilkEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const allEntries = await getOfflineMilkEntries();
      const unsynced = allEntries.filter(isUnsyncedEntry);

      if (isFarmerUser && user?.id) {
        setEntries(unsynced.filter((entry) => entry.farmerId === user.id));
        return;
      }

      setEntries(unsynced);
    } catch (error) {
      console.error("Failed to load offline entries:", error);
      toast.error(t("offlineData.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isFarmerUser, t, user?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    function handleEntriesUpdated() {
      loadEntries();
    }

    window.addEventListener(OFFLINE_MILK_ENTRIES_UPDATED_EVENT, handleEntriesUpdated);
    return () => {
      window.removeEventListener(
        OFFLINE_MILK_ENTRIES_UPDATED_EVENT,
        handleEntriesUpdated,
      );
    };
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.syncStatus !== statusFilter) return false;
      if (shiftFilter !== "all" && entry.shift !== shiftFilter) return false;
      if (query && !entry.farmerName.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [entries, searchQuery, shiftFilter, statusFilter]);

  const stats = useMemo(() => {
    const pending = entries.filter((entry) => entry.syncStatus === "pending").length;
    const failed = entries.filter((entry) => entry.syncStatus === "failed").length;
    const totalQuantity = entries.reduce(
      (sum, entry) => sum + (Number(entry.quantity) || 0),
      0,
    );
    const totalAmount = entries.reduce(
      (sum, entry) => sum + (Number(entry.totalAmount) || 0),
      0,
    );

    return { pending, failed, totalQuantity, totalAmount };
  }, [entries]);

  async function handleSync() {
    if (!isOnline) {
      toast.info(t("offlineData.syncRequiresOnline"));
      return;
    }

    setSyncing(true);
    try {
      const { synced, failed, message } = await syncOfflineMilkEntries();
      await loadEntries();

      if (synced > 0) {
        toast.success(message ?? t("dashboard.offlineMilkEntriesSynced", { count: synced }));
      } else if (failed === 0) {
        toast.info(t("dashboard.noOfflineMilkEntriesToSync"));
      }

      if (failed > 0) {
        toast.error(t("dashboard.offlineMilkEntriesSyncFailed", { count: failed }));
      }
    } catch (error) {
      console.error("Failed to sync offline entries:", error);
      toast.error(t("offlineData.syncFailed"));
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await removeOfflineMilkEntry(deleteTarget.localId);
      toast.success(t("offlineData.deleteSuccess"));
      setDeleteTarget(null);
      await loadEntries();
    } catch (error) {
      console.error("Failed to delete offline entry:", error);
      toast.error(t("offlineData.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  async function handlePrint(entry: OfflineMilkEntry) {
    setPrintingId(entry.localId);
    try {
      printMilkReceiptDocument(
        buildLocalMilkPrintReceipt({
          farmerName: entry.farmerName,
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
    } finally {
      setPrintingId(null);
    }
  }

  function getStatusBadgeVariant(status: OfflineMilkEntry["syncStatus"]) {
    if (status === "failed") return "destructive" as const;
    if (status === "pending") return "secondary" as const;
    return "default" as const;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            {t("offlineData.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("offlineData.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadEntries} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </Button>
          <Button onClick={handleSync} disabled={syncing || !isOnline}>
            <CloudOff className="h-4 w-4 mr-2" />
            {syncing ? t("offlineData.syncing") : t("offlineData.syncNow")}
          </Button>
        </div>
      </div>

      {!isOnline && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t("offlineData.offlineNotice")}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{entries.length}</div>
            <div className="text-sm text-muted-foreground">{t("offlineData.totalEntries")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">{t("offlineData.pending")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">{t("offlineData.failed")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalQuantity.toFixed(1)} L</div>
            <div className="text-sm text-muted-foreground">{t("offlineData.totalQuantity")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("offlineData.listTitle")}</CardTitle>
          <CardDescription>{t("offlineData.listDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <Input
                placeholder={t("offlineData.searchFarmer")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("offlineData.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("offlineData.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("offlineData.pending")}</SelectItem>
                <SelectItem value="failed">{t("offlineData.failed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={shiftFilter}
              onValueChange={(value) => setShiftFilter(value as ShiftFilter)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t("milkCollection.shift")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("milkCollection.allShifts")}</SelectItem>
                <SelectItem value="morning">{t("milkCollection.morning")}</SelectItem>
                <SelectItem value="evening">{t("milkCollection.evening")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {entries.length === 0
                ? t("offlineData.noEntries")
                : t("offlineData.noFilteredEntries")}
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("milkCollection.farmerName")}</TableHead>
                    <TableHead>{t("milkCollection.date")}</TableHead>
                    <TableHead>{t("milkCollection.shift")}</TableHead>
                    <TableHead>{t("offlineData.status")}</TableHead>
                    <TableHead>{t("milkCollection.fat")}</TableHead>
                    <TableHead>{t("milkCollection.snf")}</TableHead>
                    <TableHead>{t("milkCollection.quantity")}</TableHead>
                    <TableHead>{t("milkCollection.rate")}</TableHead>
                    <TableHead>{t("milkCollection.total")}</TableHead>
                    <TableHead>{t("milkCollection.subsidyDeductionAmount")}</TableHead>
                    <TableHead>{t("milkCollection.netAmount")}</TableHead>
                    <TableHead>{t("offlineData.savedAt")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.localId}>
                      <TableCell className="font-medium">{entry.farmerName}</TableCell>
                      <TableCell>{formatDisplayDate(entry.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.shift === "morning" ? "default" : "secondary"}
                        >
                          {t(`milkCollection.${entry.shift}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(entry.syncStatus)}>
                          {t(`offlineData.status_${entry.syncStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(entry.fat).toFixed(1)}%</TableCell>
                      <TableCell>{Number(entry.snf).toFixed(1)}%</TableCell>
                      <TableCell>{Number(entry.quantity).toFixed(1)} L</TableCell>
                      <TableCell>₹{Number(entry.rate).toFixed(2)}</TableCell>
                      <TableCell>₹{Number(entry.amount ?? 0).toFixed(2)}</TableCell>
                      <TableCell>- ₹{Number(entry.subsidyAmount ?? 0).toFixed(2)}</TableCell>
                      <TableCell>₹{Number(entry.totalAmount ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(entry.savedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrint(entry)}
                            disabled={printingId === entry.localId}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(entry)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("offlineData.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("offlineData.deleteConfirm", { farmer: deleteTarget?.farmerName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? t("common.loading") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OfflineDataListing;
