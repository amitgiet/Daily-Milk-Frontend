import { UserRole, Permission, RoutePermission } from '@/types/auth';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  [UserRole.ADMIN]: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  [UserRole.DAIRY]: {
    canView: true,
    canCreate: false, // Dairy cannot create new items
    canEdit: false,   // Dairy cannot edit existing items
    canDelete: false, // Dairy cannot delete items
  },
  [UserRole.FARMER]: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
};

// Define route permissions with subscription requirements
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Dashboard - All roles can view
  {
    path: '/',
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
  },
  {
    path: '/dashboard',
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
  },

  // Milk Collection - All roles can view, only admin can create/edit
  {
    path: '/milk-collection',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Customers - All roles can view, only admin can create/edit
  {
    path: '/customers',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Orders - All roles can view, only admin can create/edit
  {
    path: '/orders',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Reports - All roles can view
  {
    path: '/reports',
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Settings - Only admin can access
  {
    path: '/settings',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN],
  },

  // Subscription Plans - All roles can view (no subscription required)
  {
    path: '/subscription-plans',
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: false, // No subscription required to view plans
  },

  // Admin Subscription Plans - Only admin can access
  {
    path: '/admin-subscription-plans',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN],
  },
];

// Utility functions
export const hasPermission = (userRole: UserRole, permission: keyof Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

export const canAccessRoute = (userRole: UserRole, path: string, hasSubscription: boolean = false): boolean => {
  const routePermission = ROUTE_PERMISSIONS.find(route => route.path === path);
  if (!routePermission) return false;
  
  // Check if user role is allowed
  if (!routePermission.roles.includes(userRole)) return false;
  
  // For dairy users, check subscription requirement
  if (userRole === UserRole.DAIRY && routePermission.requiresSubscription && !hasSubscription) {
    return false;
  }
  
  return true;
};

export const getRoutePermissions = (userRole: UserRole, path: string, hasSubscription: boolean = false): Permission | null => {
  const routePermission = ROUTE_PERMISSIONS.find(route => route.path === path);
  if (!routePermission || !routePermission.roles.includes(userRole)) {
    return null;
  }
  
  // For dairy users, check subscription requirement
  if (userRole === UserRole.DAIRY && routePermission.requiresSubscription && !hasSubscription) {
    return null;
  }
  
  return routePermission.permissions;
};

export const getRoleName = (roleId: number): string => {
  switch (roleId) {
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.DAIRY:
      return 'Dairy';
    case UserRole.FARMER:
      return 'Farmer';
    default:
      return 'Unknown';
  }
};

export const isAdmin = (roleId: number): boolean => roleId === UserRole.ADMIN;
export const isDairy = (roleId: number): boolean => roleId === UserRole.DAIRY;
export const isFarmer = (roleId: number): boolean => roleId === UserRole.FARMER;

// Subscription-related utilities
export const getSubscriptionStatus = (dairySubscription: any): 'active' | 'inactive' | 'expired' | 'none' => {
  if (!dairySubscription) return 'none';
  
  if (dairySubscription.status === 'active') {
    // Check if subscription is expired
    const endDate = new Date(dairySubscription.endDate);
    const today = new Date();
    if (endDate < today) return 'expired';
    return 'active';
  }
  
  return dairySubscription.status || 'inactive';
};

export const isSubscriptionActive = (dairySubscription: any): boolean => {
  return getSubscriptionStatus(dairySubscription) === 'active';
}; 