import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";

export interface UnpaidMilkEntry {
  id: number;
  farmerId: number;
  dairyId: number;
  date: string;
  shift: "morning" | "evening";
  quantity: string | number;
  fat: string | number;
  snf: string | number;
  rate: string | number;
  totalAmount: string | number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  farmer?: {
    id: number;
    name: string;
  };
}

export interface UnpaidMilkCollectionsResponse {
  success: boolean;
  message?: string;
  data: UnpaidMilkEntry[];
}

export function getMilkEntryAmount(entry: UnpaidMilkEntry) {
  return Number(entry.totalAmount) || 0;
}

function parseUnpaidMilkEntries(payload: unknown): UnpaidMilkEntry[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const level1 = (payload as { data?: unknown }).data;
  if (Array.isArray(level1)) return level1;

  const level2 = (level1 as { data?: unknown } | undefined)?.data;
  if (Array.isArray(level2)) return level2;

  return [];
}

export async function fetchUnpaidMilkEntries(farmerId: number) {
  const response = await apiCall(
    allRoutes.milkCollection.getUnpaidMilkCollections(farmerId),
    "get",
  );

  if (!response.success) return [];

  return parseUnpaidMilkEntries(response.data);
}
