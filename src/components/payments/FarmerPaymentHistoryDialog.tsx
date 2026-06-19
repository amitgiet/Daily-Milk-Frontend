import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/dateFormat";
import {
  fetchFarmerPaymentHistory,
  formatPaymentField,
  type FarmerPaymentHistoryEntry,
  type FarmerPaymentHistoryPeriod,
} from "@/lib/farmerPaymentHistory";

export interface FarmerPaymentHistoryInfo {
  id: number;
  name: string;
  phone?: string;
}

interface FarmerPaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer: FarmerPaymentHistoryInfo | null;
}

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function FarmerPaymentHistoryDialog({
  open,
  onOpenChange,
  farmer,
}: FarmerPaymentHistoryDialogProps) {
  const { t } = useTranslation();
  const [periodType, setPeriodType] = useState<FarmerPaymentHistoryPeriod>("month");
  const [payments, setPayments] = useState<FarmerPaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !farmer) return;

    let isActive = true;

    async function loadPaymentHistory() {
      setLoading(true);
      try {
        const entries = await fetchFarmerPaymentHistory(farmer.id, periodType);
        if (isActive) setPayments(entries);
      } catch (error) {
        console.error("Failed to load farmer payment history:", error);
        if (isActive) setPayments([]);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadPaymentHistory();

    return () => {
      isActive = false;
    };
  }, [open, farmer, periodType]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPeriodType("month");
      setPayments([]);
    }
    onOpenChange(nextOpen);
  };

  if (!farmer) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("customers.paymentHistory")}
            </DialogTitle>
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{farmer.name}</p>
              {farmer.phone ? (
                <p className="mt-1 text-xs text-muted-foreground">{farmer.phone}</p>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant={periodType === "today" ? "default" : "outline"}
            className="h-7 px-3 text-xs"
            onClick={() => setPeriodType("today")}
          >
            {t("dashboard.today")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={periodType === "month" ? "default" : "outline"}
            className="h-7 px-3 text-xs"
            onClick={() => setPeriodType("month")}
          >
            {t("dashboard.thisMonth")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={periodType === "12month" ? "default" : "outline"}
            className="h-7 px-3 text-xs"
            onClick={() => setPeriodType("12month")}
          >
            {t("dashboard.year")}
          </Button>
        </div>

        <div className="rounded-md border">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("payments.loading")}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("customers.noPaymentHistory")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payments.paymentDate")}</TableHead>
                  <TableHead>{t("payments.amount")}</TableHead>
                  <TableHead>{t("payments.type")}</TableHead>
                  <TableHead>{t("payments.paymentMethod")}</TableHead>
                  <TableHead>{t("payments.paymentType")}</TableHead>
                  <TableHead className="text-right">{t("payments.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDisplayDate(payment.paidAt)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatPaymentField(payment.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`payments.paymentMethods.${payment.paymentMethod}`, {
                          defaultValue: formatPaymentField(payment.paymentMethod),
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {formatPaymentField(payment.paymentType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.note || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
