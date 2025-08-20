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
    canCreate: false, // Farmers cannot create new items
    canEdit: false,   // Farmers cannot edit existing items
    canDelete: false, // Farmers cannot delete items
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

  // Milk Collection - Farmers can only view their own data, admin/dairy can manage all
  {
    path: '/milk-collection',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Customers - Only admin and dairy can access, farmers cannot
  {
    path: '/customers',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Orders - Only admin and dairy can access, farmers cannot
  {
    path: '/orders',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Reports - Only admin and dairy can access, farmers cannot
  {
    path: '/reports',
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Settings - Only admin can access
  {
    path: '/settings',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN, UserRole.FARMER, UserRole.DAIRY],
  },

  // Subscription Plans - Only admin and dairy can access, farmers cannot
  {
    path: '/subscription-plans',
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: false, // No subscription required to view plans
  },

  // Admin Subscription Plans - Only admin can access
  {
    path: '/admin-subscription-plans',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN],
  },

  // Dairy Listing - Only admin and dairy can access, farmers cannot
  {
    path: '/dairy-listing',
    permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    roles: [UserRole.ADMIN],
    requiresSubscription: false, // Dairy needs subscription to access
  },
];

// Utility functions
export const hasPermission = (userRole: UserRole, permission: keyof Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

export const canAccessRoute = (userRole: UserRole | number, path: string, hasSubscription: boolean = false): boolean => {
  // Convert number to UserRole enum if needed
  const role = typeof userRole === 'number' ? userRole as UserRole : userRole;
  
  const routePermission = ROUTE_PERMISSIONS.find(route => route.path === path);
  if (!routePermission) return false;
  
  // Check if user role is allowed
  if (!routePermission.roles.includes(role)) return false;
  
  // Special handling for roleId 3 (Farmer) - they can access milk collection without subscription
  if (role === UserRole.FARMER && (path === '/milk-collection')) {
    return true;
  }
  
  // For dairy users, check subscription requirement
  if (role === UserRole.DAIRY && routePermission.requiresSubscription && !hasSubscription) {
    return false;
  }
  
  return true;
};

export const getRoutePermissions = (userRole: UserRole | number, path: string, hasSubscription: boolean = false): Permission | null => {
  // Convert number to UserRole enum if needed
  const role = typeof userRole === 'number' ? userRole as UserRole : userRole;
  
  const routePermission = ROUTE_PERMISSIONS.find(route => route.path === path);
  if (!routePermission || !routePermission.roles.includes(role)) {
    return null;
  }
  
  // Special handling for roleId 3 (Farmer) - they can access milk collection without subscription
  if (role === UserRole.FARMER && path === '/milk-collection') {
    return routePermission.permissions;
  }
  
  // For dairy users, check subscription requirement
  if (role === UserRole.DAIRY && routePermission.requiresSubscription && !hasSubscription) {
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