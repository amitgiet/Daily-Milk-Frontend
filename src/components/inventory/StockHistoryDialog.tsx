import { StockHistory } from "@/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, RotateCcw } from "lucide-react";

interface StockHistoryDialogProps {
  productName: string;
  history: StockHistory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockHistoryDialog({
  productName,
  history,
  open,
  onOpenChange
}: StockHistoryDialogProps) {
  const getTypeIcon = (type: StockHistory["type"]) => {
    switch (type) {
      case "inflow":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "outflow":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-warning" />;
    }
  };

  const getTypeBadge = (type: StockHistory["type"]) => {
    switch (type) {
      case "inflow":
        return <Badge className="bg-success text-success-foreground">Inflow</Badge>;
      case "outflow":
        return <Badge variant="destructive">Outflow</Badge>;
      case "adjustment":
        return <Badge className="bg-warning text-warning-foreground">Adjustment</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock History - {productName}</DialogTitle>
          <DialogDescription>
            Complete history of stock movements for this product
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No stock history available
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        {getTypeBadge(entry.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={entry.type === "outflow" ? "text-destructive" : "text-success"}>
                        {entry.type === "outflow" ? "-" : "+"}
                        {entry.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{entry.previousQuantity}</TableCell>
                    <TableCell className="font-medium">{entry.newQuantity}</TableCell>
                    <TableCell>{entry.reason}</TableCell>
                    <TableCell>{entry.userName || "System"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}