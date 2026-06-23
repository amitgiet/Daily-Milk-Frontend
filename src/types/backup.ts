import type { OfflineMilkEntry } from "@/lib/milkCollectionStorage";

export type BackupStatus =
  | "idle"
  | "backing_up"
  | "syncing"
  | "error"
  | "permission_revoked"
  | "not_configured";

export type BackupErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "ABORTED"
  | "NOT_CONFIGURED"
  | "IO_ERROR";

export interface BackupMetadata {
  folderName: string;
  selectedAt: string;
  lastBackupAt: string | null;
  lastSyncAt: string | null;
  status: BackupStatus;
  lastError: string | null;
}

export interface MilkBackupFile {
  version: 1;
  updatedAt: string;
  entries: OfflineMilkEntry[];
}

export type SyncLogAction =
  | "sync_started"
  | "sync_completed"
  | "sync_failed"
  | "entry_synced"
  | "entry_failed"
  | "backup_updated"
  | "restore_completed";

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: SyncLogAction;
  localId?: string;
  message: string;
  syncedCount?: number;
  failedCount?: number;
}

export interface SyncLogFile {
  version: 1;
  updatedAt: string;
  events: SyncLogEntry[];
}

export interface SyncResultSummary {
  synced: number;
  failed: number;
  syncedLocalIds?: string[];
  failedLocalIds?: string[];
}

export interface BackupFolderState {
  isSupported: boolean;
  isConfigured: boolean;
  folderName: string | null;
  status: BackupStatus;
  lastBackupAt: string | null;
  lastSyncAt: string | null;
  pendingSyncCount: number;
  permissionRevoked: boolean;
  lastError: string | null;
}

export interface SelectBackupFolderResult {
  folderName: string;
  metadata: BackupMetadata;
}

export interface RestoreFromBackupResult {
  restored: number;
  skipped: number;
}
