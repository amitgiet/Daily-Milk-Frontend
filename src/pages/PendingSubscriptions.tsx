import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { toast } from "react-toastify";
import { formatDisplayDate } from "@/lib/dateFormat";

export default function PendingSubscriptions() {
  const { t } = useTranslation();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await apiCall(
        allRoutes.subscriptions.pendingRequests,
        "get"
      );
      if (response.success && response.data) {
        setPendingRequests(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error("Error loading pending requests:", error);
      toast.error(t("subscriptionPlans.loadRequestsError"));
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateRequestStatus = async (
    requestId: number,
    status: "active" | "cancelled"
  ) => {
    try {
      const response = await apiCall(
        allRoutes.subscriptions.updateRequestStatus(requestId),
        "put",
        { status }
      );
      if (response.success) {
        toast.success(
          status === "active"
            ? t("subscriptionPlans.requestApproved")
            : t("subscriptionPlans.requestRejected")
        );
        loadPendingRequests();
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error(t("subscriptionPlans.updateRequestError"));
    }
  };

  const formatDate = (dateString: string) => formatDisplayDate(dateString);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t("navigation.pendingSubscriptions", "Pending Subscriptions")}</h1>
        <p className="text-muted-foreground">
          {t("subscriptionPlans.reviewRequests")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionPlans.pendingRequests")}</CardTitle>
          <CardDescription>
            {t("subscriptionPlans.reviewRequests")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-center py-8">
              {t("subscriptionPlans.loadingRequests")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscriptionPlans.dairy")}</TableHead>
                  <TableHead>{t("subscriptionPlans.plan")}</TableHead>
                  <TableHead>
                    {t("subscriptionPlans.requestDate")}
                  </TableHead>
                  <TableHead>{t("subscriptionPlans.status")}</TableHead>
                  <TableHead>{t("subscriptionPlans.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {t("subscriptionPlans.noPendingRequests")}
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.dairy.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Email: {request.dairy.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Phone: {request.dairy.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dairy ID: {request.dairy.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Price: ₹{request.plan.price}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Duration: {request.plan.durationDays} days
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Plan ID: {request.plan.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(request.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateRequestStatus(
                                  request.id,
                                  "active"
                                )
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("subscriptionPlans.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleUpdateRequestStatus(
                                  request.id,
                                  "cancelled"
                                )
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t("subscriptionPlans.reject")}
                            </Button>
                          </div>
                        )}
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
