import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://192.168.10.212/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language header for internationalization
    const language = localStorage.getItem('i18nextLng') || 'en';
    config.headers['Accept-Language'] = language;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Return response data directly
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', data);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data);
          break;
        case 422:
          // Validation error
          console.error('Validation error:', data);
          break;
        case 500:
          // Server error
          console.error('Server error:', data);
          break;
        default:
          console.error('API error:', data);
      }
      
      // Return error with custom message
      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
        data,
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    } else {
      // Other error
      console.error('Request error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

// API service functions
export const authAPI = {
  // Login
  login: (credentials: { phone: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  // Register
  register: (userData: {
    name: string;
    phone: string;
    password: string;
    referralCode?: string;
  }) => api.post('/auth/registeration', userData), // Note: backend uses "registeration"
  
  // Refresh token
  refreshToken: () => api.post('/auth/refresh'),
  
  // Forgot password
  forgotPassword: (phone: string) =>
    api.post('/auth/forgot-password', { phone }),
  
  // OTP Verify
  otpVerify: (data: { phone: string; otp: string }) =>
    api.post('/auth/otp-verify', data),
  
  // Change password
  changePassword: (data: { phone: string; new_password: string; confirm_password: string }) =>
    api.put('/auth/change-password', data),
};

export const farmersAPI = {
  // Get all farmers
  getFarmers: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/farmers', { params }),
  
  // Get farmer by ID
  getFarmer: (id: string) => api.get(`/admin/farmers/${id}`),
  
  // Create farmer
  createFarmer: (farmerData: {
    name: string;
    phone: string;
    password: string;
    dairyId: number;
  }) => api.post('/admin/farmers', farmerData),
  
  // Update farmer
  updateFarmer: (id: string, farmerData: any) =>
    api.put(`/admin/farmers/${id}`, farmerData),
  
  // Delete farmer
  deleteFarmer: (id: string) => api.delete(`/admin/farmers/${id}`),
  
  // Get farmer milk history
  getMilkHistory: (id: string, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/admin/farmers/${id}/milk-history`, { params }),
};

export const milkCollectionAPI = {
  // Get today's milk collection
  getTodayCollection: () => api.get('/milk-collection/today'),
  
  // Get milk collection by date
  getCollectionByDate: (date: string) =>
    api.get(`/milk-collection/date/${date}`),
  
  // Add milk entry
  addEntry: (entryData: {
    farmerId: string;
    fatPercentage: number;
    quantity: number;
    ratePerLiter: number;
    totalPrice: number;
  }) => api.post('/milk-collection/entries', entryData),
  
  // Update milk entry
  updateEntry: (id: string, entryData: any) =>
    api.put(`/milk-collection/entries/${id}`, entryData),
  
  // Delete milk entry
  deleteEntry: (id: string) =>
    api.delete(`/milk-collection/entries/${id}`),
  
  // Get collection summary
  getSummary: (date?: string) =>
    api.get('/milk-collection/summary', { params: { date } }),
  
  // Export collection data
  exportData: (date: string, format: 'pdf' | 'excel' = 'pdf') =>
    api.get(`/milk-collection/export/${date}`, {
      params: { format },
      responseType: 'blob',
    }),
};

export const inventoryAPI = {
  // Get all products
  getProducts: (params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/inventory/products', { params }),
  
  // Get product by ID
  getProduct: (id: string) => api.get(`/inventory/products/${id}`),
  
  // Create product
  createProduct: (productData: any) =>
    api.post('/inventory/products', productData),
  
  // Update product
  updateProduct: (id: string, productData: any) =>
    api.put(`/inventory/products/${id}`, productData),
  
  // Delete product
  deleteProduct: (id: string) =>
    api.delete(`/inventory/products/${id}`),
  
  // Adjust stock
  adjustStock: (id: string, adjustmentData: {
    type: 'add' | 'remove';
    quantity: number;
    reason: string;
  }) => api.post(`/inventory/products/${id}/stock`, adjustmentData),
  
  // Get stock history
  getStockHistory: (id: string) =>
    api.get(`/inventory/products/${id}/stock-history`),
};

export const dashboardAPI = {
  // Get dashboard stats
  getStats: () => api.get('/dashboard/stats'),
  
  // Get recent activities
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  
  // Get sales chart data
  getSalesChart: (period: 'week' | 'month' | 'year' = 'week') =>
    api.get('/dashboard/sales-chart', { params: { period } }),
  
  // Get low stock alerts
  getLowStockAlerts: () => api.get('/dashboard/low-stock-alerts'),
};

export const reportsAPI = {
  // Generate sales report
  generateSalesReport: (params: {
    startDate: string;
    endDate: string;
    type: 'summary' | 'detailed';
  }) => api.post('/reports/sales', params),
  
  // Generate inventory report
  generateInventoryReport: (params: {
    category?: string;
    status?: string;
  }) => api.post('/reports/inventory', params),
  
  // Generate milk collection report
  generateMilkReport: (params: {
    startDate: string;
    endDate: string;
    farmerId?: string;
  }) => api.post('/reports/milk-collection', params),
  
  // Download report
  downloadReport: (reportId: string, format: 'pdf' | 'excel' = 'pdf') =>
    api.get(`/reports/download/${reportId}`, {
      params: { format },
      responseType: 'blob',
    }),
};

export default api; 