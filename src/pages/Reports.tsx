import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, TrendingUp, Calendar, FileText, FileSpreadsheet } from "lucide-react";

export default function Reports() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    reportType: "",
    format: "",
    dateRange: ""
  });

  const handleGenerateReport = (reportType: string) => {
    setExportSettings(prev => ({ ...prev, reportType }));
    setShowExportDialog(true);
  };

  const handleExport = () => {
    if (!exportSettings.reportType || !exportSettings.format) {
      alert("Please select both report type and format");
      return;
    }

    // Simulate export process
    const fileName = `${exportSettings.reportType}-report-${new Date().toISOString().split('T')[0]}`;
    const fileExtension = exportSettings.format === "pdf" ? "pdf" : "csv";
    
    // Create a simple CSV content for demonstration
    let content = "";
    if (exportSettings.format === "pdf") {
      // For PDF, we'll just show a message
      alert(`PDF report "${fileName}.${fileExtension}" would be generated and downloaded.`);
    } else {
      // Generate CSV content based on report type
      switch (exportSettings.reportType) {
        case "stock":
          content = "Product ID,Product Name,Category,Quantity,Status\n";
          content += "PRD-001,Fresh Milk,Milk,500L,In Stock\n";
          content += "PRD-002,Paneer,Dairy,25kg,Low Stock\n";
          content += "PRD-003,Yogurt,Dairy,100L,In Stock\n";
          break;
        case "sales":
          content = "Order ID,Customer,Date,Amount,Status\n";
          content += "ORD-001,Raj Dairy Store,2024-07-25,₹2500,Delivered\n";
          content += "ORD-002,Fresh Mart,2024-07-24,₹1400,Delivered\n";
          content += "ORD-003,City Grocers,2024-07-24,₹3000,Processing\n";
          break;
        case "collection":
          content = "Date,Supplier,Collection Amount,Quality Grade\n";
          content += "2024-07-25,Green Valley Farm,950L,A\n";
          content += "2024-07-25,Sunrise Dairy,580L,A+\n";
          content += "2024-07-24,Green Valley Farm,920L,A\n";
          break;
        default:
          content = "Report data not available\n";
      }

      // Create and download CSV file
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.${fileExtension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setShowExportDialog(false);
    setExportSettings({ reportType: "", format: "", dateRange: "" });
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">View detailed reports and export data</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Stock Report
            </CardTitle>
            <CardDescription>Current inventory levels and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View detailed stock levels, low stock alerts, and product performance.
            </p>
            <Button variant="outline" className="w-full" onClick={() => handleGenerateReport("stock")}>
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Report
            </CardTitle>
            <CardDescription>Revenue and sales analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track sales performance, revenue trends, and customer orders.
            </p>
            <Button variant="outline" className="w-full" onClick={() => handleGenerateReport("sales")}>
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Daily Collection
            </CardTitle>
            <CardDescription>Milk collection and distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor daily milk intake, supplier deliveries, and distribution.
            </p>
            <Button variant="outline" className="w-full" onClick={() => handleGenerateReport("collection")}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Key performance indicators at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">₹45,280</p>
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-success">1,850L</p>
              <p className="text-sm text-muted-foreground">Milk Collected</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-info">43</p>
              <p className="text-sm text-muted-foreground">Orders Processed</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-warning">98%</p>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select 
                  value={exportSettings.reportType} 
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Stock Report
                      </div>
                    </SelectItem>
                    <SelectItem value="sales">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Sales Report
                      </div>
                    </SelectItem>
                    <SelectItem value="collection">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Daily Collection
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select 
                  value={exportSettings.format} 
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV File
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF Document
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select 
                  value={exportSettings.dateRange} 
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Preview */}
            {exportSettings.reportType && exportSettings.format && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Export Preview:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Report: {exportSettings.reportType === "stock" ? "Stock Report" : 
                           exportSettings.reportType === "sales" ? "Sales Report" : "Daily Collection"}</p>
                  <p>Format: {exportSettings.format.toUpperCase()}</p>
                  <p>Range: {exportSettings.dateRange || "Not selected"}</p>
                  <p>Filename: {exportSettings.reportType}-report-{new Date().toISOString().split('T')[0]}.{exportSettings.format === "pdf" ? "pdf" : "csv"}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={!exportSettings.reportType || !exportSettings.format}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}