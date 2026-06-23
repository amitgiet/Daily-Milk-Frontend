import { useCallback, useEffect, useState } from "react";
import {
  BACKUP_STATUS_UPDATED_EVENT,
  backupService,
  BackupError,
} from "@/lib/backupService";
import { OFFLINE_MILK_ENTRIES_UPDATED_EVENT } from "@/lib/milkCollectionStorage";
import type { BackupFolderState, BackupStatus } from "@/types/backup";

const INITIAL_STATE: BackupFolderState = {
  isSupported: false,
  isConfigured: false,
  folderName: null,
  status: "not_configured",
  lastBackupAt: null,
  lastSyncAt: null,
  pendingSyncCount: 0,
  permissionRevoked: false,
  lastError: null,
};

export function useBackupFolder() {
  const [state, setState] = useState<BackupFolderState>(INITIAL_STATE);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const nextState = await backupService.getBackupFolderState();
      setState(nextState);
    } catch (error) {
      console.error("Failed to load backup folder state:", error);
    }
  }, []);

  useEffect(() => {
    setState((current) => ({
      ...current,
      isSupported: backupService.supportsDirectoryPicker(),
    }));
    refresh();

    function handleUpdate() {
      refresh();
    }

    window.addEventListener(BACKUP_STATUS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(OFFLINE_MILK_ENTRIES_UPDATED_EVENT, handleUpdate);

    return () => {
      window.removeEventListener(BACKUP_STATUS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(OFFLINE_MILK_ENTRIES_UPDATED_EVENT, handleUpdate);
    };
  }, [refresh]);

  const selectBackupFolder = useCallback(async () => {
    try {
      const directory = await backupService.pickBackupDirectory();
      if (!directory) return null;

      setIsSelecting(true);
      const result = await backupService.configureBackupFolder(directory);
      await refresh();
      return result;
    } finally {
      setIsSelecting(false);
    }
  }, [refresh]);

  const restoreFromBackup = useCallback(async () => {
    setIsRestoring(true);
    try {
      const result = await backupService.restoreFromBackup();
      await refresh();
      return result;
    } finally {
      setIsRestoring(false);
    }
  }, [refresh]);

  const getStatusLabelKey = useCallback((status: BackupStatus) => {
    switch (status) {
      case "backing_up":
        return "settings.backupStatusBackingUp";
      case "syncing":
        return "settings.backupStatusSyncing";
      case "error":
        return "settings.backupStatusError";
      case "permission_revoked":
        return "settings.backupStatusPermissionRevoked";
      case "not_configured":
        return "settings.backupStatusNotConfigured";
      case "idle":
      default:
        return "settings.backupStatusIdle";
    }
  }, []);

  return {
    ...state,
    isSelecting,
    isRestoring,
    refresh,
    selectBackupFolder,
    restoreFromBackup,
    getStatusLabelKey,
    isBackupError: (error: unknown): error is BackupError =>
      error instanceof BackupError,
  };
}
