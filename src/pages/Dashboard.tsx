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
  CalendarDays
} from "lucide-react";
import dairyHero from "@/assets/dairy-hero.jpg";

const recentOrders = [
  { id: "ORD-001", customer: "Raj Dairy Store", items: "100L Milk, 5kg Paneer", status: "pending", time: "2 hours ago" },
  { id: "ORD-002", customer: "Fresh Mart", items: "50L Milk, 2kg Curd", status: "delivered", time: "4 hours ago" },
  { id: "ORD-003", customer: "City Grocers", items: "200L Milk", status: "processing", time: "6 hours ago" },
];

const lowStockItems = [
  { name: "Paneer", current: 5, minimum: 10, unit: "kg" },
  { name: "Ghee", current: 8, minimum: 15, unit: "kg" },
  { name: "Curd", current: 12, minimum: 20, unit: "kg" },
];

const todayMilkCollection = [
  { supplier: "Green Valley Farm", morning: 500, evening: 450, total: 950 },
  { supplier: "Sunrise Dairy", morning: 300, evening: 280, total: 580 },
  { supplier: "Hill View Ranch", morning: 200, evening: 180, total: 380 },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
            <Button variant="secondary" size="lg" onClick={handleAddNewProduct}>
              <Package className="h-5 w-5 mr-2" />
              {t('dashboard.addNewProduct')}
            </Button>
            <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={handleDailyReport}>
              <CalendarDays className="h-5 w-5 mr-2" />
              {t('dashboard.dailyReport')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title={t('dashboard.totalProducts')}
          value="247"
          change={t('dashboard.thisWeek')}
          changeType="positive"
          icon={Package}
          gradient
        />

        <StatsCard
          title={t('dashboard.ordersToday')}
          value="43"
          change={t('dashboard.fromYesterday')}
          changeType="positive"
          icon={ShoppingCart}
          gradient
        />
        <StatsCard
          title={t('dashboard.revenueToday')}
          value="₹25,480"
          change="+15.3%"
          changeType="positive"
          icon={TrendingUp}
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
            <div className="space-y-4">
              {todayMilkCollection.map((item, index) => (
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
                    {todayMilkCollection.reduce((sum, item) => sum + item.total, 0)}L
                  </span>
                </div>
              </div>
            </div>
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
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
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
          <div className="space-y-4">
            {recentOrders.map((order) => (
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
                  <Button variant="ghost" size="sm" className="mt-1" onClick={handleViewOrderDetails}>
                    {t('dashboard.viewDetails')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}