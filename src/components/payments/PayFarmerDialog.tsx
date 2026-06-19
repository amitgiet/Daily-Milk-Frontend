import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { formatDisplayDate } from "@/lib/dateFormat";
import {
  fetchUnpaidMilkEntries,
  getMilkEntryAmount,
  type UnpaidMilkEntry,
} from "@/lib/milkPayment";
import { toast } from "sonner";

const PAYMENT_METHODS = ["cash", "upi", "bank"] as const;

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  paidAt: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  note: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export interface PayFarmerInfo {
  id: number;
  name: string;
  phone?: string;
  pendingPayment?: string | number;
}

interface PayFarmerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer: PayFarmerInfo | null;
  onPaymentSuccess?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PayFarmerDialog({
  open,
  onOpenChange,
  farmer,
  onPaymentSuccess,
}: PayFarmerDialogProps) {
  const { t } = useTranslation();
  const [unpaidEntries, setUnpaidEntries] = useState<UnpaidMilkEntry[]>([]);
  const [unpaidLoading, setUnpaidLoading] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paidAt: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      note: "",
    },
  });

  const selectedEntriesTotal = useMemo(
    () =>
      unpaidEntries
        .filter((entry) => selectedEntryIds.includes(entry.id))
        .reduce((sum, entry) => sum + getMilkEntryAmount(entry), 0),
    [unpaidEntries, selectedEntryIds],
  );

  const allUnpaidSelected =
    unpaidEntries.length > 0 &&
    unpaidEntries.every((entry) => selectedEntryIds.includes(entry.id));

  useEffect(() => {
    if (!open || !farmer) return;

    let isActive = true;

    async function loadUnpaidMilk() {
      setUnpaidLoading(true);
      try {
        const entries = await fetchUnpaidMilkEntries(farmer.id);
        if (!isActive) return;

        setUnpaidEntries(entries);
        const entryIds = entries.map((entry) => entry.id);
        setSelectedEntryIds(entryIds);

        const totalFromEntries = entries.reduce(
          (sum, entry) => sum + getMilkEntryAmount(entry),
          0,
        );
        const pendingAmount = Number(farmer.pendingPayment) || 0;
        const initialAmount =
          totalFromEntries > 0 ? totalFromEntries : pendingAmount;

        reset({
          amount: Math.round(initialAmount * 100) / 100,
          paidAt: new Date().toISOString().split("T")[0],
          paymentMethod: "cash",
          note: "",
        });
      } catch (error) {
        console.error("Failed to load unpaid milk entries:", error);
        if (isActive) {
          setUnpaidEntries([]);
          setSelectedEntryIds([]);
          reset({
            amount: Number(farmer.pendingPayment) || 0,
            paidAt: new Date().toISOString().split("T")[0],
            paymentMethod: "cash",
            note: "",
          });
        }
      } finally {
        if (isActive) setUnpaidLoading(false);
      }
    }

    loadUnpaidMilk();

    return () => {
      isActive = false;
    };
  }, [open, farmer, reset]);

  useEffect(() => {
    if (!open || unpaidEntries.length === 0 || selectedEntryIds.length === 0) return;

    setValue("amount", Math.round(selectedEntriesTotal * 100) / 100, {
      shouldValidate: true,
    });
  }, [
    open,
    selectedEntriesTotal,
    selectedEntryIds.length,
    unpaidEntries.length,
    setValue,
  ]);

  const toggleEntrySelection = (entryId: number, checked: boolean) => {
    setSelectedEntryIds((current) =>
      checked
        ? [...current, entryId]
        : current.filter((id) => id !== entryId),
    );
  };

  const toggleAllEntries = (checked: boolean) => {
    setSelectedEntryIds(
      checked ? unpaidEntries.map((entry) => entry.id) : [],
    );
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setUnpaidEntries([]);
      setSelectedEntryIds([]);
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmitPayment = async (data: PaymentFormData) => {
    if (!farmer) return;

    setSubmitting(true);
    try {
      const paymentResponse = await apiCall(
        allRoutes.dairy.addFarmerPayments,
        "post",
        {
          farmerId: farmer.id,
          amount: data.amount,
          paidAt: data.paidAt,
          paymentMethod: data.paymentMethod,
          note: data.note || "",
          ids: selectedEntryIds,
        },
      );

      if (!paymentResponse.success) {
        toast.error(t("payments.paymentAddError"));
        return;
      }

      toast.success(t("payments.paymentAdded"));
      handleClose(false);
      onPaymentSuccess?.();
    } catch (error) {
      console.error("Failed to add payment:", error);
      toast.error(t("payments.paymentAddError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!farmer) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("payments.payFarmer")}
            </DialogTitle>
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{farmer.name}</p>
              {farmer.phone ? (
                <p className="mt-1 text-xs text-muted-foreground">{farmer.phone}</p>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSubmitPayment)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{t("payments.unpaidMilkList")}</Label>
              {selectedEntryIds.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {t("payments.selectedCount", { count: selectedEntryIds.length })}
                </span>
              ) : null}
            </div>

            <div className="rounded-md border max-h-52 overflow-y-auto">
              {unpaidLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("payments.loadingUnpaidMilk")}
                </div>
              ) : unpaidEntries.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("payments.noUnpaidMilk")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allUnpaidSelected}
                          onCheckedChange={(checked) =>
                            toggleAllEntries(checked === true)
                          }
                          aria-label={t("payments.selectAllUnpaid")}
                        />
                      </TableHead>
                      <TableHead>{t("milkCollection.date")}</TableHead>
                      <TableHead>{t("milkCollection.shift")}</TableHead>
                      <TableHead>{t("milkCollection.quantity")}</TableHead>
                      <TableHead>{t("milkCollection.rate")}</TableHead>
                      <TableHead className="text-right">
                        {t("milkCollection.totalAmount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntryIds.includes(entry.id)}
                            onCheckedChange={(checked) =>
                              toggleEntrySelection(entry.id, checked === true)
                            }
                            aria-label={t("payments.selectEntry")}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDisplayDate(entry.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.shift === "morning" ? "default" : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {t(`milkCollection.${entry.shift}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entry.quantity} L
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entry.rate}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getMilkEntryAmount(entry))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-farmer-amount">{t("payments.amount")} *</Label>
              <Input
                id="pay-farmer-amount"
                type="text"
                
                {...register("amount", { valueAsNumber: true })}
                placeholder={t("payments.amountPlaceholder")}
                readOnly
                className="bg-muted"
              />
              {errors.amount ? (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-farmer-paid-at">{t("payments.paidAt")} *</Label>
              <DateInput
                id="pay-farmer-paid-at"
                value={watch("paidAt")}
                onChange={(value) =>
                  setValue("paidAt", value, { shouldValidate: true })
                }
              />
              {errors.paidAt ? (
                <p className="text-sm text-destructive">{errors.paidAt.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-farmer-method">{t("payments.paymentMethod")} *</Label>
              <Select
                value={watch("paymentMethod")}
                onValueChange={(value) =>
                  setValue(
                    "paymentMethod",
                    value as PaymentFormData["paymentMethod"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="pay-farmer-method">
                  <SelectValue placeholder={t("payments.selectPaymentMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`payments.paymentMethods.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod ? (
                <p className="text-sm text-destructive">
                  {errors.paymentMethod.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-farmer-note">{t("payments.note")}</Label>
              <Input
                id="pay-farmer-note"
                {...register("note")}
                placeholder={t("payments.notePlaceholder")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              {t("payments.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("payments.saving") : t("payments.addPayment")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
