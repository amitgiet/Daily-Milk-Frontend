export interface SubscriptionPlan {
  id: number;
  name: string;
  durationDays: number;
  price: number | string;
  features: string[] | string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanFormData {
  name: string;
  durationDays: number;
  price: number;
  features: string[];
}

export interface Dairy {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Plan {
  id: number;
  name: string;
  price: string;
  durationDays: number;
}

export interface PendingRequest {
  id: number;
  dairyId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  dairy: Dairy;
  plan: Plan;
}

export interface SubscriptionRequest {
  planId: number;
}

export interface UpdateRequestStatus {
  status: 'active' | 'cancelled';
} 