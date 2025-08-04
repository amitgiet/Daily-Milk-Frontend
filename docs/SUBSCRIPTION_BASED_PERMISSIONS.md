# Subscription-Based Permission System

## Overview
The application now implements a subscription-based permission system where dairy users need an active subscription to access certain features. This ensures that only paying customers can access premium features.

## How It Works

### Login Response Structure
When a user logs in, the API returns:
```json
{
  "accessToken": "...",
  "message": "Login successful",
  "status": true,
  "subscription": true,  // or false
  "user": {
    "id": 1,
    "name": "Super Admin",
    "roleId": 1,
    "dairyId": null,
    "email": "superadmin@gmail.com"
  },
  "DairySubscription": {
    "id": 7,
    "dairyId": 1,
    "planId": 2,
    "startDate": "2025-08-04",
    "endDate": "0000-00-00",
    "status": "active"
  }
}
```

### Permission Logic
- **Admin (roleId: 1)**: Always has full access regardless of subscription
- **Dairy (roleId: 2)**: 
  - If `subscription: true` → Can access all routes
  - If `subscription: false` → Can only access subscription plans page
- **Farmer (roleId: 3)**: Always has limited access regardless of subscription

## Route Access Matrix

| Route | Admin | Dairy (with subscription) | Dairy (no subscription) | Farmer |
|-------|-------|---------------------------|-------------------------|--------|
| `/` (Dashboard) | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/milk-collection` | ✅ | ✅ | ❌ (redirects to plans) | ✅ |
| `/customers` | ✅ | ✅ | ❌ (redirects to plans) | ✅ |
| `/orders` | ✅ | ✅ | ❌ (redirects to plans) | ✅ |
| `/reports` | ✅ | ✅ | ❌ (redirects to plans) | ✅ |
| `/settings` | ✅ | ❌ (admin only) | ❌ (admin only) | ❌ (admin only) |
| `/subscription-plans` | ✅ | ✅ | ✅ | ✅ |
| `/admin-subscription-plans` | ✅ | ❌ (admin only) | ❌ (admin only) | ❌ (admin only) |

## Implementation Details

### 1. Updated Types
- **LoginResponse**: Added `subscription` and `DairySubscription` fields
- **DairySubscription**: New interface for subscription details
- **RoutePermission**: Added `requiresSubscription` field

### 2. AuthContext Updates
- **State Management**: Added `hasSubscription` and `dairySubscription` state
- **Login Handling**: Stores subscription information from login response
- **Context Value**: Exposes subscription data to components

### 3. Permission System Updates
- **Route Checking**: `canAccessRoute()` now considers subscription status
- **Subscription Utilities**: Added functions to check subscription status
- **Status Validation**: Checks if subscription is active, expired, or inactive

### 4. UI Components
- **Layout**: Shows subscription status in user dropdown
- **ProtectedRoute**: Redirects dairy users without subscription to plans page
- **SubscriptionStatus**: Displays subscription information and warnings

## Key Features

### 1. Automatic Redirects
- Dairy users without subscription are automatically redirected to `/subscription-plans`
- Attempts to access restricted routes redirect to subscription page

### 2. Visual Indicators
- User dropdown shows subscription status
- Warning alerts for expired/inactive subscriptions
- Clear messaging about subscription requirements

### 3. Subscription Status Tracking
- **Active**: Subscription is valid and not expired
- **Expired**: Subscription has passed end date
- **Inactive**: Subscription is not active
- **None**: No subscription exists

### 4. Graceful Degradation
- Users can still access basic features (dashboard, subscription plans)
- Clear messaging about what features require subscription
- Easy access to subscription plans for purchase

## Usage Examples

### Checking Subscription Status
```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasSubscription, subscriptionStatus, isDairy } = usePermissions();

  if (isDairy && !hasSubscription) {
    return <div>Please purchase a subscription to access this feature</div>;
  }

  return <div>Feature content</div>;
}
```

### Route Protection
```tsx
import { canAccessRoute } from '@/lib/permissions';

// Check if user can access route
const canAccess = canAccessRoute(userRole, '/milk-collection', hasSubscription);
```

### Subscription Status Display
```tsx
import SubscriptionStatus from '@/components/SubscriptionStatus';

function Dashboard() {
  return (
    <div>
      <SubscriptionStatus />
      {/* Dashboard content */}
    </div>
  );
}
```

## Testing Scenarios

### 1. Dairy User with Subscription
- ✅ Can access all dairy-accessible routes
- ✅ Sees subscription status in dropdown
- ✅ No redirects to subscription page

### 2. Dairy User without Subscription
- ❌ Cannot access restricted routes
- 🔄 Automatically redirected to subscription plans
- ⚠️ Sees warning about no subscription

### 3. Admin User
- ✅ Can access all routes regardless of subscription
- ✅ No subscription restrictions

### 4. Farmer User
- ✅ Can access farmer-accessible routes
- ✅ No subscription restrictions

## Security Considerations

- **Client-Side Validation**: This is primarily a UX feature
- **Backend Validation**: Ensure backend also validates subscription status
- **Token Security**: Subscription info is stored in JWT token
- **Route Protection**: Unauthorized routes redirect appropriately

## Future Enhancements

- **Subscription Expiry Warnings**: Notify users before subscription expires
- **Auto-Renewal**: Automatic subscription renewal
- **Trial Periods**: Free trial for new dairy users
- **Subscription Tiers**: Different subscription levels with varying features
- **Payment Integration**: Direct payment processing in the app 