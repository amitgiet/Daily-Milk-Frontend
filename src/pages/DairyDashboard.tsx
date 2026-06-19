import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CreditCard,
  Milk,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useQuery } from "@/hooks/useApi";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import {
  DashboardStats,
  FarmerMilkCollectionEntry,
  FarmerPendingPaymentEntry,
  MilkProgressReportEntry,
  TodayShiftMilkCollectionEntry,
} from "@/types/dashboard";
import { format } from "date-fns";
import {
  PayFarmerDialog,
  type PayFarmerInfo,
} from "@/components/payments/PayFarmerDialog";

interface MilkEntry {
  date: string;
  quantity: number | string;
}

type PeriodType = "today" | "month";

interface FarmerShiftChartPoint {
  name: string;
  fullName: string;
  morning: number;
  evening: number;
  total: number;
}

interface FarmerShiftAggregate {
  farmerId: number;
  name: string;
  morning: number;
  evening: number;
}

function mapFarmersWithPendingPayments(entries: FarmerPendingPaymentEntry[]) {
  return entries
    .map((entry) => ({
      id: entry.farmerId,
      name: entry.farmer?.name ?? `Farmer ${entry.farmerId}`,
      phone: entry.farmer?.phone ?? "",
      pending: Number(entry.totalAmount) || 0,
    }))
    .filter((farmer) => farmer.pending > 0)
    .sort((a, b) => b.pending - a.pending);
}

function getLast7DaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function buildMilkProgressChartData(entries: MilkProgressReportEntry[]) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      year: monthDate.getFullYear(),
      month: monthDate.getMonth() + 1,
      label: format(monthDate, "MMM yy"),
      liters: 0,
    };
  });

  const monthMap = new Map(
    months.map((month) => [`${month.year}-${month.month}`, month]),
  );

  for (const entry of entries) {
    const month = monthMap.get(`${entry.year}-${entry.month}`);
    if (!month) continue;
    month.liters = Math.round(Number(entry.totalQuantity || 0) * 10) / 10;
  }

  return months.map(({ label, liters }) => ({ label, liters }));
}

function buildWeeklyMilkData(
  entries: MilkEntry[],
  apiWeekly?: DashboardStats["weeklyMilkCollection"],
) {
  if (apiWeekly && apiWeekly.length > 0) {
    return apiWeekly.map((item) => ({
      label: format(new Date(item.date), "EEE"),
      liters: item.liters,
    }));
  }

  const { startDate } = getLast7DaysRange();
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });

  return last7Days.map((date) => ({
    label: format(new Date(date), "EEE"),
    liters: entries
      .filter((entry) => entry.date?.split("T")[0] === date)
      .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
  }));
}

function parseFarmerCollectionEntries(payload: unknown): FarmerMilkCollectionEntry[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const level1 = (payload as { data?: unknown }).data;
  if (Array.isArray(level1)) return level1;

  const level2 = (level1 as { data?: unknown } | undefined)?.data;
  if (Array.isArray(level2)) return level2;

  return [];
}

function truncateFarmerName(name?: string | null, maxLength = 14) {
  const safeName = name?.trim() || "Unknown";
  if (safeName.length <= maxLength) return safeName;
  return `${safeName.slice(0, maxLength)}…`;
}

function aggregateFarmerCollections(
  entries: FarmerMilkCollectionEntry[] = [],
): FarmerShiftAggregate[] {
  const byFarmer = new Map<number, FarmerShiftAggregate>();

  for (const entry of entries) {
    const farmerId = entry.farmerId ?? entry.farmer?.id;
    if (farmerId == null) continue;

    const farmerName = entry.farmer?.name?.trim() || `Farmer ${farmerId}`;
    const quantity = Number(entry.quantity) || 0;
    const existing = byFarmer.get(farmerId) ?? {
      farmerId,
      name: farmerName,
      morning: 0,
      evening: 0,
    };

    if (entry.shift === "morning") {
      existing.morning += quantity;
    } else {
      existing.evening += quantity;
    }

    byFarmer.set(farmerId, existing);
  }

  return Array.from(byFarmer.values()).sort(
    (a, b) => b.morning + b.evening - (a.morning + a.evening),
  );
}

