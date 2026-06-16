import { useId, useMemo } from "react";
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
  FarmerPendingPaymentEntry,
  TodayMilkCollectionEntry,
} from "@/types/dashboard";
import { format } from "date-fns";

interface MilkEntry {
  date: string;
  quantity: number | string;
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

function aggregateTodayMilkCollections(entries: TodayMilkCollectionEntry[]) {
  const byFarmer = new Map<
    number,
    { farmerId: number; name: string; morning: number; evening: number }
  >();

  for (const entry of entries) {
    const quantity = Number(entry.quantity) || 0;
    const farmerName = entry.farmer?.name ?? `Farmer ${entry.farmerId}`;
    const existing = byFarmer.get(entry.farmerId) ?? {
      farmerId: entry.farmerId,
      name: farmerName,
      morning: 0,
      evening: 0,
    };

    if (entry.shift === "morning") {
      existing.morning += quantity;
    } else {
      existing.evening += quantity;
    }

    byFarmer.set(entry.farmerId, existing);
  }

  return Array.from(byFarmer.values())
    .map((farmer) => ({
      ...farmer,
      total: farmer.morning + farmer.evening,
    }))
    .sort((a, b) => b.total - a.total);
}

function truncateFarmerName(name: string, maxLength = 14) {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength)}…`;
}

const MOCK_SHIFT_DISTRIBUTION = {
  morning: 420,
  evening: 380,
};

function createShiftChartConfig(
  morningLabel: string,
  eveningLabel: string,
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
  };
}

export default function DairyDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const weeklyGradientId = useId().replace(/:/g, "");

  const weeklyChartConfig = useMemo<ChartConfig>(
    () => ({
      liters: {
        label: t("dashboard.liters"),
        color: "hsl(var(--primary))",
      },
    }),
    [t],
  );

  const shiftChartConfig = useMemo(
    () => createShiftChartConfig(t("dashboard.morning"), t("dashboard.evening")),
    [t],
  );

  const farmerChartConfig = useMemo<ChartConfig>(
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
        color: "hsl(var(--destructive))",
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
    data: todayMilkCollectionsData,
    loading: todayMilkLoading,
    error: todayMilkError,
    execute: fetchTodayMilkCollections,
  } = useQuery(() => apiCall(allRoutes.dashboard.todayMilkCollections, "get"), {
    autoExecute: true,
  });

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
  const todayMilkEntries: TodayMilkCollectionEntry[] =
    todayMilkCollectionsData?.data || [];
  const pendingFarmerEntries: FarmerPendingPaymentEntry[] =
    pendingFarmersData?.data || [];

  const todayMilkSummaries = useMemo(
    () => aggregateTodayMilkCollections(todayMilkEntries),
    [todayMilkEntries],
  );

  const weeklyChartData = useMemo(
    () => buildWeeklyMilkData(milkEntries, stats.weeklyMilkCollection),
    [milkEntries, stats.weeklyMilkCollection],
  );

  const farmerChartData = useMemo(
    () =>
      todayMilkSummaries.map((item) => ({
        name: truncateFarmerName(item.name),
        morning: item.morning,
        evening: item.evening,
        total: item.total,
      })),
    [todayMilkSummaries],
  );

  const todayMilkCollectionList = useMemo(
    () =>
      todayMilkSummaries.map((item) => ({
        supplier: item.name,
        morning: item.morning,
        evening: item.evening,
        total: item.total,
        farmerId: item.farmerId,
      })),
    [todayMilkSummaries],
  );

  const shiftChartData = useMemo(() => {
    const morningTotal = todayMilkSummaries.reduce(
      (sum, item) => sum + item.morning,
      0,
    );
    const eveningTotal = todayMilkSummaries.reduce(
      (sum, item) => sum + item.evening,
      0,
    );

    if (todayMilkSummaries.length > 0) {
      return [
        { shift: "morning", label: t("dashboard.morning"), value: morningTotal },
        { shift: "evening", label: t("dashboard.evening"), value: eveningTotal },
      ];
    }

    return [
      {
        shift: "morning",
        label: t("dashboard.morning"),
        value: MOCK_SHIFT_DISTRIBUTION.morning,
      },
      {
        shift: "evening",
        label: t("dashboard.evening"),
        value: MOCK_SHIFT_DISTRIBUTION.evening,
      },
    ];
  }, [todayMilkSummaries, t]);

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
    fetchTodayMilkCollections();
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

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Milk className="h-4 w-4 text-primary" />
            {t("dashboard.farmerCollectionChart")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("dashboard.farmerCollectionChartDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-0">
          {todayMilkLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : todayMilkError ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-destructive">
              {t("common.error")}
            </div>
          ) : farmerChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.noMilkCollectionToday")}
            </div>
          ) : (
            <ChartContainer
              config={farmerChartConfig}
              className="h-[340px] w-full aspect-auto"
            >
              <LineChart data={farmerChartData} accessibilityLayer margin={{ bottom: 20 }}>
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
                              <span className="text-muted-foreground">{shiftLabel}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-6">
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
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : pendingFarmersError ? (
              <div className="py-8 text-center text-sm text-destructive">
                {t("common.error")}
              </div>
            ) : farmersWithPending.length > 0 ? (
              <div className="space-y-4">
                <div className="max-h-[400px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("farmers.name")}</TableHead>
                        <TableHead>{t("farmers.phone")}</TableHead>
                        <TableHead className="text-right">
                          {t("customers.pendingAmount")}
                        </TableHead>
                        <TableHead className="text-right">{t("farmers.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmersWithPending.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="font-medium">{farmer.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {farmer.phone}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-warning">
                              {formatCurrency(farmer.pending)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate("/payment-management")}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {t("dashboard.payNow")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => navigate("/customers")}>
                    {t("dashboard.viewAllFarmers")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("dashboard.noPendingFarmers")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-6">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">
              {t("dashboard.shiftDistribution")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("dashboard.shiftDistributionDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 pb-0">
            <ChartContainer
              config={shiftChartConfig}
              className="h-[220px] w-full aspect-auto"
            >
              <BarChart
                data={shiftChartData}
                layout="vertical"
                accessibilityLayer
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="shift"
                      formatter={(value) => `${value}L`}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36}>
                  {shiftChartData.map((entry) => (
                    <Cell
                      key={entry.shift}
                      fill={`var(--color-${entry.shift})`}
                    />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(value: number) => `${value}L`}
                    className="fill-foreground text-xs font-medium"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-8">
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
            {todayMilkLoading ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : todayMilkError ? (
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
      </div>
    </div>
  );
}
