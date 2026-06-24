import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { openDairyBookDb, SETTINGS_STORE } from "@/lib/indexedDb";
import { scheduleMilkRateBackupSync } from "@/lib/milkRateBackupSync";
import { isSystemOnline } from "@/lib/networkStatus";
import { dedupeRequest } from "@/lib/requestCache";

export interface MilkRateSettingsRecord {
  fatRate: string;
  snfRate: string;
  govtSubsidy: string;
  fixClrBuff: string;
  fixSnfBuff: string;
  formulaType: "fatOnly" | "fatSnf";
}

interface MilkRateSettingsApiPayload {
  fatRate?: number | string;
  snfRate?: number | string;
  govtSubsidy?: number | string;
  fixClrBuff?: number | string;
  fixSnfBuff?: number | string;
  formulaType?: string;
}

const STORE_NAME = SETTINGS_STORE;
const MILK_RATE_SETTINGS_KEY = "milkRateSettings";
const LEGACY_LOCAL_STORAGE_KEY = "milkRateSettings";

export const DEFAULT_MILK_RATE_SETTINGS: MilkRateSettingsRecord = {
  fatRate: "2.00",
  snfRate: "1.00",
  govtSubsidy: "0.00",
  fixClrBuff: "28",
  fixSnfBuff: "8.5",
  formulaType: "fatOnly",
};

function openDatabase(): Promise<IDBDatabase> {
  return openDairyBookDb();
}

function parseLegacySettings(raw: string): MilkRateSettingsRecord | null {
  try {
    const settings = JSON.parse(raw) as Partial<MilkRateSettingsRecord>;
    if (!settings.fatRate && !settings.snfRate && !settings.formulaType) {
      return null;
    }

    return {
      fatRate: settings.fatRate?.toString() || DEFAULT_MILK_RATE_SETTINGS.fatRate,
      snfRate: settings.snfRate?.toString() || DEFAULT_MILK_RATE_SETTINGS.snfRate,
      govtSubsidy:
        settings.govtSubsidy?.toString() || DEFAULT_MILK_RATE_SETTINGS.govtSubsidy,
      fixClrBuff:
        settings.fixClrBuff?.toString() || DEFAULT_MILK_RATE_SETTINGS.fixClrBuff,
      fixSnfBuff:
        settings.fixSnfBuff?.toString() || DEFAULT_MILK_RATE_SETTINGS.fixSnfBuff,
      formulaType: settings.formulaType || DEFAULT_MILK_RATE_SETTINGS.formulaType,
    };
  } catch {
    return null;
  }
}

function getSetting(db: IDBDatabase, key: string): Promise<MilkRateSettingsRecord | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error ?? new Error("Failed to read setting"));
    request.onsuccess = () => resolve(request.result as MilkRateSettingsRecord | undefined);
  });
}

function putSetting(
  db: IDBDatabase,
  key: string,
  value: MilkRateSettingsRecord,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onerror = () => reject(request.error ?? new Error("Failed to save setting"));
    request.onsuccess = () => resolve();
  });
}

async function migrateLegacyLocalStorage(
  db: IDBDatabase,
): Promise<MilkRateSettingsRecord | null> {
  const legacyValue = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  if (!legacyValue) return null;

  const parsed = parseLegacySettings(legacyValue);
  if (!parsed) return null;

  await putSetting(db, MILK_RATE_SETTINGS_KEY, parsed);
  localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);

  return parsed;
}

export async function getMilkRateSettings(): Promise<MilkRateSettingsRecord> {
  const db = await openDatabase();

  try {
    const stored = await getSetting(db, MILK_RATE_SETTINGS_KEY);
    if (stored) return stored;

    const migrated = await migrateLegacyLocalStorage(db);
    if (migrated) return migrated;

    return DEFAULT_MILK_RATE_SETTINGS;
  } finally {
    db.close();
  }
}

export async function saveMilkRateSettings(
  settings: MilkRateSettingsRecord,
): Promise<void> {
  const db = await openDatabase();

  try {
    await putSetting(db, MILK_RATE_SETTINGS_KEY, settings);
    localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } finally {
    db.close();
  }

  scheduleMilkRateBackupSync();
}

function normalizeFormulaType(value: unknown): MilkRateSettingsRecord["formulaType"] {
  if (value === "fatSnf" || value === "fatAndSnf") return "fatSnf";
  return "fatOnly";
}

