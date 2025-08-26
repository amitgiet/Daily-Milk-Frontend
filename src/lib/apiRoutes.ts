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
    getFarmers: '/admin/farmers',
    addFarmer: '/admin/farmers',
    updateFarmer: (id: string | number) => `/admin/farmers/${id}`,
    getFarmer: (id: string | number) => `/admin/farmers/${id}`,
    delete: (id: string | number) => `/admin/farmers/${id}`
  },
  milkCollection: {
    collect: '/admin/milk/collect',
    list: (farmerId: string | number = "", startDate: string, endDate: string, shift: string) => {
      let url = '/admin/milk/list';
      if(farmerId) {
        url += `?farmerId=${farmerId}`;
      } 
       if(startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      } 
       if(shift) {
        url += `?shift=${shift}`;
      }
      return url;
    },
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
    stats: '/admin/dashboard-stats',
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
  },
  subscriptions: {
    list: '/admin/subscriptions',
    add: '/admin/subscriptions',
    update: (id: string | number) => `/admin/subscriptions/${id}`,
    get: (id: string | number) => `/admin/subscriptions/${id}`,
    delete: (id: string | number) => `/admin/subscriptions/${id}`,
    toggleStatus: (id: string | number) => `/admin/subscriptions/${id}/status`,
    pendingRequests: '/admin/subscriptions/pending-requests',
    updateRequestStatus: (id: string | number) => `/admin/subscriptions/update-status/${id}`,
    request: '/admin/subscriptions/request'
  },
}; 