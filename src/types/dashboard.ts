export interface DashboardStats {
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  totalFarmers?: number;
  totalDairies?: number;
  todayMilkCollection?: number;
  todayOrders?: number;
  todayRevenue?: number;
  lowStockItems?: number;
  recentOrders?: RecentOrder[];
  todayMilkCollectionDetails?: MilkCollectionDetail[];
  lowStockAlerts?: LowStockItem[];

  // Admin specific stats
  activeDairies?: number;
  activeFarmers?: number;
  activeSubscriptions?: number;
  subscriptionPlans?: {
    planId: number;
    planName: string;
    totalPurchased: number;
  }[];

  weeklyMilkCollection?: {
    date: string;
    liters: number;
  }[];
}

export interface RecentOrder {
  id: string;
  customer: string;
  items: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  time: string;
  total?: number;
  dairyId?: number;
}

export interface MilkCollectionDetail {
  supplier: string;
  morning: number;
  evening: number;
  total: number;
  farmerId?: number;
}

export interface TodayMilkCollectionEntry {
  id: number;
  farmerId: number;
  shift: "morning" | "evening";
  quantity: string | number;
  farmer?: {
    id: number;
    name: string;
  };
}

export interface FarmerMilkSummary {
  farmerId: number;
  name: string;
  morning: number;
  evening: number;
  total: number;
}

export interface TodayMilkCollectionsResponse {
  success: boolean;
  message?: string;
  data: TodayMilkCollectionEntry[];
}

export interface FarmerPendingPaymentEntry {
  farmerId: number;
  totalAmount: string | number;
  farmer?: {
    id: number;
    name: string;
    phone: string;
  };
}

export interface FarmersWithPendingPaymentsResponse {
  success: boolean;
  message?: string;
  data: FarmerPendingPaymentEntry[];
}

export interface MilkProgressReportEntry {
  year: number;
  month: number;
  totalQuantity: string | number;
}

export interface MilkProgressReportResponse {
  success: boolean;
  message?: string;
  data: MilkProgressReportEntry[];
}

export interface LowStockItem {
  name: string;
  current: number;
  minimum: number;
  unit: string;
  category?: string;
  id?: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
  message?: string;
} 