function parseMilkRateApiPayload(payload: unknown): MilkRateSettingsApiPayload | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data && typeof record.data === "object") {
    return record.data as MilkRateSettingsApiPayload;
  }

  return record as MilkRateSettingsApiPayload;
}

export function normalizeMilkRateSettings(
  payload: MilkRateSettingsApiPayload,
): MilkRateSettingsRecord {
  return {
    fatRate: payload.fatRate?.toString() || DEFAULT_MILK_RATE_SETTINGS.fatRate,
    snfRate: payload.snfRate?.toString() || DEFAULT_MILK_RATE_SETTINGS.snfRate,
    govtSubsidy:
      payload.govtSubsidy?.toString() || DEFAULT_MILK_RATE_SETTINGS.govtSubsidy,
    fixClrBuff:
      payload.fixClrBuff?.toString() || DEFAULT_MILK_RATE_SETTINGS.fixClrBuff,
    fixSnfBuff:
      payload.fixSnfBuff?.toString() || DEFAULT_MILK_RATE_SETTINGS.fixSnfBuff,
    formulaType: normalizeFormulaType(payload.formulaType),
  };
}

export async function syncMilkRateSettingsFromApiResponse(
  responseData: unknown,
): Promise<MilkRateSettingsRecord | null> {
  const payload = parseMilkRateApiPayload(responseData);
  if (!payload) return null;

  const settings = normalizeMilkRateSettings(payload);
  await saveMilkRateSettings(settings);
  return settings;
}

export async function fetchAndSyncMilkRateSettings(): Promise<MilkRateSettingsRecord> {
  if (!isSystemOnline()) {
    return getMilkRateSettings();
  }

  return dedupeRequest("milk-rate-settings", async () => {
    try {
      const response = await apiCall(allRoutes.dairy.rates, "get");
      if (!response.success || !response.data) {
        return getMilkRateSettings();
      }

      const settings = await syncMilkRateSettingsFromApiResponse(response.data);
      return settings ?? getMilkRateSettings();
    } catch (error) {
      console.error("Failed to fetch milk rate settings from API:", error);
      return getMilkRateSettings();
    }
  });
}

export async function updateAndSyncMilkRateSettings(
  settings: MilkRateSettingsRecord,
): Promise<{ success: boolean; settings: MilkRateSettingsRecord }> {
  try {
    const response = await apiCall(allRoutes.dairy.updateRates, "post", {
      fatRate: parseFloat(settings.fatRate),
      snfRate: parseFloat(settings.snfRate),
      govtSubsidy: parseFloat(settings.govtSubsidy),
      fixClrBuff: parseFloat(settings.fixClrBuff),
      fixSnfBuff: parseFloat(settings.fixSnfBuff),
      formulaType: settings.formulaType,
    });

    if (!response.success) {
      return { success: false, settings };
    }

    const syncedSettings =
      (await syncMilkRateSettingsFromApiResponse(response.data)) ?? settings;

    return { success: true, settings: syncedSettings };
  } catch (error) {
    console.error("Failed to update milk rate settings:", error);
    return { success: false, settings };
  }
}

export function calculateMilkRateFromSettings(
  fatValue: number,
  snfValue: number,
  settings: MilkRateSettingsRecord,
) {
  const fatRate = parseFloat(settings.fatRate) || 0;
  const snfRate = parseFloat(settings.snfRate) || 0;

  if (settings.formulaType === "fatSnf") {
    return fatValue * fatRate + snfValue * snfRate;
  }

  return fatValue * fatRate;
}

export function calculateSNF(fat: number, clr: number) {
  return Number(((clr / 4) + 0.21 * fat + 0.36).toFixed(2));
}

export interface MilkEntryFinancials {
  rate: number;
  amount: number; 
  subsidyDeduction: number;
  subsidyAmount: number;
  totalAmount: number;
}

export function calculateMilkEntryFinancials(
  fatValue: number,
  snfValue: number,
  quantity: number,
  settings: MilkRateSettingsRecord,
): MilkEntryFinancials {
  const rate = calculateMilkRateFromSettings(fatValue, snfValue, settings);
  const govtSubsidy = parseFloat(settings.govtSubsidy) || 0;
  const amount = quantity * rate;
  const pf = govtSubsidy * quantity;
  const totalAmount = amount - pf;

  return {
    rate: Math.round(rate * 100) / 100,
    amount: Math.round(amount * 100) / 100,
    subsidyDeduction : govtSubsidy,
    subsidyAmount : pf,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}
