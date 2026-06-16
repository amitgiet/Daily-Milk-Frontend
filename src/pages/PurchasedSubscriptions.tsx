import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import { formatDisplayDate } from "@/lib/dateFormat";

interface PurchasedItem {
  id: number;
  dairyId?: number;
  planId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  dairy?: { id: number; name: string; email?: string; phone?: string };
  plan?: {
    id: number;
    name?: string;
    price?: string | number;
    durationDays?: number;
  };
}

export default function PurchasedSubscriptions() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dairyId, setDairyId] = useState<string>("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    loadPurchased();
  }, []);

  const loadPurchased = async () => {
    setLoading(true);
    try {
      const params: string[] = [];
      if (dairyId.trim())
        params.push(`dairyId=${encodeURIComponent(dairyId.trim())}`);
      if (status && status !== "all")
        params.push(`status=${encodeURIComponent(status)}`);

      const url =
        params.length > 0
          ? `${allRoutes.subscriptions.history}?${params.join("&")}`
          : allRoutes.subscriptions.history;

      const res = await apiCall(url, "get");
      if (res.success && res.data) {
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load purchased subscriptions", err);
      toast.error("Failed to load purchased subscriptions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await loadPurchased();
  };

  const formatDate = (d?: string) => formatDisplayDate(d);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {t("navigation.purchasedSubscriptions") || "History"}
        </h1>
        <p className="text-muted-foreground">
          View all subscription history and details
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <Label>Dairy ID</Label>
              <Input
                value={dairyId}
                onChange={(e) => setDairyId(e.target.value)}
                placeholder="e.g. 2"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select onValueChange={(v) => setStatus(v || "all")} value={status}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("navigation.purchasedSubscriptions")}</CardTitle>
          <CardDescription>
            History of purchased and assigned subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dairy</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No purchased subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {it.dairy?.name || "-"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Email: {it.dairy?.email || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Phone: {it.dairy?.phone || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dairy ID: {it.dairy?.id || it.dairyId || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{it.plan?.name || "-"}</p>
                          <p className="text-sm text-muted-foreground">
                            Price: ₹{it.plan?.price || "-"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Duration: {it.plan?.durationDays || "-"} days
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Plan ID: {it.plan?.id || it.planId || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span>Start: {formatDate(it.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 text-destructive" />
                            <span>End: {formatDate(it.endDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            it.status === "pending"
                              ? "secondary"
                              : it.status === "active"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {it.status || "-"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
