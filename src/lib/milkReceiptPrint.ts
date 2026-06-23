import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { formatDisplayDate } from "@/lib/dateFormat";

export interface MilkPrintReceiptData {
  dairyName: string;
  code: string;
  farmerName: string;
  date: string;
  time: string;
  shift: string;
  fat: string;
  fatRate: string;
  snf: string;
  rate: string;
  qty: string;
  total: string;
  pf: string;
  netAmount: string;
}

function parseReceiptPayload(responseData: unknown): MilkPrintReceiptData | null {
  if (!responseData || typeof responseData !== "object") return null;

  const record = responseData as Record<string, unknown>;
  const data = (record.data ?? responseData) as Record<string, unknown>;

  if (!data.farmerName && !data.dairyName) return null;

  return {
    dairyName: String(data.dairyName ?? ""),
    code: String(data.code ?? ""),
    farmerName: String(data.farmerName ?? ""),
    date: String(data.date ?? ""),
    time: String(data.time ?? ""),
    shift: String(data.shift ?? ""),
    fat: String(data.fat ?? "0"),
    fatRate: String(data.fatRate ?? "0"),
    snf: String(data.snf ?? "0"),
    rate: String(data.rate ?? "0"),
    qty: String(data.qty ?? "0"),
    total: String(data.total ?? "0"),
    pf: String(data.pf ?? "0"),
    netAmount: String(data.netAmount ?? "0"),
  };
}

export async function fetchMilkPrintReceipt(
  entryId: number,
): Promise<MilkPrintReceiptData | null> {
  const response = await apiCall(allRoutes.milkCollection.printReceipt(entryId), "get");

  if (!response.success) return null;

  return parseReceiptPayload(response.data);
}

function formatShiftLabel(shift: string) {
  if (shift === "morning") return "Morning";
  if (shift === "evening") return "Evening";
  return shift;
}

function formatCurrency(value: string | number) {
  const amount = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(amount)) return "₹0.00";
  return `₹${amount.toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const THERMAL_PRINT_STYLES = `
  @page {
    size: 58mm auto;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    width: 58mm;
    margin: 0;
    padding: 0;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 10px;
    line-height: 1.35;
  }

  .receipt {
    width: 58mm;
    max-width: 58mm;
    padding: 2mm 2.5mm 3mm;
  }

  .header {
    text-align: center;
    border-bottom: 1px dashed #000;
    padding-bottom: 2mm;
    margin-bottom: 2mm;
  }

  .header h2 {
    margin: 0 0 1mm;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
  }

  .header p {
    margin: 0.5mm 0;
    font-size: 9px;
  }

  .section,
  .totals {
    font-size: 10px;
  }

  .section {
    margin: 2mm 0;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 2mm;
    margin: 1mm 0;
  }

  .row span:first-child {
    flex: 0 0 auto;
  }

  .row span:last-child {
    flex: 1 1 auto;
    text-align: right;
    word-break: break-word;
  }

  .totals {
    border-top: 1px dashed #000;
    border-bottom: 1px dashed #000;
    padding: 2mm 0;
    margin: 2mm 0;
  }

  .footer {
    text-align: center;
    margin-top: 2mm;
    font-size: 9px;
  }

  .footer p {
    margin: 1mm 0;
  }

  .footer .powered-by {
    font-size: 8px;
  }

  @media print {
    html, body {
      width: 58mm;
    }

    .receipt {
      page-break-after: avoid;
      page-break-inside: avoid;
    }
  }
`;

export function printMilkReceiptDocument(receipt: MilkPrintReceiptData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const displayDate = formatDisplayDate(receipt.date, receipt.date);
  const safe = {
    dairyName: escapeHtml(receipt.dairyName),
    code: escapeHtml(receipt.code),
    farmerName: escapeHtml(receipt.farmerName),
    time: escapeHtml(receipt.time),
    shift: escapeHtml(formatShiftLabel(receipt.shift)),
    fat: escapeHtml(receipt.fat),
    snf: escapeHtml(receipt.snf),
    qty: escapeHtml(receipt.qty),
    displayDate: escapeHtml(displayDate),
  };

  printWindow.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Milk Collection Receipt</title>
        <style>${THERMAL_PRINT_STYLES}</style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>${safe.dairyName}</h2>
            <p>Code: ${safe.code}</p>
            <p>${safe.displayDate} ${safe.time}</p>
            <p>Shift: ${safe.shift}</p>
          </div>
          <div class="section">
            <div class="row"><span>Farmer</span><span>${safe.farmerName}</span></div>
            <div class="row"><span>Fat</span><span>${safe.fat}%</span></div>
            <div class="row"><span>Fat Rate</span><span>${formatCurrency(receipt.fatRate)}</span></div>
            <div class="row"><span>SNF</span><span>${safe.snf}%</span></div>
            <div class="row"><span>Rate</span><span>${formatCurrency(receipt.rate)}</span></div>
            <div class="row"><span>Qty</span><span>${safe.qty} L</span></div>
          </div>
          <div class="totals">
            <div class="row"><span>Total</span><span>${formatCurrency(receipt.total)}</span></div>
            <div class="row"><span>PF</span><span>${formatCurrency(receipt.pf)}</span></div>
            <div class="row"><strong>Net Amt</strong><strong>${formatCurrency(receipt.netAmount)}</strong></div>
          </div>
          <div class="footer">
            <p class="powered-by">Powered By DairyBook</p>
            <p><strong>THANK YOU</strong></p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function buildLocalMilkPrintReceipt(entry: {
  farmerName: string;
  date: string;
  shift: string;
  fat: string | number;
  snf: string | number;
  fatRate: string | number;
  snfRate: string | number;
  rate: string | number;
  quantity: string | number;
  amount?: string | number;
  totalAmount: string | number;
  subsidyDeduction: string | number;
  subsidyAmount?: string | number;
  dairyName?: string;
  dairyCode?: string;
}): MilkPrintReceiptData {
  const pf = parseFloat(entry.subsidyAmount?.toString() || "0") || 0;
  const gross =
    entry.amount != null
      ? parseFloat(entry.amount.toString()) || 0
      : (parseFloat(entry.totalAmount?.toString() || "0") || 0) + pf;
  const netAmount = parseFloat(entry.totalAmount?.toString() || "0") || 0;

  return {
    dairyName: entry.dairyName || "Dairy Book",
    code: entry.dairyCode || "-",
    farmerName: entry.farmerName,
    date: entry.date,
    time: new Date().toLocaleTimeString(),
    shift: entry.shift,
    fat: parseFloat(entry.fat?.toString() || "0").toFixed(2),
    fatRate: parseFloat(entry.fatRate?.toString() || "0").toFixed(2),
    snf: parseFloat(entry.snf?.toString() || "0").toFixed(2),
    rate: parseFloat(entry.rate?.toString() || "0").toFixed(2),
    qty: parseFloat(entry.quantity?.toString() || "0").toFixed(2),
    total: gross.toFixed(2),
    pf: pf.toFixed(2),
    netAmount: netAmount.toFixed(2),
  };
}
