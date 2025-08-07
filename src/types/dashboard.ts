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
}

export interface RecentOrder {
  id: string;
  customer: string;
  items: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  time: string;
  total?: number;
}

export interface MilkCollectionDetail {
  supplier: string;
  morning: number;
  evening: number;
  total: number;
  farmerId?: number;
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