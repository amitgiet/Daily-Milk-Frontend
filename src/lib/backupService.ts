import {
  OFFLINE_MILK_COLLECTIONS_STORE,
  openDairyBookDb,
  SETTINGS_STORE,
} from "@/lib/indexedDb";
import { belongsToAuthDairy } from "@/lib/authSession";
import {
  getOfflineMilkEntries,
  isUnsyncedEntry,
  type OfflineMilkEntry,
} from "@/lib/milkCollectionStorage";
import {
  FARMERS_BACKUP_FILENAME,
  MILKRATE_BACKUP_FILENAME,
  MILK_BACKUP_FILENAME,
  SYNC_LOG_FILENAME,
} from "@/lib/backupFileNames";
import { collectFarmersBackupPayload, collectMilkRateBackupPayload } from "@/lib/localDataExport";
import type {
  BackupMetadata,
  BackupStatus,
  MilkBackupFile,
  RestoreFromBackupResult,
  SelectBackupFolderResult,
  SyncLogEntry,
  SyncLogFile,
  SyncResultSummary,
} from "@/types/backup";

export const BACKUP_DIR_HANDLE_KEY = "backupDirectoryHandle";
export const BACKUP_META_KEY = "backupMetadata";
export {
  FARMERS_BACKUP_FILENAME,
  MILKRATE_BACKUP_FILENAME,
  MILK_BACKUP_FILENAME,
  SYNC_LOG_FILENAME,
} from "@/lib/backupFileNames";
export const BACKUP_STATUS_UPDATED_EVENT = "backup-status-updated";
export const MAX_SYNC_LOG_EVENTS = 500;

const DEFAULT_BACKUP_METADATA: BackupMetadata = {
  folderName: "",
  selectedAt: "",
  lastBackupAt: null,
  lastSyncAt: null,
  status: "not_configured",
  lastError: null,
};

export class BackupError extends Error {
  code: import("@/types/backup").BackupErrorCode;

  constructor(
    message: string,
    code: import("@/types/backup").BackupErrorCode,
  ) {
    super(message);
    this.name = "BackupError";
    this.code = code;
  }
}

function createLogId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function notifyBackupStatusUpdated() {
  window.dispatchEvent(new CustomEvent(BACKUP_STATUS_UPDATED_EVENT));
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDairyBookDb();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, "readonly");
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);
      let result: T | null = null;

      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () =>
        reject(transaction.error ?? new Error(`Failed to read ${key} from IndexedDB`));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error(`IndexedDB read aborted for ${key}`));

      request.onerror = () =>
        reject(request.error ?? new Error(`Failed to read ${key} from IndexedDB`));
      request.onsuccess = () => {
        result = (request.result as T | undefined) ?? null;
      };
    });
  } finally {
    db.close();
  }
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, "readwrite");
      const request = transaction.objectStore(SETTINGS_STORE).put(value, key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error(`Failed to write ${key} to IndexedDB`));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error(`IndexedDB write aborted for ${key}`));

      request.onerror = () =>
        reject(request.error ?? new Error(`Failed to put ${key} into IndexedDB`));
    });
  } finally {
    db.close();
  }
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, "readwrite");
      const request = transaction.objectStore(SETTINGS_STORE).delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error(`Failed to delete ${key} from IndexedDB`));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error(`IndexedDB delete aborted for ${key}`));

      request.onerror = () =>
        reject(request.error ?? new Error(`Failed to delete ${key} from IndexedDB`));
    });
  } finally {
    db.close();
  }
}

export class BackupService {
  supportsDirectoryPicker(): boolean {
    return this.getDirectoryPickerUnsupportedReason() === null;
  }

  getDirectoryPickerUnsupportedReason():
    | "browser"
    | "secure_context"
    | null {
    if (typeof window === "undefined") return "browser";
    if (typeof window.showDirectoryPicker !== "function") return "browser";
    if (!window.isSecureContext) return "secure_context";
    return null;
  }

