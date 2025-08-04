import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.roleId || 1;

  // Role checking functions
  const isFarmerUser = userRole === UserRole.FARMER;
  const isAdminUser = userRole === UserRole.ADMIN;
  const isDairyUser = userRole === UserRole.DAIRY;
  
  const canManageMilk = isAdminUser || isDairyUser;
  const canViewOwnData = isFarmerUser;
  const canViewAllData = isAdminUser || isDairyUser;

  // Get farmer-specific API parameters
  const getFarmerFilterParams = () => {
    if (isFarmerUser && user?.id) {
      return `?farmerId=${user.id}`;
    }
    return '';
  };

  // Check if user can access specific features
  const canAccessFeature = (feature: string) => {
    switch (feature) {
      case 'addMilkCollection':
      case 'editMilkCollection':
      case 'deleteMilkCollection':
        return canManageMilk;
      case 'viewOwnMilkData':
        return canViewOwnData;
      case 'viewAllMilkData':
        return canViewAllData;
      case 'manageFarmers':
        return isAdminUser || isDairyUser;
      case 'viewReports':
        return isAdminUser || isDairyUser;
      case 'manageSettings':
        return isAdminUser;
      case 'manageSubscriptionPlans':
        return isAdminUser;
      default:
        return false;
    }
  };

  return {
    userRole,
    isFarmerUser,
    isAdminUser,
    isDairyUser,
    canManageMilk,
    canViewOwnData,
    canViewAllData,
    getFarmerFilterParams,
    canAccessFeature,
  };
}; 