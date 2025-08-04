# Role-Based Permission System

## Overview
The application now implements a comprehensive role-based permission system with three user roles:

- **Role ID 1 (Admin)**: Full access to all features
- **Role ID 2 (Dairy)**: View-only access, cannot create/edit/delete
- **Role ID 3 (Farmer)**: Limited view access

## Role Definitions

### Admin (Role ID: 1)
- ✅ **Full Access**: Can view, create, edit, and delete everything
- ✅ **All Routes**: Access to all pages and features
- ✅ **Settings**: Can manage application settings
- ✅ **Admin Plans**: Can manage subscription plans

### Dairy (Role ID: 2)
- ✅ **View Access**: Can view all data and reports
- ❌ **No Create**: Cannot create new items
- ❌ **No Edit**: Cannot edit existing items
- ❌ **No Delete**: Cannot delete items
- ❌ **No Settings**: Cannot access settings page
- ❌ **No Admin Plans**: Cannot access admin subscription plans

### Farmer (Role ID: 3)
- ✅ **View Access**: Can view data and reports
- ❌ **No Create**: Cannot create new items
- ❌ **No Edit**: Cannot edit existing items
- ❌ **No Delete**: Cannot delete items
- ❌ **No Settings**: Cannot access settings page
- ❌ **No Admin Plans**: Cannot access admin subscription plans

## Implementation Details

### 1. User Interface Updates
- **Updated User Interface**: Added `roleId` field to user data
- **Navigation Filtering**: Navigation items are filtered based on user role
- **Button Visibility**: Create/Edit/Delete buttons are hidden for non-admin users
- **Role Display**: User role is shown in the dropdown menu

### 2. Route Protection
- **ProtectedRoute Component**: Enhanced to check role-based access
- **Route Permissions**: Each route has defined permissions and allowed roles
- **Access Denied**: Users are redirected if they try to access unauthorized routes

### 3. Component-Level Permissions
- **usePermissions Hook**: Custom hook for easy permission checking
- **Conditional Rendering**: UI elements are conditionally rendered based on permissions
- **Button States**: Action buttons are disabled/hidden for unauthorized users

## Files Modified

### Core Permission System
- `src/types/auth.ts`: Updated User interface with roleId
- `src/lib/permissions.ts`: Permission definitions and utility functions
- `src/hooks/usePermissions.ts`: Custom hook for permission checking

### Components Updated
- `src/components/Layout.tsx`: Navigation filtering and role display
- `src/components/ProtectedRoute.tsx`: Role-based route protection
- `src/pages/AdminSubscriptionPlans.tsx`: Permission-based UI elements

## Usage Examples

### Using the usePermissions Hook
```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { canCreate, canEdit, canDelete, isAdmin, roleName } = usePermissions();

  return (
    <div>
      {canCreate() && <Button>Create New</Button>}
      {canEdit() && <Button>Edit</Button>}
      {canDelete() && <Button>Delete</Button>}
      <p>Current Role: {roleName}</p>
    </div>
  );
}
```

### Direct Permission Checking
```tsx
import { hasPermission, canAccessRoute } from '@/lib/permissions';

// Check specific permission
const canCreate = hasPermission(userRole, 'canCreate');

// Check route access
const canAccessSettings = canAccessRoute(userRole, '/settings');
```

## Permission Matrix

| Feature | Admin | Dairy | Farmer |
|---------|-------|-------|--------|
| Dashboard | ✅ | ✅ | ✅ |
| Milk Collection | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ |
| Settings | ✅ | ❌ | ❌ |
| Subscription Plans | ✅ | ✅ | ✅ |
| Admin Plans | ✅ | ❌ | ❌ |
| Create Items | ✅ | ❌ | ❌ |
| Edit Items | ✅ | ❌ | ❌ |
| Delete Items | ✅ | ❌ | ❌ |

## Testing the System

### 1. Login with Different Roles
- Test with admin user (roleId: 1)
- Test with dairy user (roleId: 2)
- Test with farmer user (roleId: 3)

### 2. Verify Navigation
- Check that navigation items are filtered correctly
- Verify that unauthorized routes are not accessible

### 3. Test UI Elements
- Confirm create/edit/delete buttons are hidden for non-admin users
- Verify that role information is displayed correctly

### 4. Test Route Protection
- Try accessing unauthorized routes
- Verify redirects work correctly

## Security Considerations

- **Client-Side Only**: This is a client-side permission system
- **Backend Validation**: Ensure backend also validates permissions
- **Token Security**: Role information is stored in JWT token
- **Route Protection**: Unauthorized routes redirect to dashboard

## Future Enhancements

- **Dynamic Permissions**: Load permissions from backend
- **Permission Groups**: Create permission groups for easier management
- **Audit Logging**: Log permission-related actions
- **Fine-grained Permissions**: More specific permissions per feature 