import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  AlertTriangle,
  Milk,
  Clock,
  CalendarDays,
  Building2,
  RefreshCw
} from "lucide-react";
import dairyHero from "@/assets/dairy-hero.jpg";
import { useQuery } from "@/hooks/useApi";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { DashboardStats } from "@/types/dashboard";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { 
    data: dashboardStats, 
    loading: statsLoading, 
    error: statsError,
    execute: fetchStats 
  } = useQuery(
    () => apiCall(allRoutes.dashboard.stats, 'get'),
    {
      autoExecute: true,
      onError: (error) => {
        console.error('Failed to load dashboard stats:', error);
      }
    }
  );

  // Extract stats from API response
  const stats: DashboardStats = dashboardStats?.data?.data || {};
  
  // Format currency values
  const formatCurrency = (amount?: number) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format numbers with commas
  const formatNumber = (num?: number) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const handleAddNewProduct = () => {
    navigate('/inventory');
    // Add a slight delay to ensure navigation completes, then trigger the add dialog
    setTimeout(() => {
      // This will be handled by the inventory page to open the add dialog
      const event = new CustomEvent('openAddDialog');
      window.dispatchEvent(event);
    }, 100);
  };

  const handleDailyReport = () => {
    navigate('/reports');
  };

  const handleViewOrderDetails = () => {
    navigate('/orders');
  };

  const handleRefreshStats = () => {
    fetchStats();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-glow">
        <div className="absolute inset-0">
          <img 
            src={dairyHero} 
            alt="Dairy Farm" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative px-8 py-12">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-6">
            {t('dashboard.welcomeDescription')}
          </p>
          <div className="flex flex-wrap gap-3">
            {statsError && (
              <Button variant="outline" size="lg" className="border-red-200 text-red-200 hover:bg-red-200 hover:text-red-800" onClick={handleRefreshStats}>
                <RefreshCw className="h-5 w-5 mr-2" />
                {t('common.refresh')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {statsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{t('common.error')}: Failed to load dashboard statistics</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('dashboard.totalProducts')}
          value={statsLoading ? "..." : formatNumber(stats.totalProducts)}
          change={t('dashboard.thisWeek')}
          changeType="positive"
          icon={Package}
          gradient
        />

        <StatsCard
          title={t('dashboard.ordersToday')}
          value={statsLoading ? "..." : formatNumber(stats.todayOrders)}
          change={t('dashboard.fromYesterday')}
          changeType="positive"
          icon={ShoppingCart}
          gradient
        />

        <StatsCard
          title={t('dashboard.revenueToday')}
          value={statsLoading ? "..." : formatCurrency(stats.todayRevenue)}
          change="+15.3%"
          changeType="positive"
          icon={TrendingUp}
          gradient
        />

        <StatsCard
          title={t('dashboard.todayMilkCollection')}
          value={statsLoading ? "..." : `${formatNumber(stats.todayMilkCollection)}L`}
          change={t('dashboard.fromYesterday')}
          changeType="positive"
          icon={Milk}
          gradient
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Milk Collection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Milk className="h-5 w-5 text-primary" />
              {t('dashboard.todaysMilkCollection')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.milkCollectionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8">{t('common.loading')}</div>
            ) : stats.todayMilkCollectionDetails && stats.todayMilkCollectionDetails.length > 0 ? (
              <div className="space-y-4">
                {stats.todayMilkCollectionDetails.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">{item.supplier}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.morning')}: {item.morning}L • {t('dashboard.evening')}: {item.evening}L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{item.total}L</p>
                      <p className="text-sm text-muted-foreground">{t('dashboard.total')}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{t('dashboard.totalCollection')}:</span>
                    <span className="text-xl font-bold text-primary">
                      {stats.todayMilkCollectionDetails.reduce((sum, item) => sum + item.total, 0)}L
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('dashboard.noMilkCollectionToday')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              {t('dashboard.lowStockAlert')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.lowStockDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8">{t('common.loading')}</div>
            ) : stats.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockAlerts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.min')}: {item.minimum} {item.unit}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {item.current} {item.unit}
                    </Badge>
                  </div>
                ))}
                <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/inventory')}>
                  {t('dashboard.viewAllStock')}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('dashboard.noLowStockItems')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t('dashboard.recentOrders')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.recentOrdersDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : stats.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-foreground">{order.id}</p>
                      <Badge 
                        variant={
                          order.status === "delivered" ? "default" :
                          order.status === "processing" ? "secondary" : "outline"
                        }
                      >
                        {t(`orders.${order.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{order.customer}</p>
                    <p className="text-sm text-foreground">{order.items}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{order.time}</p>
                    {order.total && (
                      <p className="text-sm font-medium text-foreground">{formatCurrency(order.total)}</p>
                    )}
                    <Button variant="ghost" size="sm" className="mt-1" onClick={handleViewOrderDetails}>
                      {t('dashboard.viewDetails')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('dashboard.noRecentOrders')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}