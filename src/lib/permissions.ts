import { UserRole, Permission, RoutePermission, DairySubscription } from "@/types/auth";

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
    canEdit: false, // Dairy cannot edit existing items
    canDelete: false, // Dairy cannot delete items
  },
  [UserRole.FARMER]: {
    canView: true,
    canCreate: false, // Farmers cannot create new items
    canEdit: false, // Farmers cannot edit existing items
    canDelete: false, // Farmers cannot delete items
  },
};

// Define route permissions with subscription requirements
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Dashboard - All roles can view
  {
    path: "/",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
  },
  {
    path: "/dashboard",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
  },
  {
    path: "/admin-dashboard",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN],
  },
  {
    path: "/dairy-dashboard",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.DAIRY],
    requiresSubscription: true,
  },

  // Milk Collection - Farmers can only view their own data, admin/dairy can manage all
  {
    path: "/milk-collection",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Offline saved data listing
  {
    path: "/offline-data",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: true,
    },
    roles: [UserRole.DAIRY, UserRole.FARMER],
    requiresSubscription: true,
  },

  // Customers - Only admin and dairy can access, farmers cannot
  {
    path: "/customers",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Orders - Only admin and dairy can access, farmers cannot
  {
    path: "/orders",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Reports - Only admin and dairy can access, farmers cannot
  {
    path: "/reports",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Settings - Only admin can access
  {
    path: "/settings",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN, UserRole.FARMER, UserRole.DAIRY],
  },

  // Subscription Plans - Only admin and dairy can access, farmers cannot
  {
    path: "/subscription-plans",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: false, // No subscription required to view plans
  },

  // Admin Subscription Plans - Only admin can access
  {
    path: "/admin-subscription-plans",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN],
  },
  // Pending Subscriptions - Only admin can access
  {
    path: "/pending-subscriptions",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN],
  },

  // Diary Dispatch - Only admin and dairy can access
  {
    path: "/diary-dispatch",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Dairy Listing - Only admin can access
  {
    path: "/dairy-listing",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN],
    requiresSubscription: false,
  },
  // Farmer Listing - Only admin can access
  {
    path: "/farmer-listing",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN],
    requiresSubscription: false,
  },
  // Dairy Subscriptions - admin and dairy manage assignments
  {
    path: "/dairy-subscriptions",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: false,
  },
  // Purchased Subscriptions - view purchased subscriptions
  {
    path: "/purchased-subscriptions",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN],
    requiresSubscription: false,
  },
  {
    path: "/dairy-reports",
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },

  // Payment Management - Only admin and dairy can access
  {
    path: "/payment-management",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    roles: [UserRole.ADMIN, UserRole.DAIRY],
    requiresSubscription: true, // Dairy needs subscription to access
  },
];

// Utility functions
export const hasPermission = (
  userRole: UserRole,
  permission: keyof Permission,
): boolean => {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

export const canAccessRoute = (
  userRole: UserRole | number,
  path: string,
  hasSubscription: boolean = false,
): boolean => {
  // Convert number to UserRole enum if needed
  const role = typeof userRole === "number" ? (userRole as UserRole) : userRole;

  const routePermission = ROUTE_PERMISSIONS.find(
    (route) => route.path === path,
  );
  // If route isn't explicitly defined, allow admins by default so admin UI can access new routes
  if (!routePermission) return role === UserRole.ADMIN;

  // Check if user role is allowed
  if (!routePermission.roles.includes(role)) return false;

  // Special handling for roleId 3 (Farmer) - they can access milk collection without subscription
  if (role === UserRole.FARMER && (path === "/milk-collection" || path === "/offline-data")) {
    return true;
  }

  // For dairy users, check subscription requirement
  if (
    role === UserRole.DAIRY &&
    routePermission.requiresSubscription &&
    !hasSubscription
  ) {
    return false;
  }

  return true;
};

export const getRoutePermissions = (
  userRole: UserRole | number,
  path: string,
  hasSubscription: boolean = false,
): Permission | null => {
  // Convert number to UserRole enum if needed
  const role = typeof userRole === "number" ? (userRole as UserRole) : userRole;

  const routePermission = ROUTE_PERMISSIONS.find(
    (route) => route.path === path,
  );
  // If route not defined, return full admin permissions when user is admin
  if (!routePermission) {
    if (role === UserRole.ADMIN) return ROLE_PERMISSIONS[UserRole.ADMIN];
    return null;
  }
  if (!routePermission.roles.includes(role)) {
    return null;
  }

  // Special handling for roleId 3 (Farmer) - they can access milk collection without subscription
  if (role === UserRole.FARMER && path === "/milk-collection") {
    return routePermission.permissions;
  }

  // For dairy users, check subscription requirement
  if (
    role === UserRole.DAIRY &&
    routePermission.requiresSubscription &&
    !hasSubscription
  ) {
    return null;
  }

  return routePermission.permissions;
};

export const getRoleName = (roleId: number): string => {
  switch (roleId) {
    case UserRole.ADMIN:
      return "Admin";
    case UserRole.DAIRY:
      return "Dairy";
    case UserRole.FARMER:
      return "Farmer";
    default:
      return "Unknown";
  }
};

export const isAdmin = (roleId: number): boolean => roleId === UserRole.ADMIN;
export const isDairy = (roleId: number): boolean => roleId === UserRole.DAIRY;
export const isFarmer = (roleId: number): boolean => roleId === UserRole.FARMER;

// Subscription-related utilities
function parseSubscriptionEndDate(endDate?: string | null): Date | null {
  if (!endDate || endDate === "0000-00-00") return null;

  const dateOnly = endDate.split("T")[0];
  const parts = dateOnly.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    const parsed = new Date(endDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function toDairySubscription(
  subscription: {
    id: number;
    dairyId?: number;
    planId: number;
    startDate: string;
    endDate: string;
    status: DairySubscription["status"];
  } | null | undefined,
  fallbackDairyId = 0,
): DairySubscription | null {
  if (!subscription) return null;

  return {
    id: subscription.id,
    dairyId: subscription.dairyId ?? fallbackDairyId,
    planId: subscription.planId,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    status: subscription.status,
  };
}

export const getSubscriptionStatus = (
  dairySubscription: DairySubscription | null | undefined,
): "active" | "inactive" | "expired" | "none" => {
  if (!dairySubscription) return "none";

  if (dairySubscription.status === "active") {
    const endDate = parseSubscriptionEndDate(dairySubscription.endDate);
    if (endDate && endDate < new Date()) return "expired";
    return "active";
  }

  return dairySubscription.status || "inactive";
};

export const isSubscriptionActive = (
  dairySubscription: DairySubscription | null | undefined,
): boolean => {
  return getSubscriptionStatus(dairySubscription) === "active";
};
