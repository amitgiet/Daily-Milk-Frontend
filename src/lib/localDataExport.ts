import { getStoredFarmers } from "@/lib/farmerStorage";
import { getMilkRateSettings, type MilkRateSettingsRecord } from "@/lib/milkRateStorage";

export {
  BACKUP_FOLDER_JSON_FILES,
  FARMERS_BACKUP_FILENAME,
  MILKRATE_BACKUP_FILENAME,
  MILK_BACKUP_FILENAME,
  SYNC_LOG_FILENAME,
} from "@/lib/backupFileNames";

export interface MilkRateBackupFile {
  exportedAt: string;
  version: 1;
  milkRateSettings: MilkRateSettingsRecord;
}

export interface FarmersBackupFile {
  exportedAt: string;
  version: 1;
  farmers: Awaited<ReturnType<typeof getStoredFarmers>>;
}

export async function collectMilkRateBackupPayload(): Promise<MilkRateBackupFile> {
  const milkRateSettings = await getMilkRateSettings();

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    milkRateSettings,
  };
}

export async function collectFarmersBackupPayload(): Promise<FarmersBackupFile> {
  const farmers = await getStoredFarmers();

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    farmers,
  };
}

export async function collectAuxiliaryBackupPayloads(): Promise<{
  milkRate: MilkRateBackupFile;
  farmers: FarmersBackupFile;
}> {
  const [milkRate, farmers] = await Promise.all([
    collectMilkRateBackupPayload(),
    collectFarmersBackupPayload(),
  ]);

  return { milkRate, farmers };
}
