# API Call Utility Documentation

This document explains how to use the new `apiCall` utility function and `allRoutes` for making API calls in the dairy management system.

## Overview

The new API system consists of:
- `apiCall` utility function for making HTTP requests
- `allRoutes` object containing all API endpoints
- `useApi`, `useMutation`, and `useQuery` hooks for React components

## Files

- `src/lib/apiCall.ts` - The main apiCall utility function
- `src/lib/apiRoutes.ts` - All API routes organized by feature
- `src/hooks/useApi.ts` - React hooks for API calls

## Basic Usage

### Using apiCall directly

```typescript
import { apiCall } from '@/lib/apiCall';
import { allRoutes } from '@/lib/apiRoutes';

// GET request
const response = await apiCall(allRoutes.auth.login, 'get');

// POST request with data
const response = await apiCall(allRoutes.auth.login, 'post', { 
  phone: '1234567890', 
  password: 'password' 
});

// PUT request
const response = await apiCall(allRoutes.farmers.update('123'), 'put', { 
  name: 'Updated Name' 
});

// DELETE request
const response = await apiCall(allRoutes.farmers.delete('123'), 'delete');
```

### Response Format

The `apiCall` function returns:
```typescript
{
  success: boolean;
  data?: any; // Only present if success is true
}
```

### Error Handling

The `apiCall` function automatically:
- Shows toast notifications for errors
- Handles authentication errors (401)
- Handles validation errors
- Handles network errors

## Using with React Hooks

### useQuery Hook

```typescript
import { useQuery } from '@/hooks/useApi';
import { apiCall } from '@/lib/apiCall';
import { allRoutes } from '@/lib/apiRoutes';

function MyComponent() {
  const { data, loading, error, execute } = useQuery(
    () => apiCall(allRoutes.dashboard.getStats, 'get'),
    {
      autoExecute: true, // Automatically execute on mount
      onSuccess: (data) => {
        console.log('Data loaded:', data);
      },
      onError: (error) => {
        console.error('Failed to load data:', error);
      }
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Data: {JSON.stringify(data)}</div>;
}
```

### useMutation Hook

```typescript
import { useMutation } from '@/hooks/useApi';
import { apiCall } from '@/lib/apiCall';
import { allRoutes } from '@/lib/apiRoutes';

function MyComponent() {
  const { execute, loading, error } = useMutation(
    (data) => apiCall(allRoutes.farmers.create, 'post', data),
    {
      onSuccess: (data) => {
        console.log('Farmer created:', data);
      },
      onError: (error) => {
        console.error('Failed to create farmer:', error);
      }
    }
  );

  const handleSubmit = async (formData) => {
    await execute(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Farmer'}
      </button>
    </form>
  );
}
```

## Available Routes

### Auth Routes
```typescript
allRoutes.auth.login              // POST /auth/login
allRoutes.auth.register           // POST /auth/registeration
allRoutes.auth.refresh            // POST /auth/refresh
allRoutes.auth.forgotPassword     // POST /auth/forgot-password
allRoutes.auth.otpVerify          // POST /auth/otp-verify
allRoutes.auth.changePassword     // PUT /auth/change-password
```

### Farmers Routes
```typescript
allRoutes.farmers.getAll          // GET /admin/farmers
allRoutes.farmers.getById(id)     // GET /admin/farmers/{id}
allRoutes.farmers.create          // POST /admin/farmers
allRoutes.farmers.update(id)      // PUT /admin/farmers/{id}
allRoutes.farmers.delete(id)      // DELETE /admin/farmers/{id}
allRoutes.farmers.getMilkHistory(id) // GET /admin/farmers/{id}/milk-history
```

### Milk Collection Routes
```typescript
allRoutes.milkCollection.getToday     // GET /milk-collection/today
allRoutes.milkCollection.getByDate(date) // GET /milk-collection/date/{date}
allRoutes.milkCollection.addEntry     // POST /milk-collection/entries
allRoutes.milkCollection.updateEntry(id) // PUT /milk-collection/entries/{id}
allRoutes.milkCollection.deleteEntry(id) // DELETE /milk-collection/entries/{id}
allRoutes.milkCollection.getSummary   // GET /milk-collection/summary
allRoutes.milkCollection.exportData(date) // GET /milk-collection/export/{date}
```

### Inventory Routes
```typescript
allRoutes.inventory.getProducts   // GET /inventory/products
allRoutes.inventory.getProduct(id) // GET /inventory/products/{id}
allRoutes.inventory.createProduct // POST /inventory/products
allRoutes.inventory.updateProduct(id) // PUT /inventory/products/{id}
allRoutes.inventory.deleteProduct(id) // DELETE /inventory/products/{id}
allRoutes.inventory.adjustStock(id) // POST /inventory/products/{id}/stock
allRoutes.inventory.getStockHistory(id) // GET /inventory/products/{id}/stock-history
```

### Dashboard Routes
```typescript
allRoutes.dashboard.getStats      // GET /dashboard/stats
allRoutes.dashboard.getRecentActivities // GET /dashboard/recent-activities
allRoutes.dashboard.getSalesChart // GET /dashboard/sales-chart
allRoutes.dashboard.getLowStockAlerts // GET /dashboard/low-stock-alerts
```

### Reports Routes
```typescript
allRoutes.reports.generateSalesReport // POST /reports/sales
allRoutes.reports.generateInventoryReport // POST /reports/inventory
allRoutes.reports.generateMilkReport // POST /reports/milk-collection
allRoutes.reports.downloadReport(reportId) // GET /reports/download/{reportId}
```

## Configuration

### Environment Variables

Set the API base URL in your `.env` file:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Authentication

The `apiCall` function automatically:
- Adds the `Authorization` header with the Bearer token from localStorage
- Adds the `Accept-Language` header for internationalization
- Handles 401 responses by clearing localStorage and redirecting to login

### Toast Notifications

The system uses `react-toastify` for error notifications. Make sure the `ToastContainer` is included in your app:

```typescript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// In your main App component
<ToastContainer
  position="top-right"
  autoClose={5000}
  hideProgressBar={false}
  newestOnTop={false}
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="light"
/>
```

## Migration from Old API System

If you're migrating from the old `authAPI`, `farmersAPI`, etc.:

1. Replace direct API calls with `apiCall`:
   ```typescript
   // Old
   const response = await authAPI.login(credentials);
   
   // New
   const response = await apiCall(allRoutes.auth.login, 'post', credentials);
   ```

2. Update response handling:
   ```typescript
   // Old
   if (response.accessToken) {
     // handle success
   }
   
   // New
   if (response.success && response.data.accessToken) {
     // handle success
   }
   ```

3. Update React hooks:
   ```typescript
   // Old
   const { data } = useQuery(dashboardAPI.getStats);
   
   // New
   const { data } = useQuery(() => apiCall(allRoutes.dashboard.getStats, 'get'));
   ```

## Best Practices

1. **Always check response.success** before accessing response.data
2. **Use TypeScript interfaces** for API response data
3. **Handle loading and error states** in your components
4. **Use the appropriate hook** (useQuery for data fetching, useMutation for mutations)
5. **Transform API data** to match your component interfaces when needed
6. **Use the autoExecute option** for data that should load on component mount 