function buildTodayFarmerList(entries: FarmerMilkCollectionEntry[]) {
  return aggregateFarmerCollections(entries).map((farmer) => ({
    supplier: farmer.name,
    morning: Math.round(farmer.morning * 10) / 10,
    evening: Math.round(farmer.evening * 10) / 10,
    total: Math.round((farmer.morning + farmer.evening) * 10) / 10,
    farmerId: farmer.farmerId,
  }));
}

function buildFarmerCollectionChartData(
  entries: FarmerMilkCollectionEntry[],
): FarmerShiftChartPoint[] {
  return aggregateFarmerCollections(entries).map((farmer) => ({
    name: truncateFarmerName(farmer.name),
    fullName: farmer.name,
    morning: Math.round(farmer.morning * 10) / 10,
    evening: Math.round(farmer.evening * 10) / 10,
    total: Math.round((farmer.morning + farmer.evening) * 10) / 10,
  }));
}

function buildTodayShiftChartData(
  entries: TodayShiftMilkCollectionEntry[],
  labels: { morning: string; evening: string; total: string },
) {
  const morningEntry = entries.find((entry) => entry.shift === "morning");
  const eveningEntry = entries.find((entry) => entry.shift === "evening");
  const morningValue =
    Math.round(Number(morningEntry?.totalQuantity || 0) * 10) / 10;
  const eveningValue =
    Math.round(Number(eveningEntry?.totalQuantity || 0) * 10) / 10;
  const totalValue = Math.round((morningValue + eveningValue) * 10) / 10;

  return [
    { shift: "morning", label: labels.morning, value: morningValue },
    { shift: "evening", label: labels.evening, value: eveningValue },
    { shift: "total", label: labels.total, value: totalValue },
  ];
}

function createShiftChartConfig(
  morningLabel: string,
  eveningLabel: string,
  totalLabel: string,
): ChartConfig {
  return {
    morning: {
      label: morningLabel,
      color: "hsl(var(--primary))",
    },
    evening: {
      label: eveningLabel,
      color: "hsl(var(--warning))",
    },
    total: {
      label: totalLabel,
      color: "#81219B",
    },
  };
}

