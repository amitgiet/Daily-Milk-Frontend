import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { backupService } from "@/lib/backupService";
import { isSystemOnline } from "@/lib/networkStatus";
import {
  calculateMilkEntryFinancials,
  getMilkRateSettings,
  type MilkRateSettingsRecord,
} from "@/lib/milkRateStorage";
import {
  OFFLINE_MILK_COLLECTIONS_STORE,
  openDairyBookDb,
} from "@/lib/indexedDb";

export const OFFLINE_MILK_ENTRIES_UPDATED_EVENT = "offline-milk-entries-updated";

export interface MilkCollectionPayload {
  farmerId: number;
  dairyId?: number;
  date: string;
  shift: "morning" | "evening";
  quantity: number;
  fat: number;
  fatRate?: number;
  snf: number;
  snfRate: number;
  rate: number;
  amount: number;
  subsidyDeduction : number;
  subsidyAmount : number; 
  totalAmount: number; 
}

export interface OfflineMilkSyncPayload {
  farmerId: number;
  dairyId: number;
  date: string;
  shift: "morning" | "evening";
  quantity: number;
  fat: number;
  fatRate: number;
  snf: number;
  snfRate: number;
  rate: number;
  amount: number;
  subsidyDeduction: number;
  subsidyAmount: number;
  totalAmount: number;
}

export interface OfflineMilkSyncResponse {
  success: boolean;
  message?: string;
}

export interface OfflineMilkEntry extends MilkCollectionPayload {
  localId: string;
  farmerName: string;
  savedAt: string;
  syncStatus: "pending" | "failed" | "synced";
}

export function isUnsyncedEntry(entry: OfflineMilkEntry): boolean {
  return entry.syncStatus !== "synced";
}

export class DuplicateOfflineMilkEntryError extends Error {
  existingEntry: OfflineMilkEntry;

  constructor(existingEntry: OfflineMilkEntry) {
    super("Duplicate offline milk entry");
    this.name = "DuplicateOfflineMilkEntryError";
    this.existingEntry = existingEntry;
  }
}

export interface OfflineMilkEntryKey {
  farmerId: number;
  dairyId?: number;
  date: string;
  shift: "morning" | "evening";
}

export function matchesOfflineMilkEntryKey(
  entry: OfflineMilkEntryKey,
  payload: OfflineMilkEntryKey,
): boolean {
  if (entry.farmerId !== payload.farmerId) return false;
  if (entry.date !== payload.date) return false;
  if (entry.shift !== payload.shift) return false;

  const entryDairyId = entry.dairyId ?? getAuthDairyId();
  const payloadDairyId = payload.dairyId ?? getAuthDairyId();

  return entryDairyId === payloadDairyId;
}

export async function findDuplicateOfflineMilkEntry(
  payload: MilkCollectionPayload,
  excludeLocalId?: string,
): Promise<OfflineMilkEntry | null> {
  const entries = await getOfflineMilkEntries();

  return (
    entries.find(
      (entry) =>
        isUnsyncedEntry(entry) &&
        entry.localId !== excludeLocalId &&
        matchesOfflineMilkEntryKey(entry, payload),
    ) ?? null
  );
}

export function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export async function getTodayLocalMilkEntries(
  shift?: "morning" | "evening",
): Promise<OfflineMilkEntry[]> {
  const today = getTodayDateString();
  const entries = await getOfflineMilkEntries();

  return entries.filter((entry) => {
    if (!isUnsyncedEntry(entry)) return false;
    if (entry.date !== today) return false;
    if (shift && entry.shift !== shift) return false;
    return true;
  });
}

export function aggregateLocalMilkEntriesByFarmer(entries: OfflineMilkEntry[]) {
  const farmerMap = new Map<
    number,
    { farmerId: number; name: string; morning: number; evening: number }
  >();

  for (const entry of entries) {
    const existing = farmerMap.get(entry.farmerId) ?? {
      farmerId: entry.farmerId,
      name: entry.farmerName,
      morning: 0,
      evening: 0,
    };

    if (entry.shift === "morning") {
      existing.morning += entry.quantity;
    } else {
      existing.evening += entry.quantity;
    }

    farmerMap.set(entry.farmerId, existing);
  }

  return Array.from(farmerMap.values()).map((farmer) => ({
    supplier: farmer.name,
    morning: Math.round(farmer.morning * 10) / 10,
    evening: Math.round(farmer.evening * 10) / 10,
    total: Math.round((farmer.morning + farmer.evening) * 10) / 10,
    farmerId: farmer.farmerId,
  }));
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function notifyOfflineEntriesUpdated() {
  window.dispatchEvent(new CustomEvent(OFFLINE_MILK_ENTRIES_UPDATED_EVENT));
}

export { isSystemOnline } from "@/lib/networkStatus";

function roundSyncNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function getAuthDairyId(): number | null {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;

    const user = JSON.parse(rawUser) as { dairyId?: number | null };
    return user.dairyId ?? null;
  } catch {
    return null;
  }
}

