import { useState } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  User,
  Menu,
  X,
  Milk,
  LogOut,
  ChevronDown,
  CreditCard,
  Calculator,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, getRoleName } from "@/lib/permissions";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout, hasSubscription, dairySubscription } = useAuth();

  // Get user role
  const userRole = user?.roleId || 1;

  // Define all navigation items
  const allNavigation = [
    { name: t("navigation.dashboard"), href: "/", icon: Home },
    // { name: t('navigation.inventory'), href: "/inventory", icon: Package },
    // { name: t('navigation.dairyRates'), href: "/dairy-rates", icon: Calculator },
    // { name: t('navigation.orders'), href: "/orders", icon: ShoppingCart },
    {
      name: t("navigation.milkCollection"),
      href: "/milk-collection",
      icon: Milk,
    },
    { name: t("navigation.customers"), href: "/customers", icon: User },
    // { name: t("navigation.reports"), href: "/reports", icon: BarChart3 },
    {
      name: "Users and Farmers",
      href: "/dairy-listing",
      icon: Building2,
    },
    {
      name: t("navigation.subscriptionPlans"),
      href: "/subscription-plans",
      icon: CreditCard,
    },
    {
      name: "Admin Plans",
      href: "/admin-subscription-plans",
      icon: CreditCard,
    },
    { name: t("navigation.settings"), href: "/settings", icon: Settings },
  ];

  // Filter navigation based on user role and subscription
  const navigation = allNavigation.filter(item => canAccessRoute(userRole, item.href, hasSubscription));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userEmail = user?.email || user?.phone || "admin@milkyway.com";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-foreground/80"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Milk className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                DairyTrack
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="px-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col bg-card border-r border-border">
          <div className="flex h-16 shrink-0 items-center px-6">
            <div className="flex items-center space-x-2">
              <Milk className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                DairyTrack
              </span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-sm">
          <button
            type="button"
            className="border-r border-border px-4 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-foreground">
                {/* {navigation.find((item) => item.href === location.pathname)
                  ?.name || t("navigation.dashboard")} */}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />

              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center p-0">
                  3
                </Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:block text-sm text-muted-foreground">
                      {userEmail.split("@")[0]}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Signed in as
                    </p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Role: {getRoleName(userRole)}
                    </p>
                    {hasSubscription && dairySubscription && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Subscription: Active
                      </p>
                    )}
                    {!hasSubscription && (
                      <p className="text-xs text-muted-foreground mt-1 text-destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        No active subscription
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {canAccessRoute(userRole, '/settings') && (
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t("navigation.settings")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]"><Outlet /></main>
      </div>
    </div>
  );
}
