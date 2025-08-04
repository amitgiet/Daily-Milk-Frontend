import { useAuth } from '@/contexts/AuthContext';
import { 
  hasPermission, 
  canAccessRoute, 
  getRoutePermissions, 
  getRoleName,
  isAdmin,
  isDairy,
  isFarmer,
  getSubscriptionStatus,
  isSubscriptionActive
} from '@/lib/permissions';
import { UserRole } from '@/types/auth';

export const usePermissions = () => {
  const { user, hasSubscription, dairySubscription } = useAuth();
  const userRole = user?.roleId || UserRole.ADMIN;

  return {
    // User role information
    userRole,
    roleName: getRoleName(userRole),
    isAdmin: isAdmin(userRole),
    isDairy: isDairy(userRole),
    isFarmer: isFarmer(userRole),

    // Subscription information
    hasSubscription,
    dairySubscription,
    subscriptionStatus: getSubscriptionStatus(dairySubscription),
    isSubscriptionActive: isSubscriptionActive(dairySubscription),

    // Permission checks
    canView: (permission?: keyof typeof hasPermission) => 
      permission ? hasPermission(userRole, permission) : hasPermission(userRole, 'canView'),
    canCreate: () => hasPermission(userRole, 'canCreate'),
    canEdit: () => hasPermission(userRole, 'canEdit'),
    canDelete: () => hasPermission(userRole, 'canDelete'),

    // Route access (with subscription check)
    canAccessRoute: (path: string) => canAccessRoute(userRole, path, hasSubscription),
    getRoutePermissions: (path: string) => getRoutePermissions(userRole, path, hasSubscription),

    // Helper functions
    hasAnyPermission: (permissions: Array<'canView' | 'canCreate' | 'canEdit' | 'canDelete'>) => 
      permissions.some(permission => hasPermission(userRole, permission)),
  };
}; 