function parseSyncApiResponse(data: unknown): OfflineMilkSyncResponse | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  if ("success" in record) {
    return record as unknown as OfflineMilkSyncResponse;
  }

  if (record.data && typeof record.data === "object") {
    return record.data as unknown as OfflineMilkSyncResponse;
  }

  return null;
}

function normalizeOfflineMilkEntryFinancials(
  entry: OfflineMilkEntry,
  settings: MilkRateSettingsRecord,
): OfflineMilkEntry {
  const financials = calculateMilkEntryFinancials(
    Number(entry.fat),
    Number(entry.snf),
    Number(entry.quantity),
    settings,
  );

  return {
    ...entry,
    fatRate: parseFloat(settings.fatRate),
    snfRate: parseFloat(settings.snfRate),
    rate: financials.rate,
    amount: financials.amount,
    subsidyDeduction: financials.subsidyDeduction,
    subsidyAmount: financials.subsidyAmount,
    totalAmount: financials.totalAmount,
  };
}

export async function getOfflineMilkEntries(): Promise<OfflineMilkEntry[]> {
  const db = await openDairyBookDb();
  const settings = await getMilkRateSettings();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_MILK_COLLECTIONS_STORE, "readonly");
      const store = transaction.objectStore(OFFLINE_MILK_COLLECTIONS_STORE);
      const request = store.getAll();

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read offline milk entries"));
      request.onsuccess = () => {
        const entries = (request.result as OfflineMilkEntry[]) ?? [];
        resolve(
          entries
            .map((entry) => normalizeOfflineMilkEntryFinancials(entry, settings))
            .sort(
              (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
            ),
        );
      };
    });
  } finally {
    db.close();
  }
}

export async function saveLocalMilkEntry(
  payload: MilkCollectionPayload,
  farmerName: string,
  syncStatus: OfflineMilkEntry["syncStatus"] = "pending",
): Promise<OfflineMilkEntry> {
  const duplicate = await findDuplicateOfflineMilkEntry(payload);
  if (duplicate) {
    throw new DuplicateOfflineMilkEntryError(duplicate);
  }

  const settings = await getMilkRateSettings();
  const financials = calculateMilkEntryFinancials(
    payload.fat,
    payload.snf,
    payload.quantity,
    settings,
  );

  const entry: OfflineMilkEntry = {
    ...payload,
    fatRate: parseFloat(settings.fatRate),
    snfRate: parseFloat(settings.snfRate),
    rate: financials.rate,
    amount: financials.amount,
    subsidyDeduction: financials.subsidyDeduction,
    subsidyAmount: financials.subsidyAmount,
    totalAmount: financials.totalAmount,
    localId: createLocalId(),
    farmerName,
    savedAt: new Date().toISOString(),
    syncStatus,
  };

  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_MILK_COLLECTIONS_STORE, "readwrite");
      const request = transaction.objectStore(OFFLINE_MILK_COLLECTIONS_STORE).put(entry);

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to save local milk entry"));
      request.onsuccess = () => resolve();
    });
  } finally {
    db.close();
  }

  notifyOfflineEntriesUpdated();

  void backupService.saveMilkEntry(entry).catch((error) => {
    console.error("Failed to write milk entry to backup folder:", error);
  });

  return entry;
}

export async function saveOfflineMilkEntry(
  payload: MilkCollectionPayload,
  farmerName: string,
): Promise<OfflineMilkEntry> {
  return saveLocalMilkEntry(payload, farmerName, "pending");
}

export async function removeOfflineMilkEntry(localId: string): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_MILK_COLLECTIONS_STORE, "readwrite");
      const request = transaction
        .objectStore(OFFLINE_MILK_COLLECTIONS_STORE)
        .delete(localId);

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to delete offline milk entry"));
      request.onsuccess = () => resolve();
    });
  } finally {
    db.close();
  }

  notifyOfflineEntriesUpdated();
}

async function markOfflineMilkEntryFailed(localId: string): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_MILK_COLLECTIONS_STORE, "readwrite");
      const store = transaction.objectStore(OFFLINE_MILK_COLLECTIONS_STORE);
      const request = store.get(localId);

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read offline milk entry"));
      request.onsuccess = () => {
        const entry = request.result as OfflineMilkEntry | undefined;
        if (!entry) {
          resolve();
          return;
        }

        const updateRequest = store.put({ ...entry, syncStatus: "failed" });
        updateRequest.onerror = () =>
          reject(updateRequest.error ?? new Error("Failed to update offline milk entry"));
        updateRequest.onsuccess = () => resolve();
      };
    });
  } finally {
    db.close();
  }

  void backupService.updateBackupFile().catch((error) => {
    console.error("Failed to update backup file after sync failure:", error);
  });
}

