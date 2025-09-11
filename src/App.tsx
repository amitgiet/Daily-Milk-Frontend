import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteLogger from "./components/RouteLogger";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import MilkCollection from "./pages/MilkCollection";
import DairyRates from "./pages/DairyRates";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import AdminSubscriptionPlans from "./pages/AdminSubscriptionPlans";
import DairyListing from "./pages/DairyListing";
import DairyReports from "./pages/DairyReports";
import NotFound from "./pages/NotFound";
import DiaryDispatch from "./pages/DiaryDispatch";
import PaymentManagement from "./pages/PaymentManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteLogger />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes with Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              {/* <Route path="inventory" element={<Inventory />} /> */}
              <Route path="milk-collection" element={<MilkCollection />} />
              {/* <Route path="dairy-rates" element={<DairyRates />} /> */}
              <Route path="dairy-reports" element={<DairyReports />} />
              <Route path="customers" element={<Customers />} />
              <Route path="orders" element={<Orders />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="subscription-plans" element={<SubscriptionPlans />} />
              <Route path="dairy-listing" element={<DairyListing />} />
              <Route path="admin-subscription-plans" element={<AdminSubscriptionPlans />} />
              <Route path="diary-dispatch" element={<DiaryDispatch />} />
              <Route path="payment-management" element={<PaymentManagement />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
