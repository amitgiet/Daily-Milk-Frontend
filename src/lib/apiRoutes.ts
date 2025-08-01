// API Routes organized by feature
export const allRoutes = {
  auth: {
    register: '/auth/registeration',
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    otpVerify: '/auth/otp-verify',
    changePassword: '/auth/change-password',
    refreshToken: '/auth/refresh',
    logout: '/auth/logout'
  },
  farmers: {
    list: '/admin/farmers',
    add: '/admin/farmers',
    update: (id: string | number) => `/admin/farmers/${id}`,
    get: (id: string | number) => `/admin/farmers/${id}`,
    delete: (id: string | number) => `/admin/farmers/${id}`
  },
  milkCollection: {
    collect: '/admin/milk/collect',
    list: '/admin/milk/list',
    get: (id: string | number) => `/admin/milk/${id}`,
    update: (id: string | number) => `/admin/milk/${id}`,
    delete: (id: string | number) => `/admin/milk/${id}`
  },
  inventory: {
    list: '/admin/inventory',
    add: '/admin/inventory',
    update: (id: string | number) => `/admin/inventory/${id}`,
    get: (id: string | number) => `/admin/inventory/${id}`,
    delete: (id: string | number) => `/admin/inventory/${id}`,
    adjustStock: (id: string | number) => `/admin/inventory/${id}/adjust-stock`
  },
  dashboard: {
    stats: '/admin/dashboard/stats',
    lowStockAlerts: '/admin/dashboard/low-stock-alerts',
    recentActivity: '/admin/dashboard/recent-activity'
  },
  reports: {
    sales: '/admin/reports/sales',
    inventory: '/admin/reports/inventory',
    farmers: '/admin/reports/farmers',
    milkCollection: '/admin/reports/milk-collection'
  },
  dairy: {
    rates: '/admin/dairy/rates',
    updateRates: '/admin/dairy/rates'
  }
}; 