export function mapOfflineEntryToSyncPayload(
  entry: OfflineMilkEntry,
): OfflineMilkSyncPayload | null {
  const dairyId = entry.dairyId ?? getAuthDairyId();
  if (dairyId == null) {
    console.warn("Skipping offline milk entry without dairyId:", entry.localId);
    return null;
  }
  return {
    farmerId: entry.farmerId,
    dairyId,
    date: entry.date,
    shift: entry.shift,
    quantity: roundSyncNumber(Number(entry.quantity)),
    fat: roundSyncNumber(Number(entry.fat)),
    fatRate: roundSyncNumber(Number(entry.fatRate ?? 0)),
    snf: roundSyncNumber(Number(entry.snf)),
    snfRate: roundSyncNumber(Number(entry.snfRate ?? 0)),
    rate: roundSyncNumber(Number(entry.rate)),
    amount: roundSyncNumber(Number(entry.amount)),
    subsidyDeduction: roundSyncNumber(Number(entry.subsidyDeduction)),
    subsidyAmount: roundSyncNumber(Number(entry.subsidyAmount)),
    totalAmount: roundSyncNumber(Number(entry.totalAmount)),
  };
}

export async function syncOfflineMilkEntries(): Promise<{
  synced: number;
  failed: number;
  message?: string;
}> {
  if (!isSystemOnline()) {
    return { synced: 0, failed: 0 };
  }

  const entries = await getOfflineMilkEntries();

  for (const entry of entries.filter((item) => item.syncStatus === "synced")) {
    await removeOfflineMilkEntry(entry.localId);
  }

  const pendingEntries = entries.filter(isUnsyncedEntry);
  let synced = 0;
  let failed = 0;

  if (pendingEntries.length > 0) {
    void backupService
      .writeSyncLog({
        action: "sync_started",
        message: `Starting bulk sync for ${pendingEntries.length} pending entries`,
      })
      .catch((error) => {
        console.error("Failed to write sync start log:", error);
      });
  }

  if (pendingEntries.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const entriesToSync = pendingEntries.flatMap((entry) => {
    const payload = mapOfflineEntryToSyncPayload(entry);
    return payload ? [{ entry, payload }] : [];
  });

  const skippedEntries = pendingEntries.filter(
    (entry) => !entriesToSync.some((item) => item.entry.localId === entry.localId),
  );

  for (const entry of skippedEntries) {
    await markOfflineMilkEntryFailed(entry.localId);
  }

  failed = skippedEntries.length;

  if (entriesToSync.length === 0) {
    if (failed > 0) {
      notifyOfflineEntriesUpdated();
    }
    return { synced: 0, failed };
  }

  const syncPayload = entriesToSync.map((item) => item.payload);
  let responseMessage: string | undefined;

  try {
    const response = await apiCall(
      allRoutes.milkCollection.syncOfflineData,
      "post",
      syncPayload,
    );

    const syncResult = parseSyncApiResponse(response.data);
    responseMessage = syncResult?.message;

    const isSyncSuccessful =
      response.success && (syncResult?.success ?? true) === true;

    if (isSyncSuccessful) {
      for (const { entry } of entriesToSync) {
        await removeOfflineMilkEntry(entry.localId);
      }
      synced = entriesToSync.length;

      void backupService
        .writeSyncLog({
          action: "sync_completed",
          message: responseMessage ?? `Successfully synced ${synced} entries`,
          syncedCount: synced,
          failedCount: failed,
        })
        .catch((error) => {
          console.error("Failed to write sync completed log:", error);
        });
    } else {
      console.error("Offline milk sync failed:", {
        payload: syncPayload,
        response: response.data,
        error: "error" in response ? response.error : undefined,
      });

      for (const { entry } of entriesToSync) {
        await markOfflineMilkEntryFailed(entry.localId);
      }
      failed += entriesToSync.length;

      void backupService
        .writeSyncLog({
          action: "sync_failed",
          message: responseMessage ?? `Failed to sync ${failed} entries`,
          syncedCount: 0,
          failedCount: failed,
        })
        .catch((error) => {
          console.error("Failed to write sync failed log:", error);
        });
    }
  } catch (error) {
    console.error("Failed to sync offline milk entries:", error);

    for (const { entry } of entriesToSync) {
      await markOfflineMilkEntryFailed(entry.localId);
    }
    failed += entriesToSync.length;

    void backupService
      .writeSyncLog({
        action: "sync_failed",
        message: `Bulk sync failed for ${failed} entries`,
        syncedCount: 0,
        failedCount: failed,
      })
      .catch((logError) => {
        console.error("Failed to write sync failed log:", logError);
      });
  }

  if (synced > 0 || failed > 0) {
    notifyOfflineEntriesUpdated();
  }

  if (synced > 0 || failed > 0) {
    void backupService.recordSyncResult({ synced, failed }).catch((error) => {
      console.error("Failed to record sync result in backup folder:", error);
    });
  }

  return { synced, failed, message: responseMessage };
}
