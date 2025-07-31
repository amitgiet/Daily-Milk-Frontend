# API Setup Documentation

## Overview

This project uses Axios for HTTP requests with a centralized configuration and custom hooks for state management.

## File Structure

```
src/
├── lib/
│   └── axios.ts          # Axios instance and API functions
├── hooks/
│   └── useApi.ts         # Custom hooks for API calls
├── contexts/
│   └── AuthContext.tsx   # Authentication context
└── pages/
    ├── Login.tsx         # Updated to use auth context
    ├── Signup.tsx        # Updated to use auth context
    └── Dashboard.tsx     # Example of API usage
```

## Axios Configuration (`src/lib/axios.ts`)

### Base Configuration
- **Base URL**: Configurable via `VITE_API_BASE_URL` environment variable
- **Timeout**: 10 seconds
- **Default Headers**: JSON content type

### Request Interceptor
- Automatically adds authentication token from localStorage
- Adds language header for internationalization
- Handles request errors

### Response Interceptor
- Returns response data directly
- Handles different HTTP status codes:
  - `401`: Unauthorized - clears token and redirects to login
  - `403`: Forbidden
  - `404`: Not found
  - `422`: Validation error
  - `500`: Server error
- Handles network errors
- Provides consistent error format

### API Service Functions

#### Authentication (`authAPI`)
```typescript
// Login
authAPI.login({ email: string, password: string })

// Register
authAPI.register({ fullName: string, phoneNumber: string, referralCode?: string, password: string })

// Logout
authAPI.logout()

// Refresh token
authAPI.refreshToken()

// Forgot password
authAPI.forgotPassword(email: string)

// Reset password
authAPI.resetPassword(token: string, password: string)
```

#### Farmers (`farmersAPI`)
```typescript
// Get all farmers
farmersAPI.getFarmers({ search?: string, page?: number, limit?: number })

// Get farmer by ID
farmersAPI.getFarmer(id: string)

// Create farmer
farmersAPI.createFarmer({ name: string, phone: string, address: string, email?: string })

// Update farmer
farmersAPI.updateFarmer(id: string, farmerData: any)

// Delete farmer
farmersAPI.deleteFarmer(id: string)

// Get farmer milk history
farmersAPI.getMilkHistory(id: string, { startDate?: string, endDate?: string, page?: number, limit?: number })
```

#### Milk Collection (`milkCollectionAPI`)
```typescript
// Get today's collection
milkCollectionAPI.getTodayCollection()

// Get collection by date
milkCollectionAPI.getCollectionByDate(date: string)

// Add milk entry
milkCollectionAPI.addEntry({ farmerId: string, fatPercentage: number, quantity: number, ratePerLiter: number, totalPrice: number })

// Update milk entry
milkCollectionAPI.updateEntry(id: string, entryData: any)

// Delete milk entry
milkCollectionAPI.deleteEntry(id: string)

// Get collection summary
milkCollectionAPI.getSummary(date?: string)

// Export collection data
milkCollectionAPI.exportData(date: string, format: 'pdf' | 'excel')
```

#### Inventory (`inventoryAPI`)
```typescript
// Get all products
inventoryAPI.getProducts({ search?: string, category?: string, status?: string, page?: number, limit?: number })

// Get product by ID
inventoryAPI.getProduct(id: string)

// Create product
inventoryAPI.createProduct(productData: any)

// Update product
inventoryAPI.updateProduct(id: string, productData: any)

// Delete product
inventoryAPI.deleteProduct(id: string)

// Adjust stock
inventoryAPI.adjustStock(id: string, { type: 'add' | 'remove', quantity: number, reason: string })

// Get stock history
inventoryAPI.getStockHistory(id: string)
```

#### Dashboard (`dashboardAPI`)
```typescript
// Get dashboard stats
dashboardAPI.getStats()

// Get recent activities
dashboardAPI.getRecentActivities()

// Get sales chart data
dashboardAPI.getSalesChart(period: 'week' | 'month' | 'year')

// Get low stock alerts
dashboardAPI.getLowStockAlerts()
```

#### Reports (`reportsAPI`)
```typescript
// Generate sales report
reportsAPI.generateSalesReport({ startDate: string, endDate: string, type: 'summary' | 'detailed' })

// Generate inventory report
reportsAPI.generateInventoryReport({ category?: string, status?: string })

// Generate milk collection report
reportsAPI.generateMilkReport({ startDate: string, endDate: string, farmerId?: string })

// Download report
reportsAPI.downloadReport(reportId: string, format: 'pdf' | 'excel')
```

## Custom Hooks (`src/hooks/useApi.ts`)

### `useApi`
Generic hook for API calls with loading, error, and success states.

```typescript
const { data, loading, error, execute, reset } = useApi(apiFunction, {
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  initialData: null
});
```

### `useMutation`
Specialized hook for mutations (POST, PUT, DELETE).

```typescript
const { data, loading, error, execute, reset } = useMutation(apiFunction, {
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error)
});
```

### `useQuery`
Specialized hook for queries (GET) with auto-execution.

```typescript
const { data, loading, error, execute, reset } = useQuery(apiFunction, {
  autoExecute: true,
  autoExecuteArgs: [param1, param2],
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  initialData: null
});
```

## Authentication Context (`src/contexts/AuthContext.tsx`)

### Features
- Manages user authentication state
- Provides login, register, and logout functions
- Automatically checks authentication on mount
- Handles token refresh
- Integrates with Axios interceptors

### Usage
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
```

## Usage Examples

### Basic API Call
```typescript
import { useQuery } from '@/hooks/useApi';
import { farmersAPI } from '@/lib/axios';

function FarmersList() {
  const { data: farmers, loading, error } = useQuery(farmersAPI.getFarmers, {
    autoExecute: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {farmers?.map(farmer => (
        <div key={farmer.id}>{farmer.name}</div>
      ))}
    </div>
  );
}
```

### Mutation with Form
```typescript
import { useMutation } from '@/hooks/useApi';
import { farmersAPI } from '@/lib/axios';

function AddFarmer() {
  const { execute: addFarmer, loading, error } = useMutation(farmersAPI.createFarmer, {
    onSuccess: () => {
      console.log('Farmer added successfully');
    }
  });

  const handleSubmit = async (formData) => {
    await addFarmer(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Farmer'}
      </button>
      {error && <div>Error: {error}</div>}
    </form>
  );
}
```

### Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const { login } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      // Navigate to dashboard
    }
  };
}
```

## Error Handling

The Axios configuration provides consistent error handling:

1. **HTTP Errors**: Handled by response interceptor
2. **Network Errors**: Caught and formatted
3. **Validation Errors**: Displayed to user
4. **Authentication Errors**: Automatically redirect to login

## Best Practices

1. **Use Custom Hooks**: Always use `useApi`, `useMutation`, or `useQuery` instead of calling API functions directly
2. **Handle Loading States**: Show loading indicators during API calls
3. **Error Boundaries**: Implement error boundaries for unexpected errors
4. **Type Safety**: Use TypeScript interfaces for API responses
5. **Environment Variables**: Use environment variables for configuration
6. **Token Management**: Let the auth context handle token storage and refresh

## Testing

When testing API calls, you can mock the API functions:

```typescript
import { farmersAPI } from '@/lib/axios';

// Mock the API function
jest.mock('@/lib/axios', () => ({
  farmersAPI: {
    getFarmers: jest.fn()
  }
}));

// In your test
farmersAPI.getFarmers.mockResolvedValue([{ id: '1', name: 'Test Farmer' }]);
``` 