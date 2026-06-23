import React from "react";
import { useTranslation } from "react-i18next";
import { formatDisplayDate } from "@/lib/dateFormat";

function formatCurrency(value) {
  const amount = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(amount)) return "₹0.00";
  return `₹${amount.toFixed(2)}`;
}

function formatShiftLabel(shift, t) {
  if (shift === "morning") return t("milkCollection.morning");
  if (shift === "evening") return t("milkCollection.evening");
  return shift;
}

const Receipt = ({ receipt }) => {
  const { t } = useTranslation();

  if (!receipt) return null;

  const displayDate = formatDisplayDate(receipt.date, receipt.date);

  return (
    <div className="w-[58mm] max-w-[58mm] bg-white p-2 shadow-lg mx-auto border rounded-sm font-mono text-[10px] leading-snug">
      <div className="text-center border-b border-dashed pb-2 mb-2">
        <h2 className="text-xs font-semibold leading-tight break-words">{receipt.dairyName}</h2>
        <p className="text-[9px] text-gray-600">Code: {receipt.code}</p>
        <p className="text-[9px]">
          {displayDate} {receipt.time}
        </p>
        <p className="text-[9px]">
          {t("milkCollection.shift")}: {formatShiftLabel(receipt.shift, t)}
        </p>
      </div>

      <div className="space-y-1 mb-2 text-[10px]">
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.farmerName")}</span>
          <span className="text-right break-words">{receipt.farmerName}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.fat")}</span>
          <span>{receipt.fat}%</span>
        </div>
        <div className="flex justify-between gap-1">
          <span>{t("dairyRates.fatRate")}</span>
          <span>{formatCurrency(receipt.fatRate)}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.snf")}</span>
          <span>{receipt.snf}%</span>
        </div>
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.rate")}</span>
          <span>{formatCurrency(receipt.rate)}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.quantity")}</span>
          <span>{receipt.qty} L</span>
        </div>
      </div>

      <div className="border-t border-b border-dashed py-1.5 my-1.5 text-[10px] space-y-1">
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.total")}</span>
          <span>{formatCurrency(receipt.total)}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span>{t("milkCollection.subsidyDeductionAmount")}</span>
          <span>{formatCurrency(receipt.pf)}</span>
        </div>
        <div className="flex justify-between gap-1 font-semibold">
          <span>{t("milkCollection.netAmount")}</span>
          <span>{formatCurrency(receipt.netAmount)}</span>
        </div>
      </div>

      <p className="text-center text-[8px] text-gray-500 mt-1.5">Powered By DairyBook</p>
      <p className="text-center text-[10px] my-1 font-semibold">THANK YOU</p>
    </div>
  );
};

export default Receipt;
