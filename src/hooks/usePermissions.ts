import { useAuth } from '../contexts/AuthContext';
import { isFarmer, isAdmin, isDairy } from '../lib/permissions';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.roleId || 1;

  const isFarmerUser = isFarmer(userRole);
  const isAdminUser = isAdmin(userRole);
  const isDairyUser = isDairy(userRole);
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