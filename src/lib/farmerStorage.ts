import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { isSystemOnline } from "@/lib/networkStatus";
import { dedupeRequest } from "@/lib/requestCache";
import { FARMERS_STORE, openDairyBookDb } from "@/lib/indexedDb";
import { scheduleFarmersBackupSync } from "@/lib/farmersBackupSync";
import { belongsToAuthDairy, getAuthDairyId } from "@/lib/authSession";

export interface StoredFarmer {
  id: number;
  name: string;
  phone: string;
  farmerNumber?: string;
  email?: string;
  address?: string;
  dairyId?: number;
  pendingPayment?: string;
  profilePicture?: string | null;
  profilePictureUrl?: string | null;
  user?: {
    profilePictureUrl?: string | null;
    profilePicture?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  currentMonthMilkAmount?: string;
  status?: "active" | "inactive";
}

export interface AddFarmerPayload {
  name: string;
  phone: string;
  farmerNumber?: string;
  password?: string;
  dairyId?: number;
}

export interface UpdateFarmerPayload {
  name?: string;
  phone?: string;
  farmerNumber?: string;
  password?: string;
  dairyId?: number;
}

function getDairyFarmerRecord(raw: Record<string, unknown>) {
  if (!raw.farmer || typeof raw.farmer !== "object") return null;
  return raw.farmer as Record<string, unknown>;
}

function resolveFarmerNumber(
  raw: Record<string, unknown>,
  dairyFarmer: Record<string, unknown> | null,
) {
  return (
    raw.farmerNumber?.toString() ??
    raw.farmer_number?.toString() ??
    dairyFarmer?.farmerNumber?.toString() ??
    dairyFarmer?.farmer_number?.toString() ??
    ""
  );
}

function normalizeFarmer(raw: unknown): StoredFarmer | null {
  if (!raw || typeof raw !== "object") return null;

  const farmer = raw as Record<string, unknown>;
  const dairyFarmer = getDairyFarmerRecord(farmer);
  const id = Number(farmer.id);
  const name = farmer.name?.toString().trim();

  if (!id || !name) return null;

  return {
    id,
    name,
    phone: farmer.phone?.toString() ?? "",
    farmerNumber: resolveFarmerNumber(farmer, dairyFarmer),
    email: farmer.email?.toString(),
    address: farmer.address?.toString(),
    dairyId:
      farmer.dairyId != null
        ? Number(farmer.dairyId)
        : dairyFarmer?.dairyId != null
          ? Number(dairyFarmer.dairyId)
          : undefined,
    pendingPayment: farmer.pendingPayment?.toString(),
    profilePicture:
      farmer.profilePicture != null ? String(farmer.profilePicture) : undefined,
    profilePictureUrl:
      farmer.profilePictureUrl != null
        ? String(farmer.profilePictureUrl)
        : undefined,
    user: farmer.user as StoredFarmer["user"],
    createdAt: farmer.createdAt?.toString(),
    updatedAt: farmer.updatedAt?.toString(),
    isActive:
      typeof farmer.isActive === "boolean" ? farmer.isActive : undefined,
    currentMonthMilkAmount: farmer.currentMonthMilkAmount?.toString(),
    status:
      farmer.status === "active" || farmer.status === "inactive"
        ? farmer.status
        : undefined,
  };
}

export function parseFarmersFromApiResponse(responseData: unknown): StoredFarmer[] {
  if (!responseData) return [];

  if (Array.isArray(responseData)) {
    return responseData
      .map(normalizeFarmer)
      .filter((farmer): farmer is StoredFarmer => farmer !== null);
  }

  if (typeof responseData !== "object") return [];

  const record = responseData as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data
      .map(normalizeFarmer)
      .filter((farmer): farmer is StoredFarmer => farmer !== null);
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) {
      return nested.data
        .map(normalizeFarmer)
        .filter((farmer): farmer is StoredFarmer => farmer !== null);
    }

    const singleFarmer = normalizeFarmer(record.data);
    if (singleFarmer) return [singleFarmer];
  }

  const singleFarmer = normalizeFarmer(responseData);
  return singleFarmer ? [singleFarmer] : [];
}

function withAuthDairyIdOnSave(farmer: StoredFarmer): StoredFarmer {
  if (farmer.dairyId != null) return farmer;

  const authDairyId = getAuthDairyId();
  if (authDairyId == null) return farmer;

  return { ...farmer, dairyId: authDairyId };
}

function filterFarmersForAuthDairy(farmers: StoredFarmer[]): StoredFarmer[] {
  return farmers.filter((farmer) => belongsToAuthDairy(farmer.dairyId));
}

async function getAllFarmersFromDb(): Promise<StoredFarmer[]> {
  const db = await openDairyBookDb();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(FARMERS_STORE, "readonly");
      const store = transaction.objectStore(FARMERS_STORE);
      const request = store.getAll();

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read farmers"));
      request.onsuccess = () => {
        const farmers = (request.result as StoredFarmer[]) ?? [];
        resolve(
          filterFarmersForAuthDairy(
            farmers.sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
            ),
          ),
        );
      };
    });
  } finally {
    db.close();
  }
}

async function saveAllFarmersToDb(farmers: StoredFarmer[]): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(FARMERS_STORE, "readwrite");
      const store = transaction.objectStore(FARMERS_STORE);

      store.clear();

      farmers.forEach((farmer) => {
        store.put(farmer);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Failed to save farmers"));
    });
  } finally {
    db.close();
  }

  scheduleFarmersBackupSync();
}

