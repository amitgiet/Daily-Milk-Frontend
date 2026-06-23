import { DAIRY_BOOK_DB_NAME } from "@/lib/indexedDb";

export type DataSavingPath = "indexeddb" | "localStorage";

export const DATA_SAVING_PATH_OPTIONS: DataSavingPath[] = [
  "indexeddb",
  "localStorage",
];

export interface SystemSettings {
  dataSavingPaths: DataSavingPath[];
}

const SYSTEM_SETTINGS_KEY = "dairyBookSystemSettings";

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  dataSavingPaths: ["indexeddb"],
};

function isDataSavingPath(value: unknown): value is DataSavingPath {
  return value === "indexeddb" || value === "localStorage";
}

function normalizeDataSavingPaths(paths: unknown): DataSavingPath[] {
  if (!Array.isArray(paths)) return DEFAULT_SYSTEM_SETTINGS.dataSavingPaths;

  const unique = paths.filter(isDataSavingPath);
  return unique.length > 0 ? unique : DEFAULT_SYSTEM_SETTINGS.dataSavingPaths;
}

function parseStoredSettings(parsed: Record<string, unknown>): SystemSettings {
  if (Array.isArray(parsed.dataSavingPaths)) {
    return {
      dataSavingPaths: normalizeDataSavingPaths(parsed.dataSavingPaths),
    };
  }

  if (isDataSavingPath(parsed.dataSavingPath)) {
    return {
      dataSavingPaths: [parsed.dataSavingPath],
    };
  }

  if (parsed.dataSavingPath === "jsonFile") {
    return DEFAULT_SYSTEM_SETTINGS;
  }

  return DEFAULT_SYSTEM_SETTINGS;
}

export function getDataSavingPathLabel(path: DataSavingPath) {
  switch (path) {
    case "localStorage":
      return "Browser Local Storage";
    case "indexeddb":
    default:
      return "Browser Database (IndexedDB)";
  }
}

export function getDataSavingPathsLabel(paths: DataSavingPath[]) {
  return paths.map((path) => getDataSavingPathLabel(path)).join(", ");
}

export function getDataSavingPathDescription(path: DataSavingPath) {
  switch (path) {
    case "localStorage":
      return "Stores settings in browser local storage. Suitable for small data only.";
    case "indexeddb":
    default:
      return `Stores farmers, milk rates, and offline entries in IndexedDB (${DAIRY_BOOK_DB_NAME}). Recommended for offline use.`;
  }
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
    }),
  );
}

export function getActiveDataSavingPaths(): DataSavingPath[] {
  return getSystemSettings().dataSavingPaths;
}

export function isDataSavingPathEnabled(path: DataSavingPath) {
  return getActiveDataSavingPaths().includes(path);
}
