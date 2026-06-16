import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  Building2,
  CreditCard,
  History,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/ui/StatsCard";
import { useQuery } from "@/hooks/useApi";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { DashboardStats } from "@/types/dashboard";

const mockMonthlyFarmers = [
  { month: "Jan", farmers: 12 },
  { month: "Feb", farmers: 19 },
  { month: "Mar", farmers: 30 },
  { month: "Apr", farmers: 25 },
  { month: "May", farmers: 40 },
  { month: "Jun", farmers: 35 },
  { month: "Jul", farmers: 50 },
  { month: "Aug", farmers: 65 },
  { month: "Sep", farmers: 58 },
  { month: "Oct", farmers: 70 },
  { month: "Nov", farmers: 85 },
  { month: "Dec", farmers: 100 },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: dashboardStats,
    loading: statsLoading,
    error: statsError,
    execute: fetchStats,
  } = useQuery(() => apiCall(allRoutes.dashboard.stats, "get"), {
    autoExecute: true,
  });

  const stats: DashboardStats = dashboardStats?.data || dashboardStats || {};

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const adminActions = [
    {
      title: t("navigation.usersAndFarmers"),
      description: "Review dairy accounts and platform users.",
      icon: Building2,
      href: "/dairy-listing",
    },
    {
      title: t("navigation.adminPlans"),
      description: "Create plans and approve subscription requests.",
      icon: CreditCard,
      href: "/admin-subscription-plans",
    },
    {
      title: t("navigation.purchasedSubscriptions"),
      description: "Track purchased subscriptions and their status.",
      icon: History,
      href: "/purchased-subscriptions",
    },
    {
      title: t("navigation.milkReports"),
      description: "View platform reporting across dairies.",
      icon: BarChart3,
      href: "/dairy-reports",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage dairies, plans, subscriptions, and platform reporting.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          {t("navigation.settings")}
        </Button>
      </div>

      {statsError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <span className="text-sm text-destructive">
              Failed to load dashboard statistics.
            </span>
            <Button variant="outline" size="sm" onClick={() => fetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("common.refresh")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={t("dairyListing.dairies", "Active Dairies")}
          value={statsLoading ? "..." : formatNumber(stats.activeDairies)}
          change="Registered platform users"
          changeType="neutral"
          icon={Building2}
          gradient
        />
        <StatsCard
          title={t("dairyListing.farmers", "Active Farmers")}
          value={statsLoading ? "..." : formatNumber(stats.activeFarmers)}
          change="Registered across all dairies"
          changeType="neutral"
          icon={Users}
          gradient
        />
        <StatsCard
          title={t("navigation.purchasedSubscriptions", "Active Subscriptions")}
          value={statsLoading ? "..." : formatNumber(stats.activeSubscriptions)}
          change="Currently active plans"
          changeType="neutral"
          icon={CreditCard}
          gradient
        />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {stats.subscriptionPlans && stats.subscriptionPlans.length > 0 && (
          <div className="md:col-span-4">
            <h2 className="text-xl font-semibold mb-4">Subscription Plan Breakdown</h2>
            <Card className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.subscriptionPlans}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="planName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="totalPurchased" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      name="Purchased" 
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        <div className={stats.subscriptionPlans && stats.subscriptionPlans.length > 0 ? "md:col-span-8" : "md:col-span-12"}>
          <h2 className="text-xl font-semibold mb-4">Monthly Registered Farmers</h2>
          <Card className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyFarmers}>
                  <defs>
                    <linearGradient id="colorFarmers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="farmers" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorFarmers)" 
                    name="Farmers" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminActions.map((action) => (
          <Card
            key={action.href}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(action.href)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <action.icon className="h-5 w-5 text-primary" />
                {action.title}
              </CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