export default function DairyDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const weeklyGradientId = useId().replace(/:/g, "");
  const [shiftPeriodType, setShiftPeriodType] = useState<PeriodType>("today");
  const [farmerPeriodType, setFarmerPeriodType] = useState<PeriodType>("today");
  const [showPayFarmerDialog, setShowPayFarmerDialog] = useState(false);
  const [selectedPayFarmer, setSelectedPayFarmer] = useState<PayFarmerInfo | null>(
    null,
  );

  const weeklyChartConfig = useMemo<ChartConfig>(
    () => ({
      liters: {
        label: t("dashboard.liters"),
        color: "hsl(var(--primary))",
      },
    }),
    [t],
  );

  const monthlyChartConfig = useMemo<ChartConfig>(
    () => ({
      liters: {
        label: t("dashboard.liters"),
        color: "hsl(var(--primary))",
      },
    }),
    [t],
  );

  const shiftChartConfig = useMemo(
    () =>
      createShiftChartConfig(
        t("dashboard.morning"),
        t("dashboard.evening"),
        t("dashboard.totalCollection"),
      ),
    [t],
  );

  const farmerShiftChartConfig = useMemo<ChartConfig>(
    () => ({
      morning: {
        label: t("dashboard.morning"),
        color: "hsl(var(--primary))",
      },
      evening: {
        label: t("dashboard.evening"),
        color: "hsl(var(--warning))",
      },
      total: {
        label: t("dashboard.totalCollection"),
        color: "#81219B",
      },
    }),
    [t],
  );

  const {
    data: dashboardStats,
    loading: statsLoading,
    error: statsError,
    execute: fetchStats,
  } = useQuery(() => apiCall(allRoutes.dashboard.stats, "get"), {
    autoExecute: true,
  });

  const { startDate, endDate } = getLast7DaysRange();

  const {
    data: weeklyMilkData,
    loading: weeklyMilkLoading,
    execute: fetchWeeklyMilk,
  } = useQuery(
    () => apiCall(allRoutes.milkCollection.list("", startDate, endDate), "get"),
    { autoExecute: true },
  );

  const {
    data: milkProgressData,
    loading: milkProgressLoading,
    error: milkProgressError,
    execute: fetchMilkProgressReport,
  } = useQuery(
    () => apiCall(allRoutes.dashboard.milkProgressPrevious12Months, "get"),
    { autoExecute: true },
  );

  const {
    data: todayFarmerListData,
    loading: todayFarmerListLoading,
    error: todayFarmerListError,
    execute: fetchTodayFarmerList,
  } = useQuery(
    () =>
      apiCall(allRoutes.dashboard.monthlyFarmerMilkCollections("today"), "get"),
    { autoExecute: true },
  );

  const {
    data: farmerCollectionsData,
    loading: farmerCollectionsLoading,
    error: farmerCollectionsError,
    execute: fetchFarmerCollections,
  } = useQuery(
    () =>
      apiCall(
        allRoutes.dashboard.monthlyFarmerMilkCollections(farmerPeriodType),
        "get",
      ),
    { autoExecute: false },
  );

  useEffect(() => {
    fetchFarmerCollections();
  }, [farmerPeriodType]);

  const {
    data: todayShiftMilkData,
    loading: todayShiftMilkLoading,
    error: todayShiftMilkError,
    execute: fetchTodayShiftMilkCollections,
  } = useQuery(
    () =>
      apiCall(
        allRoutes.dashboard.todayMorningEveningMilkCollections(shiftPeriodType),
        "get",
      ),
    { autoExecute: false },
  );

  useEffect(() => {
    fetchTodayShiftMilkCollections();
  }, [shiftPeriodType]);

  const {
    data: pendingFarmersData,
    loading: pendingFarmersLoading,
    error: pendingFarmersError,
    execute: fetchPendingFarmers,
  } = useQuery(
    () => apiCall(allRoutes.dashboard.farmersWithPendingPayments, "get"),
    { autoExecute: true },
  );

  const stats: DashboardStats = dashboardStats?.data?.data || {};
  const milkEntries: MilkEntry[] =
    weeklyMilkData?.data?.data || weeklyMilkData?.data || [];
  const milkProgressEntries: MilkProgressReportEntry[] =
    milkProgressData?.data?.data || milkProgressData?.data || [];
  const todayFarmerListEntries = useMemo(
    () => parseFarmerCollectionEntries(todayFarmerListData),
    [todayFarmerListData],
  );
  const farmerCollectionEntries = useMemo(
    () => parseFarmerCollectionEntries(farmerCollectionsData),
    [farmerCollectionsData],
  );
  const todayShiftMilkEntries: TodayShiftMilkCollectionEntry[] =
    todayShiftMilkData?.data?.data || todayShiftMilkData?.data || [];
  const pendingFarmerEntries: FarmerPendingPaymentEntry[] =
    pendingFarmersData?.data || [];

  const weeklyChartData = useMemo(
    () => buildWeeklyMilkData(milkEntries, stats.weeklyMilkCollection),
    [milkEntries, stats.weeklyMilkCollection],
  );

  const monthlyChartData = useMemo(
    () => buildMilkProgressChartData(milkProgressEntries),
    [milkProgressEntries],
  );

  const farmerChartData = useMemo(
    () => buildFarmerCollectionChartData(farmerCollectionEntries ?? []),
    [farmerCollectionEntries],
  );

  const todayMilkCollectionList = useMemo(
    () => buildTodayFarmerList(todayFarmerListEntries ?? []),
    [todayFarmerListEntries],
  );

  const shiftChartData = useMemo(
    () =>
      buildTodayShiftChartData(todayShiftMilkEntries, {
        morning: t("dashboard.morning"),
        evening: t("dashboard.evening"),
        total: t("dashboard.totalCollection"),
      }),
    [todayShiftMilkEntries, t],
  );

  const farmersWithPending = useMemo(
    () => mapFarmersWithPendingPayments(pendingFarmerEntries),
    [pendingFarmerEntries],
  );

  const totalPendingAmount = useMemo(
    () => farmersWithPending.reduce((sum, farmer) => sum + farmer.pending, 0),
    [farmersWithPending],
  );

  const handleRefresh = () => {
    fetchStats();
    fetchWeeklyMilk();
    fetchMilkProgressReport();
    fetchTodayFarmerList();
    fetchFarmerCollections();
    fetchTodayShiftMilkCollections();
    fetchPendingFarmers();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Milk className="h-6 w-6 text-primary" />
            Dairy Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage daily collection, dispatches, farmers, and payments.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.refresh")}
        </Button>
      </div>

      {statsError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load dashboard statistics.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-8">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Milk className="h-4 w-4 text-primary" />
                  {t("dashboard.farmerCollectionChart")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("dashboard.farmerCollectionChartDescription")}
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={farmerPeriodType === "today" ? "default" : "outline"}
                  className="h-7 px-3 text-xs"
                  onClick={() => setFarmerPeriodType("today")}
                >
                  {t("dashboard.today")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={farmerPeriodType === "month" ? "default" : "outline"}
                  className="h-7 px-3 text-xs"
                  onClick={() => setFarmerPeriodType("month")}
                >
                  {t("dashboard.thisMonth")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-0">
            {farmerCollectionsLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : farmerCollectionsError ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-destructive">
                {t("common.error")}
              </div>
            ) : !farmerChartData?.length ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                {farmerPeriodType === "today"
                  ? t("dashboard.noMilkCollectionToday")
                  : t("dashboard.noMonthlyFarmerCollection")}
              </div>
            ) : (
              <ChartContainer
                config={farmerShiftChartConfig}
                className="h-[340px] w-full aspect-auto"
              >
                <LineChart
                  data={farmerChartData ?? []}
                  accessibilityLayer
                  margin={{ bottom: 20 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: t("dashboard.liters"),
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))" },
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => {
                          const shiftLabel =
                            item.dataKey === "morning"
                              ? t("dashboard.morning")
                              : item.dataKey === "evening"
                                ? t("dashboard.evening")
                                : t("dashboard.totalCollection");

                          return (
                            <div className="flex w-full items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="flex flex-1 items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                  {shiftLabel}
                                </span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                  {value}L
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="morning"
                    stroke="var(--color-morning)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-morning)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="evening"
                    stroke="var(--color-evening)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-evening)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-total)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--color-total)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  {t("dashboard.shiftDistribution")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("dashboard.shiftDistributionDescription")}
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={shiftPeriodType === "today" ? "default" : "outline"}
                  className="h-7 px-3 text-xs"
                  onClick={() => setShiftPeriodType("today")}
                >
                  {t("dashboard.today")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={shiftPeriodType === "month" ? "default" : "outline"}
                  className="h-7 px-3 text-xs"
                  onClick={() => setShiftPeriodType("month")}
                >
                  {t("dashboard.thisMonth")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-0">
            {todayShiftMilkLoading ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : todayShiftMilkError ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-destructive">
                {t("common.error")}
              </div>
            ) : (
              <ChartContainer
                config={shiftChartConfig}
                className="h-[340px] w-full aspect-auto"
              >
                <BarChart
                  data={shiftChartData}
                  accessibilityLayer
                  margin={{ top: 20, bottom: 8, left: 8, right: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: t("dashboard.liters"),
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))" },
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="shift"
                        formatter={(value) => `${value}L`}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {shiftChartData.map((entry) => (
                      <Cell
                        key={entry.shift}
                        fill={`var(--color-${entry.shift})`}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => `${value}L`}
                      className="fill-foreground text-xs font-medium"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                {t("dashboard.farmersPendingPayment")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("dashboard.farmersPendingPaymentDescription")}
              </CardDescription>
            </div>
            {farmersWithPending.length > 0 && (
              <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                {formatCurrency(totalPendingAmount)}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-0">
            {pendingFarmersLoading ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : pendingFarmersError ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-destructive">
                {t("common.error")}
              </div>
            ) : farmersWithPending.length > 0 ? (
              <div className="space-y-3">
                <div className="max-h-[300px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("farmers.name")}</TableHead>
                        <TableHead className="text-center">
                          {t("customers.pendingAmount")}
                        </TableHead>
                        <TableHead className="text-right w-[88px]">
                          <span className="sr-only">{t("farmers.actions")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmersWithPending.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="align-middle">
                            <div className="space-y-1">
                              <p className="font-medium leading-none">{farmer.name}</p>
                              {farmer.phone ? (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {farmer.phone}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <span className="font-semibold text-warning">
                              {formatCurrency(farmer.pending)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setSelectedPayFarmer({
                                  id: farmer.id,
                                  name: farmer.name,
                                  phone: farmer.phone,
                                  pendingPayment: farmer.pending,
                                });
                                setShowPayFarmerDialog(true);
                              }}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              {t("dashboard.payNow")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate("/customers")}
                  >
                    {t("dashboard.viewAllFarmers")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                {t("dashboard.noPendingFarmers")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-8">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t("dashboard.monthlyMilkCollection")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("dashboard.monthlyMilkCollectionDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-0">
            {milkProgressLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : milkProgressError ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-destructive">
                {t("common.error")}
              </div>
            ) : (
              <ChartContainer
                config={monthlyChartConfig}
                className="h-[300px] w-full aspect-auto"
              >
                <BarChart data={monthlyChartData} accessibilityLayer margin={{ bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: t("dashboard.liters"),
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))" },
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(value) => `${value}L`} />
                    }
                  />
                  <Bar
                    dataKey="liters"
                    fill="var(--color-liters)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                  >
                    <LabelList
                      dataKey="liters"
                      position="top"
                      formatter={(value: number) => `${value}L`}
                      className="fill-foreground text-xs font-medium"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t("dashboard.weeklyMilkCollection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-0">
          {weeklyMilkLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : (
            <ChartContainer
              config={weeklyChartConfig}
              className="h-[300px] w-full aspect-auto"
            >
              <AreaChart data={weeklyChartData} accessibilityLayer>
                <defs>
                  <linearGradient
                    id={weeklyGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-liters)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-liters)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${value}L`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="liters"
                  stroke="var(--color-liters)"
                  strokeWidth={2}
                  fill={`url(#${weeklyGradientId})`}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Milk className="h-4 w-4 text-primary" />
            {t("dashboard.todaysMilkCollection")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("dashboard.milkCollectionDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-0">
          {todayFarmerListLoading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : todayFarmerListError ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-destructive">
              {t("common.error")}
            </div>
          ) : todayMilkCollectionList.length > 0 ? (
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {todayMilkCollectionList.map((item) => (
                <div
                  key={item.farmerId ?? item.supplier}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.supplier}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.morning")}: {item.morning}L ·{" "}
                      {t("dashboard.evening")}: {item.evening}L
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-sm font-semibold text-primary">{item.total}L</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("dashboard.total")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.noMilkCollectionToday")}
            </div>
          )}
        </CardContent>
      </Card>

      <PayFarmerDialog
        open={showPayFarmerDialog}
        onOpenChange={(open) => {
          setShowPayFarmerDialog(open);
          if (!open) setSelectedPayFarmer(null);
        }}
        farmer={selectedPayFarmer}
        onPaymentSuccess={() => {
          fetchPendingFarmers();
          fetchStats();
        }}
      />
    </div>
  );
}
