import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allRoutes } from "@/lib/apiRoutes";
import { apiCall } from "@/lib/apiCall";
import { formatDisplayDate } from "@/lib/dateFormat";
import { DateInput } from "@/components/ui/date-input";
import { Filter, X,Milk, RefreshCw } from "lucide-react";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const DairyReports = () => {
  const { t } = useTranslation();
  const [milkEntries, setMilkEntries] = useState([]);
  const [milkLoading, setMilkLoading] = useState(true);
  const [farmerList, setFarmerList] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all");
  const [startDate, setStartDate] = useState(getTodayDate);
  const [endDate, setEndDate] = useState(getTodayDate);

  const fetchMilkEntries = async () => {
    setMilkLoading(true);
    try {
      const selectedShiftValue = selectedShift === "all" ? null : selectedShift;
      const selectedFarmerId = selectedFarmer === "all" ? null : selectedFarmer;

      const response = await apiCall(
        allRoutes.reports.milkDistribution(
          selectedFarmerId,
          startDate || undefined,
          endDate || undefined,
          selectedShiftValue,
        ),
        "get",
      );

      if (response.success) {
        setMilkEntries(response.data.data || []);
      } else {
        setMilkEntries([]);
      }
    } catch (error) {
      console.error("Error fetching milk entries:", error);
      setMilkEntries([]);
    } finally {
      setMilkLoading(false);
    }
  };

  const getFarmerList = async () => {
    try {
      const response = await apiCall(allRoutes.farmers.getFarmers, "get");
      if (response.success) {
        setFarmerList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching farmers:", error);
    }
  };

  useEffect(() => {
    getFarmerList();
    fetchMilkEntries();
  }, []);

  const clearFilters = () => {
    setSelectedFarmer("all");
    setSelectedShift("all");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Milk className="h-6 w-6 text-primary" />
            {t("milkReports.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("milkReports.description")}
          </p>
        </div>
      </div>






      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t("milkReports.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row flex-nowrap items-end gap-4 overflow-x-auto pb-1">
            <div className="min-w-[160px] flex-1 space-y-2">
              <Label htmlFor="farmer">{t("milkCollection.farmerName")}</Label>
              <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
                <SelectTrigger id="farmer">
                  <SelectValue placeholder={t("milkCollection.selectFarmer")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("milkReports.allFarmers")}</SelectItem>
                  {farmerList.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id.toString()}>
                      {farmer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px] flex-1 space-y-2">
              <Label htmlFor="shift">{t("milkCollection.shift")}</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger id="shift">
                  <SelectValue placeholder={t("milkCollection.selectShift")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("milkReports.allShifts")}</SelectItem>
                  <SelectItem value="morning">{t("milkCollection.morning")}</SelectItem>
                  <SelectItem value="evening">{t("milkCollection.evening")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px] flex-1 space-y-2">
              <Label htmlFor="startDate">{t("milkReports.fromDate")}</Label>
              <DateInput
                id="startDate"
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            <div className="min-w-[150px] flex-1 space-y-2">
              <Label htmlFor="endDate">{t("milkReports.toDate")}</Label>
              <DateInput
                id="endDate"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <div className="shrink-0 space-y-2">
              <Label className="invisible select-none" aria-hidden="true">
                .
              </Label>
              <div className="flex gap-2">
                <Button onClick={fetchMilkEntries}>
                  <Filter className="h-4 w-4 mr-2" />
                  {t("common.filter")}
                </Button>
                <Button variant="outline" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t("milkReports.milkCollectionReport")}</CardTitle>
        </CardHeader>
        <CardContent>
          {milkLoading ? (
            <div className="text-center py-4">{t("common.loading")}</div>
          ) : milkEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {t("milkCollection.noEntries")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("milkCollection.farmerName")}</TableHead>
                  <TableHead>{t("milkCollection.date")}</TableHead>
                  <TableHead>{t("milkCollection.shift")}</TableHead>
                  <TableHead>{t("milkCollection.fat")}</TableHead>
                  <TableHead>{t("milkCollection.snf")}</TableHead>
                  <TableHead>{t("milkCollection.quantity")}</TableHead>
                  <TableHead>{t("milkCollection.rate")}</TableHead>
                  <TableHead>{t("milkCollection.totalAmount")} (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milkEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.farmer?.name || "N/A"}</TableCell>
                    <TableCell>
                      {formatDisplayDate(entry.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.shift === "morning" ? "default" : "secondary"
                        }
                      >
                        {t(`milkCollection.${entry.shift}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(parseFloat(entry.fat?.toString() || "0") || 0).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {(parseFloat(entry.snf?.toString() || "0") || 0).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {(parseFloat(entry.quantity?.toString() || "0") || 0).toFixed(1)} L
                    </TableCell>
                    <TableCell>
                      ₹{(parseFloat(entry.rate?.toString() || "0") || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ₹
                      {(parseFloat(entry.totalAmount?.toString() || "0") || 0).toFixed(
                        2,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DairyReports;
