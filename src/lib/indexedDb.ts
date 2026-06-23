export const DAIRY_BOOK_DB_NAME = "dairy-book-admin";
export const DAIRY_BOOK_DB_VERSION = 3;
export const SETTINGS_STORE = "settings";
export const FARMERS_STORE = "farmers";
export const OFFLINE_MILK_COLLECTIONS_STORE = "offlineMilkCollections";

export function openDairyBookDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DAIRY_BOOK_DB_NAME, DAIRY_BOOK_DB_VERSION);

    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }

      if (!db.objectStoreNames.contains(FARMERS_STORE)) {
        db.createObjectStore(FARMERS_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(OFFLINE_MILK_COLLECTIONS_STORE)) {
        db.createObjectStore(OFFLINE_MILK_COLLECTIONS_STORE, {
          keyPath: "localId",
        });
      }
    };
  });
}