export async function upsertFarmerInDb(farmer: StoredFarmer): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(FARMERS_STORE, "readwrite");
      const request = transaction.objectStore(FARMERS_STORE).put(farmer);

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to upsert farmer"));
      request.onsuccess = () => resolve();
    });
  } finally {
    db.close();
  }

  scheduleFarmersBackupSync();
}

export async function removeFarmerFromDb(farmerId: number): Promise<void> {
  const db = await openDairyBookDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(FARMERS_STORE, "readwrite");
      const request = transaction.objectStore(FARMERS_STORE).delete(farmerId);

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to delete farmer"));
      request.onsuccess = () => resolve();
    });
  } finally {
    db.close();
  }

  scheduleFarmersBackupSync();
}

export async function getStoredFarmers(): Promise<StoredFarmer[]> {
  return getAllFarmersFromDb();
}

export async function syncFarmersFromApiResponse(
  responseData: unknown,
): Promise<StoredFarmer[]> {
  const farmers = filterFarmersForAuthDairy(parseFarmersFromApiResponse(responseData));
  await saveAllFarmersToDb(farmers);
  return farmers;
}

export async function fetchAndSyncFarmers(): Promise<StoredFarmer[]> {
  if (!isSystemOnline()) {
    return getAllFarmersFromDb();
  }

  return dedupeRequest("farmers-list", async () => {
    try {
      const response = await apiCall(allRoutes.farmers.getFarmers, "get");
      if (!response.success || !response.data) {
        return getAllFarmersFromDb();
      }

      const farmers = filterFarmersForAuthDairy(parseFarmersFromApiResponse(response.data));
      await saveAllFarmersToDb(farmers);
      return farmers;
    } catch (error) {
      console.error("Failed to fetch farmers from API:", error);
      return getAllFarmersFromDb();
    }
  });
}

async function upsertFarmerFromApiResponse(
  responseData: unknown,
  fallback?: Partial<StoredFarmer>,
): Promise<StoredFarmer | null> {
  const parsedFarmers = parseFarmersFromApiResponse(responseData);
  if (parsedFarmers.length === 1) {
    const farmer = withAuthDairyIdOnSave(parsedFarmers[0]);
    if (!belongsToAuthDairy(farmer.dairyId)) return null;

    await upsertFarmerInDb(farmer);
    return farmer;
  }

  if (fallback?.id) {
    const responseRecord =
      responseData && typeof responseData === "object"
        ? (responseData as Record<string, unknown>)
        : {};
    const farmer = normalizeFarmer({ ...fallback, ...responseRecord });
    if (farmer) {
      const scopedFarmer = withAuthDairyIdOnSave(farmer);
      if (!belongsToAuthDairy(scopedFarmer.dairyId)) return null;

      await upsertFarmerInDb(scopedFarmer);
      return scopedFarmer;
    }
  }

  return null;
}

export async function addAndSyncFarmer(
  payload: AddFarmerPayload,
): Promise<{ success: boolean; farmers: StoredFarmer[] }> {
  try {
    const response = await apiCall(allRoutes.farmers.addFarmer, "post", payload);
    if (!response.success) {
      return { success: false, farmers: await getAllFarmersFromDb() };
    }

    const farmer = await upsertFarmerFromApiResponse(response.data, payload);
    if (farmer) {
      return { success: true, farmers: await getAllFarmersFromDb() };
    }

    const farmers = await fetchAndSyncFarmers();
    return { success: true, farmers };
  } catch (error) {
    console.error("Failed to add farmer:", error);
    return { success: false, farmers: await getAllFarmersFromDb() };
  }
}

export async function updateAndSyncFarmer(
  farmerId: number,
  payload: UpdateFarmerPayload,
  existingFarmer?: StoredFarmer,
): Promise<{ success: boolean; farmers: StoredFarmer[] }> {
  try {
    const response = await apiCall(
      allRoutes.farmers.updateFarmer(farmerId),
      "put",
      payload,
    );

    if (!response.success) {
      return { success: false, farmers: await getAllFarmersFromDb() };
    }

    const farmer = await upsertFarmerFromApiResponse(response.data, {
      ...existingFarmer,
      ...payload,
      id: farmerId,
    });

    if (farmer) {
      return { success: true, farmers: await getAllFarmersFromDb() };
    }

    const updatedFarmer = normalizeFarmer({
      ...existingFarmer,
      ...payload,
      id: farmerId,
    });

    if (updatedFarmer) {
      await upsertFarmerInDb(updatedFarmer);
      return { success: true, farmers: await getAllFarmersFromDb() };
    }

    const farmers = await fetchAndSyncFarmers();
    return { success: true, farmers };
  } catch (error) {
    console.error("Failed to update farmer:", error);
    return { success: false, farmers: await getAllFarmersFromDb() };
  }
}

export async function deleteAndSyncFarmer(
  farmerId: number,
): Promise<{ success: boolean; farmers: StoredFarmer[] }> {
  try {
    const response = await apiCall(allRoutes.farmers.delete(farmerId), "delete");
    if (!response.success) {
      return { success: false, farmers: await getAllFarmersFromDb() };
    }

    await removeFarmerFromDb(farmerId);
    return { success: true, farmers: await getAllFarmersFromDb() };
  } catch (error) {
    console.error("Failed to delete farmer:", error);
    return { success: false, farmers: await getAllFarmersFromDb() };
  }
}
