export interface Dairy {
  id: number;
  dairyCode: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  referralCode: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface DairiesPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DairiesListResponse {
  data: Dairy[];
  pagination?: DairiesPagination;
  total?: number;
}

export function formatDairyCellValue(value?: string | number | null) {
  if (value == null || String(value).trim() === "") return "-";
  return String(value);
}

export function formatDairyFullAddress(
  dairy: Pick<Dairy, "address" | "city" | "state" | "pincode">,
) {
  const parts = [dairy.address, dairy.city, dairy.state, dairy.pincode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) return "-";
  return parts.join(", ");
}