  async pickBackupDirectory(): Promise<FileSystemDirectoryHandle | null> {
    const unsupportedReason = this.getDirectoryPickerUnsupportedReason();
    if (unsupportedReason === "browser") {
      throw new BackupError(
        "Folder backup is not supported in this browser. Use Chrome or Edge.",
        "UNSUPPORTED",
      );
    }

    if (unsupportedReason === "secure_context") {
      throw new BackupError(
        "Backup folder access requires HTTPS or localhost. Open the app on https:// or http://localhost.",
        "UNSUPPORTED",
      );
    }

    try {
      return await window.showDirectoryPicker!({
        id: "dairybook-backup-folder",
        mode: "readwrite",
      });
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return null;
      }

      if ((error as DOMException)?.name === "SecurityError") {
        throw new BackupError(
          "Browser blocked folder access. Use HTTPS or localhost and try again.",
          "UNSUPPORTED",
        );
      }

      throw new BackupError(
        error instanceof Error ? error.message : "Failed to open folder picker",
        "IO_ERROR",
      );
    }
  }

  async configureBackupFolder(
    directory: FileSystemDirectoryHandle,
  ): Promise<SelectBackupFolderResult> {
    const hasPermission = await this.ensureWritePermission(directory);
    if (!hasPermission) {
      throw new BackupError(
        "Write permission to the selected folder was denied.",
        "PERMISSION_DENIED",
      );
    }

    await idbPut(BACKUP_DIR_HANDLE_KEY, directory);
    await this.initializeBackupFiles(directory);

    let metadata = await this.saveBackupMetadata({
      folderName: directory.name,
      selectedAt: new Date().toISOString(),
      lastBackupAt: null,
      lastSyncAt: null,
      status: "idle",
      lastError: null,
    });

    try {
      await this.updateBackupFile(directory);
      metadata = await this.getBackupMetadata();
    } catch (error) {
      console.error("Failed to create initial milk-backup.json:", error);
      metadata = await this.saveBackupMetadata({
        status: "error",
        lastError:
          error instanceof Error
            ? error.message
            : "Failed to create initial milk-backup.json",
      });
    }

    try {
      await this.writeSyncLog(
        {
          action: "backup_updated",
          message: `Backup folder selected: ${directory.name}`,
        },
        directory,
      );
    } catch (error) {
      console.error("Failed to create initial sync-log.json:", error);
    }

    return { folderName: directory.name, metadata };
  }

  async getStoredBackupFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
    return idbGet<FileSystemDirectoryHandle>(BACKUP_DIR_HANDLE_KEY);
  }

  async getBackupMetadata(): Promise<BackupMetadata> {
    const metadata = await idbGet<BackupMetadata>(BACKUP_META_KEY);
    return metadata ?? { ...DEFAULT_BACKUP_METADATA };
  }

  private async saveBackupMetadata(
    partial: Partial<BackupMetadata>,
  ): Promise<BackupMetadata> {
    const current = await this.getBackupMetadata();
    const next: BackupMetadata = { ...current, ...partial };
    await idbPut(BACKUP_META_KEY, next);
    notifyBackupStatusUpdated();
    return next;
  }

  private async ensureWritePermission(
    handle: FileSystemDirectoryHandle,
  ): Promise<boolean> {
    const descriptor: FileSystemHandlePermissionDescriptor = {
      mode: "readwrite",
    };

    if ((await handle.queryPermission(descriptor)) === "granted") {
      return true;
    }

    if ((await handle.requestPermission(descriptor)) === "granted") {
      return true;
    }

    return false;
  }

  async verifyFolderAccess(): Promise<FileSystemDirectoryHandle | null> {
    const handle = await this.getStoredBackupFolderHandle();
    if (!handle) return null;

    try {
      const hasPermission = await this.ensureWritePermission(handle);
      if (!hasPermission) {
        await this.saveBackupMetadata({
          status: "permission_revoked",
          lastError: "Folder permission was revoked. Please reselect the backup folder.",
        });
        return null;
      }

      if ((await this.getBackupMetadata()).status === "permission_revoked") {
        await this.saveBackupMetadata({
          status: "idle",
          lastError: null,
        });
      }

      return handle;
    } catch (error) {
      console.error("Failed to verify backup folder access:", error);
      await this.saveBackupMetadata({
        status: "error",
        lastError: error instanceof Error ? error.message : "Failed to access backup folder",
      });
      return null;
    }
  }

  private async getOrCreateFileHandle(
    directory: FileSystemDirectoryHandle,
    filename: string,
  ): Promise<FileSystemFileHandle> {
    return directory.getFileHandle(filename, { create: true });
  }

  private async readJsonFromDirectory<T>(
    directory: FileSystemDirectoryHandle,
    filename: string,
    fallback: T,
  ): Promise<T> {
    try {
      const fileHandle = await directory.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text.trim()) return fallback;
      return JSON.parse(text) as T;
    } catch (error) {
      if ((error as DOMException)?.name === "NotFoundError") {
        return fallback;
      }
      throw error;
    }
  }

  private async writeJsonToDirectory(
    directory: FileSystemDirectoryHandle,
    filename: string,
    data: unknown,
  ): Promise<void> {
    const fileHandle = await this.getOrCreateFileHandle(directory, filename);
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  private createEmptyMilkBackupFile(): MilkBackupFile {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      entries: [],
    };
  }

  private createEmptySyncLogFile(): SyncLogFile {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      events: [],
    };
  }

  async initializeBackupFiles(
    directory: FileSystemDirectoryHandle,
  ): Promise<void> {
    const milkBackup = await this.readJsonFromDirectory(
      directory,
      MILK_BACKUP_FILENAME,
      this.createEmptyMilkBackupFile(),
    );
    const syncLog = await this.readJsonFromDirectory(
      directory,
      SYNC_LOG_FILENAME,
      this.createEmptySyncLogFile(),
    );

    await this.writeJsonToDirectory(directory, MILK_BACKUP_FILENAME, milkBackup);
    await this.writeJsonToDirectory(directory, SYNC_LOG_FILENAME, syncLog);
    await this.writeAuxiliaryBackupFiles(directory);
  }

  async writeMilkRateBackup(
    directoryHandle?: FileSystemDirectoryHandle,
  ): Promise<void> {
    const directory = directoryHandle ?? (await this.verifyFolderAccess());
    if (!directory) return;

    const payload = await collectMilkRateBackupPayload();
    await this.writeJsonToDirectory(directory, MILKRATE_BACKUP_FILENAME, payload);
  }

  async writeFarmersBackup(
    directoryHandle?: FileSystemDirectoryHandle,
  ): Promise<void> {
    const directory = directoryHandle ?? (await this.verifyFolderAccess());
    if (!directory) return;

    const payload = await collectFarmersBackupPayload();
    await this.writeJsonToDirectory(directory, FARMERS_BACKUP_FILENAME, payload);
  }

  async writeAuxiliaryBackupFiles(
    directoryHandle?: FileSystemDirectoryHandle,
  ): Promise<{ milkRateFileName: string; farmersFileName: string }> {
    const directory = directoryHandle ?? (await this.verifyFolderAccess());
    if (!directory) {
      throw new BackupError(
        "No backup folder configured. Select a backup folder first.",
        "NOT_CONFIGURED",
      );
    }

    await Promise.all([
      this.writeMilkRateBackup(directory),
      this.writeFarmersBackup(directory),
    ]);

    return {
      milkRateFileName: MILKRATE_BACKUP_FILENAME,
      farmersFileName: FARMERS_BACKUP_FILENAME,
    };
  }

  private async writeAuxiliaryBackupFilesIfConfigured(
    directoryHandle?: FileSystemDirectoryHandle,
  ): Promise<void> {
    try {
      await this.writeAuxiliaryBackupFiles(directoryHandle);
    } catch (error) {
      console.error("Failed to write milkrate-backup.json or farmers-backup.json:", error);
    }
  }

  async selectBackupFolder(): Promise<SelectBackupFolderResult | null> {
    const directory = await this.pickBackupDirectory();
    if (!directory) return null;
    return this.configureBackupFolder(directory);
  }

  async clearBackupFolder(): Promise<void> {
    await idbDelete(BACKUP_DIR_HANDLE_KEY);
    await idbPut(BACKUP_META_KEY, {
      ...DEFAULT_BACKUP_METADATA,
      status: "not_configured",
    });
    notifyBackupStatusUpdated();
  }

  async updateBackupFile(
    directoryHandle?: FileSystemDirectoryHandle,
  ): Promise<void> {
    const directory = directoryHandle ?? (await this.verifyFolderAccess());
    if (!directory) return;

    await this.saveBackupMetadata({ status: "backing_up", lastError: null });

    try {
      const entries = await getOfflineMilkEntries();
      const payload: MilkBackupFile = {
        version: 1,
        updatedAt: new Date().toISOString(),
        entries,
      };

      await this.writeJsonToDirectory(directory, MILK_BACKUP_FILENAME, payload);
      await this.saveBackupMetadata({
        status: "idle",
        lastBackupAt: payload.updatedAt,
        lastError: null,
      });
      await this.writeAuxiliaryBackupFilesIfConfigured(directory);
    } catch (error) {
      console.error("Failed to update milk-backup.json:", error);
      await this.saveBackupMetadata({
        status: "error",
        lastError:
          error instanceof Error ? error.message : "Failed to update milk-backup.json",
      });
      throw error;
    }
  }

  async saveMilkEntry(entry: OfflineMilkEntry): Promise<void> {
    const directory = await this.verifyFolderAccess();
    if (!directory) return;

    try {
      const current = await this.readJsonFromDirectory(
        directory,
        MILK_BACKUP_FILENAME,
        this.createEmptyMilkBackupFile(),
      );

      const existingIndex = current.entries.findIndex(
        (item) => item.localId === entry.localId,
      );
      const nextEntries =
        existingIndex >= 0
          ? current.entries.map((item, index) =>
              index === existingIndex ? entry : item,
            )
          : [...current.entries, entry];

      const payload: MilkBackupFile = {
        version: 1,
        updatedAt: new Date().toISOString(),
        entries: nextEntries,
      };

      await this.writeJsonToDirectory(directory, MILK_BACKUP_FILENAME, payload);
      await this.saveBackupMetadata({
        status: "idle",
        lastBackupAt: payload.updatedAt,
        lastError: null,
      });
      await this.writeAuxiliaryBackupFilesIfConfigured(directory);
    } catch (error) {
      console.error("Failed to save milk entry to backup folder:", error);
      await this.saveBackupMetadata({
        status: "error",
        lastError:
          error instanceof Error ? error.message : "Failed to save milk entry backup",
      });
    }
  }

  async writeSyncLog(
    event: Omit<SyncLogEntry, "id" | "timestamp"> & {
      id?: string;
      timestamp?: string;
    },
    directoryHandle?: FileSystemDirectoryHandle,
  ): Promise<void> {
    const directory = directoryHandle ?? (await this.verifyFolderAccess());
    if (!directory) return;

    const current = await this.readJsonFromDirectory(
      directory,
      SYNC_LOG_FILENAME,
      this.createEmptySyncLogFile(),
    );

    const nextEvent: SyncLogEntry = {
      id: event.id ?? createLogId(),
      timestamp: event.timestamp ?? new Date().toISOString(),
      action: event.action,
      localId: event.localId,
      message: event.message,
      syncedCount: event.syncedCount,
      failedCount: event.failedCount,
    };

    const events = [...current.events, nextEvent].slice(-MAX_SYNC_LOG_EVENTS);
    const payload: SyncLogFile = {
      version: 1,
      updatedAt: new Date().toISOString(),
      events,
    };

    await this.writeJsonToDirectory(directory, SYNC_LOG_FILENAME, payload);

    if (event.action === "sync_completed") {
      await this.saveBackupMetadata({
        lastSyncAt: payload.updatedAt,
        status: "idle",
      });
    }
  }

  async recordSyncResult(summary: SyncResultSummary): Promise<void> {
    const directory = await this.verifyFolderAccess();
    if (!directory) return;

    await this.saveBackupMetadata({ status: "syncing", lastError: null });

    try {
      if (summary.synced > 0 || summary.failed > 0) {
        await this.writeSyncLog({
          action: summary.failed > 0 ? "sync_failed" : "sync_completed",
          message:
            summary.failed > 0
              ? `Sync finished with ${summary.synced} synced and ${summary.failed} failed entries`
              : `Successfully synced ${summary.synced} entries`,
          syncedCount: summary.synced,
          failedCount: summary.failed,
        });
      }

      await this.updateBackupFile();
    } catch (error) {
      console.error("Failed to record sync result in backup folder:", error);
      await this.saveBackupMetadata({
        status: "error",
        lastError:
          error instanceof Error ? error.message : "Failed to write sync log",
      });
    }
  }

  async getPendingSyncCount(): Promise<number> {
    const entries = await getOfflineMilkEntries();
    return entries.filter(isUnsyncedEntry).length;
  }

  async getBackupFolderState(): Promise<import("@/types/backup").BackupFolderState> {
    const metadata = await this.getBackupMetadata();
    const handle = await this.getStoredBackupFolderHandle();
    const pendingSyncCount = await this.getPendingSyncCount();

    return {
      isSupported: this.supportsDirectoryPicker(),
      isConfigured: Boolean(handle && metadata.folderName),
      folderName: metadata.folderName || null,
      status: metadata.status,
      lastBackupAt: metadata.lastBackupAt,
      lastSyncAt: metadata.lastSyncAt,
      pendingSyncCount,
      permissionRevoked: metadata.status === "permission_revoked",
      lastError: metadata.lastError,
    };
  }

  async restoreFromBackup(): Promise<RestoreFromBackupResult> {
    const directory = await this.verifyFolderAccess();
    if (!directory) {
      throw new BackupError(
        "No backup folder configured or permission denied.",
        "NOT_CONFIGURED",
      );
    }

    const backup = await this.readJsonFromDirectory(
      directory,
      MILK_BACKUP_FILENAME,
      this.createEmptyMilkBackupFile(),
    );

    const existingEntries = await getOfflineMilkEntries();
    const existingIds = new Set(existingEntries.map((entry) => entry.localId));

    let restored = 0;
    let skipped = 0;
    const db = await openDairyBookDb();

    try {
      for (const entry of backup.entries.filter((item) =>
        belongsToAuthDairy(item.dairyId),
      )) {
        if (existingIds.has(entry.localId)) {
          skipped += 1;
          continue;
        }

        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(OFFLINE_MILK_COLLECTIONS_STORE, "readwrite");
          const request = transaction
            .objectStore(OFFLINE_MILK_COLLECTIONS_STORE)
            .put(entry);

          request.onerror = () =>
            reject(request.error ?? new Error("Failed to restore milk entry"));
          request.onsuccess = () => resolve();
        });

        restored += 1;
      }
    } finally {
      db.close();
    }

    if (restored > 0) {
      window.dispatchEvent(new CustomEvent("offline-milk-entries-updated"));
    }

    await this.writeSyncLog({
      action: "restore_completed",
      message: `Restored ${restored} entries from milk-backup.json (${skipped} skipped)`,
    });

    notifyBackupStatusUpdated();
    return { restored, skipped };
  }
}

export const backupService = new BackupService();
