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
  User,
  Menu,
  X,
  Milk,
  LogOut,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Calculator,
  AlertTriangle,
  Building2,
  Database,
  Truck,
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
import { NotificationPopup } from "./NotificationPopup";
import {
  NetworkStatusBadge,
  NetworkStatusNotifier,
  OfflineBanner,
} from "./NetworkStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  canAccessRoute,
  getRoleName,
  isSubscriptionActive,
} from "@/lib/permissions";

import logo from '../assets/logo.png';
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptionMenuOpen, setSubscriptionMenuOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout, hasSubscription, dairySubscription } = useAuth();

  // Get user role
  const userRole = user?.roleId || 1;

  // Check if user has active subscription
  const hasActiveSubscription =
    hasSubscription || isSubscriptionActive(dairySubscription);
  const dashboardHref =
    userRole === 1
      ? "/admin-dashboard"
      : userRole === 2
        ? "/dairy-dashboard"
        : "/";

  // Define navigation items based on subscription status
  const getNavigationItems = () => {
    // Special handling for roleId 3 (Farmer) - hide subscription plans, show milk collection
    if (userRole === 3) {
      return [
        { name: t("navigation.dashboard"), href: dashboardHref, icon: Home },
        {
          name: t("navigation.milkCollection"),
          href: "/milk-collection",
          icon: Milk,
        },
        {
          name: t("navigation.offlineData"),
          href: "/offline-data",
          icon: Database,
        },
        { name: t("navigation.settings"), href: "/settings", icon: Settings },
      ];
    }

    // If user doesn't have subscription and is not admin, only show subscription plans
    if (!hasActiveSubscription && userRole !== 1) {
      // 1 is ADMIN role
      return [
        {
          name: t("navigation.subscriptionPlans"),
          href: "/subscription-plans",
          icon: CreditCard,
        },
      ];
    }

    // If user has subscription or is admin, show all available navigation
    const allNavigation = [
      { name: t("navigation.dashboard"), href: dashboardHref, icon: Home },
      {
        name: t("navigation.milkCollection"),
        href: "/milk-collection",
        icon: Milk,
      },
      {
        name: t("navigation.offlineData"),
        href: "/offline-data",
        icon: Database,
      },
      { name: t("navigation.customers"), href: "/customers", icon: User },
      {
        name: t("dairyListing.dairies", "Dairies"),
        href: "/dairy-listing",
        icon: Building2,
      },
      {
        name: t("dairyListing.farmers", "Farmers"),
        href: "/farmer-listing",
        icon: User,
      },
      /* {
        name: t("navigation.dairySubscriptions"),
        href: "/dairy-subscriptions",
        icon: Package,
      }, */
      {
        name: t("navigation.purchasedSubscriptions"),
        href: "/purchased-subscriptions",
        icon: Package,
      },
      {
        name: t("navigation.milkReports"),
        href: "/dairy-reports",
        icon: BarChart3,
      },
      {
        name: t("navigation.subscriptionPlans"),
        href: "/subscription-plans",
        icon: CreditCard,
      },
      {
        name: t("navigation.diarydispatch"),
        href: "/diary-dispatch",
        icon: Truck,
      },
      {
        name: t("navigation.paymentManagement"),
        href: "/payment-management",
        icon: CreditCard,
      },
      {
        name: t("navigation.adminPlans"),
        href: "/admin-subscription-plans",
        icon: CreditCard,
      },
      {
        name: t("navigation.pendingSubscriptions"),
        href: "/pending-subscriptions",
        icon: Users,
      },
      { name: t("navigation.settings"), href: "/settings", icon: Settings },
    ];

    // Filter navigation based on user role and subscription
    return allNavigation.filter((item) => {
      if (
        userRole === 1 &&
        ["/milk-collection", "/offline-data", "/customers", "/diary-dispatch", "/subscription-plans"].includes(
          item.href,
        )
      ) {
        return false;
      }

      return canAccessRoute(userRole, item.href, hasActiveSubscription);
    });
  };

  const navigation = getNavigationItems();
  const subscriptionHrefs = [
    "/subscription-plans",
    "/dairy-subscriptions",
    "/purchased-subscriptions",
    "/admin-subscription-plans",
    "/pending-subscriptions",
  ];
  const subscriptionItems = navigation.filter((item) =>
    subscriptionHrefs.includes(item.href),
  );
  const mainNavigation = navigation.filter(
    (item) => !subscriptionHrefs.includes(item.href),
  );
  const isSubscriptionRoute = subscriptionItems.some(
    (item) => item.href === location.pathname,
  );

  const renderNavigation = (isMobile = false) => (
    <>
      {mainNavigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )
          }
          onClick={() => {
            if (isMobile) setSidebarOpen(false);
          }}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </NavLink>
      ))}

      {subscriptionItems.length > 0 && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSubscriptionMenuOpen((open) => !open)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isSubscriptionRoute
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <span className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5" />
              <span>{t("navigation.subscriptions")}</span>
            </span>
            {subscriptionMenuOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {subscriptionMenuOpen && (
            <div className="space-y-1 pl-4">
              {subscriptionItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )
                  }
                  onClick={() => {
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userDisplayName =
    user?.name || user?.email || user?.phone || "admin@Dairy Book.com";
  const userHeaderLabel = user?.dairyCode
    ? `${userDisplayName} · ${user.dairyCode}`
    : userDisplayName;

  return (
    <div className="min-h-screen bg-background">
      <NetworkStatusNotifier />
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div
          className="fixed inset-0 bg-foreground/80"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              {/* <Milk className="h-8 w-8 text-primary" /> */}
              <img
                src={logo}
                alt="Dairy Book"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-foreground">
                Dairy Book
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
          {/* Subscription Status Indicator */}
          {!hasActiveSubscription && userRole !== 1 && userRole !== 3 && (
            <div className="px-4 pb-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {t("navigation.subscriptionRequired")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("navigation.subscribeToAccess")}
                </p>
              </div>
            </div>
          )}
          <nav className="px-4 space-y-2">
            {renderNavigation(true)}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col bg-card border-r border-border">
          <div className="flex h-16 shrink-0 items-center px-6">
            <div className="flex items-center space-x-2">
              <img
                src={logo}
                alt="Dairy Book"
                className="h-8 w-8"
              />
              {/* <Milk className="h-8 w-8 text-primary" /> */}
              <span className="text-xl font-bold text-foreground">
                Dairy Book
              </span>
            </div>
          </div>
          {/* Subscription Status Indicator for Desktop */}
          {!hasActiveSubscription && userRole !== 1 && userRole !== 3 && (
            <div className="px-6 pb-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {t("navigation.subscriptionRequired")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("navigation.subscribeToAccess")}
                </p>
              </div>
            </div>
          )}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              <li className="space-y-2">{renderNavigation()}</li>
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
              <NetworkStatusBadge className="hidden sm:inline-flex" />

              <LanguageSwitcher />

              <NotificationPopup />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:block text-sm text-muted-foreground">
                      {userHeaderLabel}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {t("navigation.signedInAs")}
                    </p>
                    <p className="text-sm text-muted-foreground">{userDisplayName}</p>
                    {user?.dairyCode ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("settings.dairyCode")}: {user.dairyCode}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("navigation.role")}:{" "}
                      {(() => {
                        switch (userRole) {
                          case 1:
                            return t("roles.admin");
                          case 2:
                            return t("roles.dairy");
                          case 3:
                            return t("roles.farmer");
                          default:
                            return t("roles.unknown");
                        }
                      })()}
                    </p>
                    {userRole !== 3 && hasActiveSubscription && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("navigation.subscription")}: {t("navigation.active")}
                      </p>
                    )}
                    {userRole !== 3 && !hasActiveSubscription && (
                      <p className="text-xs text-muted-foreground mt-1 text-destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {t("navigation.noActiveSubscription")}
                      </p>
                    )}
                    <div className="mt-2">
                      <NetworkStatusBadge />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {canAccessRoute(userRole, "/settings") && (
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

        <OfflineBanner />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
