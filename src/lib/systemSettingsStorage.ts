import { DAIRY_BOOK_DB_NAME } from "@/lib/indexedDb";

export type DataSavingPath = "indexeddb";

export type DisplayMode = "standard" | "legacy";

export const DISPLAY_MODE_CHANGED_EVENT = "dairybook-display-mode-changed";

export const DATA_SAVING_PATH_OPTIONS: DataSavingPath[] = ["indexeddb"];

export interface SystemSettings {
  dataSavingPaths: DataSavingPath[];
  displayMode: DisplayMode;
}

const SYSTEM_SETTINGS_KEY = "dairyBookSystemSettings";

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  dataSavingPaths: ["indexeddb"],
  displayMode: "standard",
};

function isDataSavingPath(value: unknown): value is DataSavingPath {
  return value === "indexeddb";
}

function normalizeDataSavingPaths(_paths: unknown): DataSavingPath[] {
  return DEFAULT_SYSTEM_SETTINGS.dataSavingPaths;
}

function normalizeDisplayMode(value: unknown): DisplayMode {
  return value === "legacy" ? "legacy" : "standard";
}

function parseStoredSettings(parsed: Record<string, unknown>): SystemSettings {
  const base = { ...DEFAULT_SYSTEM_SETTINGS };

  if (Array.isArray(parsed.dataSavingPaths)) {
    base.dataSavingPaths = normalizeDataSavingPaths(parsed.dataSavingPaths);
  } else if (isDataSavingPath(parsed.dataSavingPath)) {
    base.dataSavingPaths = [parsed.dataSavingPath];
  } else if (parsed.dataSavingPath === "jsonFile") {
    base.dataSavingPaths = DEFAULT_SYSTEM_SETTINGS.dataSavingPaths;
  }

  base.displayMode = normalizeDisplayMode(parsed.displayMode);

  return base;
}

export function getDataSavingPathLabel(_path: DataSavingPath = "indexeddb") {
  return "Browser Database (IndexedDB)";
}

export function getDataSavingPathsLabel(_paths?: DataSavingPath[]) {
  return getDataSavingPathLabel("indexeddb");
}

export function getDataSavingPathDescription(_path: DataSavingPath = "indexeddb") {
  return `Stores farmers, milk rates, and offline entries in IndexedDB (${DAIRY_BOOK_DB_NAME}). Recommended for offline use.`;
}

export function getSystemSettings(): SystemSettings {
  try {
    const stored = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (!stored) return DEFAULT_SYSTEM_SETTINGS;

    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return parseStoredSettings(parsed);
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export function saveSystemSettings(settings: SystemSettings): void {
  localStorage.setItem(
    SYSTEM_SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      dataSavingPaths: normalizeDataSavingPaths(settings.dataSavingPaths),
      displayMode: normalizeDisplayMode(settings.displayMode),
    }),
  );

  window.dispatchEvent(new CustomEvent(DISPLAY_MODE_CHANGED_EVENT));
}

export function getActiveDataSavingPaths(): DataSavingPath[] {
  return getSystemSettings().dataSavingPaths;
}

export function isDataSavingPathEnabled(path: DataSavingPath) {
  return getActiveDataSavingPaths().includes(path);
}
