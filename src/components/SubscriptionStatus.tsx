import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionStatus() {
  const { hasSubscription, dairySubscription } = useAuth();
  const { isDairyUser } = usePermissions();

  // Only show for dairy users
  if (!isDairyUser) return null;

  // Calculate subscription status
  const getSubscriptionStatus = () => {
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

  const subscriptionStatus = getSubscriptionStatus();

  const getStatusIcon = () => {
    switch (subscriptionStatus) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (subscriptionStatus) {
      case 'active':
        return 'Active Subscription';
      case 'expired':
        return 'Subscription Expired';
      case 'inactive':
        return 'Subscription Inactive';
      default:
        return 'No Subscription';
    }
  };

  if (!hasSubscription) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-yellow-800">
          <strong>No Active Subscription:</strong> You need to purchase a subscription plan to access all features. 
          <a href="/subscription-plans" className="ml-2 text-blue-600 hover:underline">
            View Plans →
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (subscriptionStatus === 'expired' || subscriptionStatus === 'inactive') {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <strong>Subscription {subscriptionStatus === 'expired' ? 'Expired' : 'Inactive'}:</strong> 
          Your subscription is no longer active. Please renew to continue accessing all features.
          <a href="/subscription-plans" className="ml-2 text-blue-600 hover:underline">
            Renew Subscription →
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (subscriptionStatus === 'active' && dairySubscription) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className="text-green-800">Subscription Active</span>
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Plan ID:</strong> {dairySubscription.planId}</p>
            <p><strong>Start Date:</strong> {new Date(dairySubscription.startDate).toLocaleDateString()}</p>
            {dairySubscription.endDate && dairySubscription.endDate !== '0000-00-00' && (
              <p><strong>End Date:</strong> {new Date(dairySubscription.endDate).toLocaleDateString()}</p>
            )}
            <p><strong>Status:</strong> {dairySubscription.status}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
} 