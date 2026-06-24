// API Routes organized by feature
export const allRoutes = {
  auth: {
    register: "/auth/registeration",
    login: "/auth/login",
    forgotPassword: "/auth/forgot-password",
    otpVerify: "/auth/otp-verify",
    changePassword: "/auth/change-password",
    refreshToken: "/auth/refresh",
    logout: "/auth/logout",
  },
  users: {
    profile: "/admin/users/profile",
    updateProfile: "/admin/users/update-profile",
    updateAddress: "/admin/users/update-address",
    updateProfilePicture: "/admin/users/update-profile-picture",
  },
  farmers: {
    getFarmers: "/admin/farmers",
    addFarmer: "/admin/farmers",
    getFarmerDairies: (id: string | number) => `/admin/farmers/${id}/dairies`,
    updateFarmer: (id: string | number) => `/admin/farmers/${id}`,
    getFarmer: (id: string | number) => `/admin/farmers/${id}`,
    delete: (id: string | number) => `/admin/farmers/${id}`,
  },
  milkCollection: {
    collect: "/admin/milk/collect",
    syncOfflineData: "/admin/milk/sync-offline-data",
    list: (
      farmerId: string | number = "",
      startDate?: string,
      endDate?: string,
      shift?: string,
      dairyId?: string | number,
      today?: string,
    ) => {
      let url = "/admin/milk/list";
      const params: string[] = [];

      if (farmerId) {
        params.push(`farmerId=${farmerId}`);
      }
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);

      if (shift) {
        params.push(`shift=${shift}`);
      }

      if (dairyId) {
        params.push(`dairyId=${dairyId}`);
      }

      if (today) {
        params.push(`today=${today}`);
      }

      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      return url;
    },
    get: (id: string | number) => `/admin/milk/${id}`,
    printReceipt: (id: string | number) => `/admin/milk/print-receipt/${id}`,
    update: (id: string | number) => `/admin/milk/update/${id}`,
    delete: (id: string | number) => `/admin/milk/${id}`,
    getUnpaidMilkCollections: (farmerId: string | number) =>
      `/admin/milk/get-unpaid-milk-collections?farmerId=${farmerId}`,
  },
  inventory: {
    list: "/admin/inventory",
    add: "/admin/inventory",
    update: (id: string | number) => `/admin/inventory/${id}`,
    get: (id: string | number) => `/admin/inventory/${id}`,
    delete: (id: string | number) => `/admin/inventory/${id}`,
    adjustStock: (id: string | number) => `/admin/inventory/${id}/adjust-stock`,
  },
  dashboard: {
    stats: "/admin/dashboard-stats",
    todayMorningEveningMilkCollections: (type: "today" | "month" = "today") =>
      `/admin/dairy/dashboard/today-morning-evening-milk-collections?type=${type}`,
    farmersWithPendingPayments:
      "/admin/dairy/dashboard/farmers-with-pending-payments",
    milkProgressPrevious12Months:
      "/admin/dairy/dashboard/milk-progress-previous-12-month",
    monthlyFarmerMilkCollections: (type: "today" | "month" = "today") =>
      `/admin/dairy/dashboard/monthly-farmer-milk-collections?type=${type}`,
    lowStockAlerts: "/admin/dashboard/low-stock-alerts",
    recentActivity: "/admin/dashboard/recent-activity",
  },
  reports: {
    milkDistribution: (
      farmerId: string | number = "",
      startDate?: string,
      endDate?: string,
      shift?: string,
      dairyId?: string | number,
    ) => {
      let url = "/admin/milk/report";
      const params: string[] = [];

      if (farmerId) {
        params.push(`farmerId=${farmerId}`);
      }
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);

      if (shift) {
        params.push(`shift=${shift}`);
      }

      if (dairyId) {
        params.push(`dairyId=${dairyId}`);
      }

      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      return url;
    },
    milkReportPdf: (
      farmerId: string | number = "",
      startDate?: string,
      endDate?: string,
    ) => {
      const params = [
        `farmerId=${farmerId ?? ""}`,
        `startDate=${startDate ?? ""}`,
        `endDate=${endDate ?? ""}`,
      ];
      return `/admin/pdf/milk-report?${params.join("&")}`;
    },
    paymentStatementPdf: (
      farmerId: string | number = "",
      startDate?: string,
      endDate?: string,
    ) => {
      const params = [
        `farmerId=${farmerId ?? ""}`,
        `startDate=${startDate ?? ""}`,
        `endDate=${endDate ?? ""}`,
      ];
      return `/admin/pdf/payment-report?${params.join("&")}`;
    },
    sales: "/admin/reports/sales",
    inventory: "/admin/reports/inventory",
    farmers: "/admin/reports/farmers",
    milkCollection: "/admin/reports/milk-collection",
  },
  diaryDispatch: {
    list: "/admin/milk-dispatches",
    add: "/admin/milk-dispatches",
    update: (id: string | number) => `/admin/milk-dispatches/${id}`,
    delete: (id: string | number) => `/admin/milk-dispatches/${id}`,
  },
  dairies: {
    list: (page: number, limit: number, search = "") =>
      `/admin/get-dairies?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    get: (id: string | number) => `/admin/get-dairy/${id}`,
    add: "/admin/dairy-registeration",
  },
  dairy: {
    rates: "/admin/dairy/rates",
    updateRates: "/admin/dairy/rates",
    addFarmerPayments: "/admin/dairy/farmer-payments",
    updateFarmerPayments: (id: string | number) =>
      `/admin/dairy/farmer-payments/${id}`,
    getFarmerPayments: (
      id: string | number,
      startDate?: string,
      endDate?: string,
    ) => {
      let url = `/admin/dairy/farmer-payments/?`;
      if (id) url += `&farmerId=${id}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      return url;
    },
    getFarmerPaymentHistory: (
      farmerId: string | number,
      type: "today" | "month" | "12month" = "month",
    ) =>
      `/admin/dairy/get-farmer-payment-history?farmerId=${farmerId}&type=${type}`,
  },
  subscriptions: {
    list: "/admin/subscriptions",
    add: "/admin/subscriptions",
    update: (id: string | number) => `/admin/subscriptions/${id}`,
    get: (id: string | number) => `/admin/subscriptions/${id}`,
    delete: (id: string | number) => `/admin/subscriptions/${id}`,
    toggleStatus: (id: string | number) => `/admin/subscriptions/${id}/status`,
    pendingRequests: "/admin/subscriptions/pending-requests",
    updateRequestStatus: (id: string | number) =>
      `/admin/subscriptions/update-status/${id}`,
    request: "/admin/subscriptions/request",
    // Subscription history endpoint (supports query params: dairyId, status, page, limit)
    history: "/admin/subscriptions/history",
  },
};
