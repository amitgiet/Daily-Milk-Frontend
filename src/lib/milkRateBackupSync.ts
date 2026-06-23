export function scheduleMilkRateBackupSync() {
  void import("@/lib/backupService")
    .then(({ backupService }) => backupService.writeMilkRateBackup())
    .catch((error) => {
      console.error("Failed to sync milkrate-backup.json:", error);
    });
}
