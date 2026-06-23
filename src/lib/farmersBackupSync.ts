export function scheduleFarmersBackupSync() {
  void import("@/lib/backupService")
    .then(({ backupService }) => backupService.writeFarmersBackup())
    .catch((error) => {
      console.error("Failed to sync farmers-backup.json:", error);
    });
}
