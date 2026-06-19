import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";

export type FarmerPaymentHistoryPeriod = "today" | "month" | "12month";

export interface FarmerPaymentHistoryEntry {
  id: number;
  farmerId: number;
  dairyId: number;
  amount: string | number;
  type: string;
  paymentMethod: string;
  paymentType: string;
  paidAt: string;
  note: string | null;
  milkCollectionIds: number[] | null;
  createdAt: string;
  updatedAt: string;
  farmer?: {
    id: number;
    name: string;
  };
}

function parsePaymentHistoryEntries(payload: unknown): FarmerPaymentHistoryEntry[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const level1 = (payload as { data?: unknown }).data;
  if (Array.isArray(level1)) return level1;

  const level2 = (level1 as { data?: unknown } | undefined)?.data;
  if (Array.isArray(level2)) return level2;

  return [];
}

export async function fetchFarmerPaymentHistory(
  farmerId: number,
  type: FarmerPaymentHistoryPeriod = "month",
) {
  const response = await apiCall(
    allRoutes.dairy.getFarmerPaymentHistory(farmerId, type),
    "get",
  );

  if (!response.success) return [];

  return parsePaymentHistoryEntries(response.data);
}

export function formatPaymentField(value?: string | null) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
