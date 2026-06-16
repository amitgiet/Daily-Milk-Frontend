import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, isSubscriptionActive } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, hasSubscription, dairySubscription } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access with subscription
  const userRole = user?.roleId || 1;
  const hasActiveSubscription =
    hasSubscription || isSubscriptionActive(dairySubscription);
  if (!canAccessRoute(userRole, location.pathname, hasActiveSubscription)) {
    console.log(`Access denied: User role ${userRole} cannot access ${location.pathname} (subscription: ${hasActiveSubscription})`);
    
    // For dairy users without subscription, redirect to subscription plans
    if (userRole === 2 && !hasActiveSubscription && location.pathname !== '/subscription-plans') {
      return <Navigate to="/subscription-plans" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
