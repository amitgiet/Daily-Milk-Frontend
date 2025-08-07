export interface User {
  id: number;
  name: string;
  phone: string;
  dairyId: number | null;
  email?: string;
  roleId: number;
  username?: string | null;
  isActive?: boolean;
  profilePicture?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface DairySubscription {
  id: number;
  dairyId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  message?: string;
  subscription?: boolean;
  DairySubscription?: DairySubscription;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
  message?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: User;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Role-based permissions
export enum UserRole {
  ADMIN = 1,
  DAIRY = 2,
  FARMER = 3
}

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RoutePermission {
  path: string;
  permissions: Permission;
  roles: UserRole[];
  requiresSubscription?: boolean;
} 