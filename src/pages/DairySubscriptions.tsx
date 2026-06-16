import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { toast } from "react-toastify";
import { SubscriptionPlan } from "@/types/subscription";

interface Dairy {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export default function DairySubscriptions() {
  const { t } = useTranslation();
  const [dairies, setDairies] = useState<Dairy[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedDairy, setSelectedDairy] = useState<Dairy | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDairies();
    loadPlans();
  }, []);

  const loadDairies = async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/admin/get-dairies?page=1&limit=1000`, "get");
      if (res.success && res.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setDairies(list);
      } else {
        setDairies([]);
      }
    } catch (err) {
      console.error("Failed to load dairies", err);
      toast.error("Failed to load dairies");
      setDairies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await apiCall(allRoutes.subscriptions.list, "get");
      if (res.success && res.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setPlans(list.filter((p: SubscriptionPlan) => p.isActive));
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error("Failed to load plans", err);
      toast.error("Failed to load subscription plans");
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const openFor = (dairy: Dairy) => {
    setSelectedDairy(dairy);
    setSelectedPlanId(null);
  };

  const submitAssign = async () => {
    if (!selectedDairy || !selectedPlanId) {
      toast.error("Select a plan first");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { planId: selectedPlanId, dairyId: selectedDairy.id };
      const res = await apiCall(
        allRoutes.subscriptions.request,
        "post",
        payload,
      );
      if (res.success) {
        toast.success("Subscription request submitted");
      } else {
        toast.error("Failed to submit subscription request");
      }
    } catch (err) {
      console.error("Assign plan failed", err);
      toast.error("Assign plan failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {t("dairySubscriptions.title") || "Dairy Subscription Management"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dairySubscriptions.list") || "Dairies"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading dairies...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dairies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No dairies found
                    </TableCell>
                  </TableRow>
                ) : (
                  dairies.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.email || "-"}</TableCell>
                      <TableCell>{d.phone || "-"}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => openFor(d)}>
                              Manage Subscription
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Assign Subscription for {d.name}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div>
                                <Label>Plan</Label>
                                <Select
                                  onValueChange={(val) =>
                                    setSelectedPlanId(Number(val))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue
                                      placeholder={
                                        loadingPlans
                                          ? "Loading plans..."
                                          : "Select plan"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {plans.map((p) => (
                                      <SelectItem
                                        key={p.id}
                                        value={p.id.toString()}
                                      >
                                        {p.name} — ₹
                                        {typeof p.price === "string"
                                          ? p.price
                                          : p.price}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDairy(null);
                                    setSelectedPlanId(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={submitAssign}
                                  disabled={submitting}
                                >
                                  {submitting ? "Submitting..." : "Submit"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
