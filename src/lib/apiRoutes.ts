// API Routes organized by feature
export const allRoutes = {
  // Auth Routes
  auth: {
    login: '/auth/login',
    register: '/auth/registeration',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    otpVerify: '/auth/otp-verify',
    changePassword: '/auth/change-password',
  },

  // Farmers Routes
  farmers: {
    getAll: '/admin/farmers',
    getById: (id: string) => `/admin/farmers/${id}`,
    create: '/admin/farmers',
    update: (id: string) => `/admin/farmers/${id}`,
    delete: (id: string) => `/admin/farmers/${id}`,
    getMilkHistory: (id: string) => `/admin/farmers/${id}/milk-history`,
  },

  // Milk Collection Routes
  milkCollection: {
    getToday: '/milk-collection/today',
    getByDate: (date: string) => `/milk-collection/date/${date}`,
    addEntry: '/milk-collection/entries',
    updateEntry: (id: string) => `/milk-collection/entries/${id}`,
    deleteEntry: (id: string) => `/milk-collection/entries/${id}`,
    getSummary: '/milk-collection/summary',
    exportData: (date: string) => `/milk-collection/export/${date}`,
  },

  // Inventory Routes
  inventory: {
    getProducts: '/inventory/products',
    getProduct: (id: string) => `/inventory/products/${id}`,
    createProduct: '/inventory/products',
    updateProduct: (id: string) => `/inventory/products/${id}`,
    deleteProduct: (id: string) => `/inventory/products/${id}`,
    adjustStock: (id: string) => `/inventory/products/${id}/stock`,
    getStockHistory: (id: string) => `/inventory/products/${id}/stock-history`,
  },

  // Dashboard Routes
  dashboard: {
    getStats: '/dashboard/stats',
    getRecentActivities: '/dashboard/recent-activities',
    getSalesChart: '/dashboard/sales-chart',
    getLowStockAlerts: '/dashboard/low-stock-alerts',
  },

  // Reports Routes
  reports: {
    generateSalesReport: '/reports/sales',
    generateInventoryReport: '/reports/inventory',
    generateMilkReport: '/reports/milk-collection',
    downloadReport: (reportId: string) => `/reports/download/${reportId}`,
  },
}; 