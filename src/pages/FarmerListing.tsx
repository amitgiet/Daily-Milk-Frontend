import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Plus, Edit, Trash2, Eye, Filter, X, Users } from "lucide-react";
import { apiCall } from "../lib/apiCall";
import { formatDisplayDate } from "../lib/dateFormat";

interface Farmer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dairyId: number;
  isActive?: boolean;
  currentMonthMilkAmount?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

function buildFarmersUrl(
  page: number,
  limit: number,
  search: string,
  status: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  });

  if (status !== "all") {
    params.set("status", status);
  }

  return `/admin/get-farmers?${params.toString()}`;
}

const FarmerListing: React.FC = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");

  const {
    data: farmersData,
    loading: farmersLoading,
    execute: fetchFarmers,
  } = useQuery(
    () =>
      apiCall(
        buildFarmersUrl(currentPage, limit, appliedSearch, appliedStatus),
        "get",
      ),
    { autoExecute: true },
  );

  const farmers: Farmer[] = farmersData?.data?.data || [];
  const farmersTotal = farmersData?.data?.total || 0;

  useEffect(() => {
    fetchFarmers();
  }, [currentPage, appliedSearch, appliedStatus]);

  const applyFilters = () => {
    setAppliedSearch(searchInput.trim());
    setAppliedStatus(statusInput);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("all");
    setAppliedSearch("");
    setAppliedStatus("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(farmersTotal / limit);

  const formatDate = (dateString?: string) => formatDisplayDate(dateString);

  const formatMilkAmount = (amount?: string) => {
    if (!amount) return "0.00 L";
    const numAmount = parseFloat(amount);
    return `${numAmount.toFixed(2)} L`;
  };

  const getStatusBadge = (status?: string | boolean) => {
    const isActive =
      typeof status === "boolean" ? status : status === "active";
    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {t("dairyListing.active")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        {t("dairyListing.inactive")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("dairyListing.farmerManagement", "Farmer Listing")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all registered farmers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("dairyListing.addFarmer")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("dairyListing.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="farmerSearch">{t("dairyListing.searchFarmers")}</Label>
              <Input
                id="farmerSearch"
                placeholder={t("dairyListing.searchFarmers")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyFilters();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmerStatus">{t("dairyListing.selectStatus")}</Label>
              <Select value={statusInput} onValueChange={setStatusInput}>
                <SelectTrigger id="farmerStatus">
                  <SelectValue placeholder={t("dairyListing.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dairyListing.allStatuses")}</SelectItem>
                  <SelectItem value="active">{t("dairyListing.active")}</SelectItem>
                  <SelectItem value="inactive">{t("dairyListing.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                {t("common.filter")}
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t("dairyListing.farmerListing", "Farmers")}
          </CardTitle>
          <CardDescription>
            List of all farmers currently in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {farmersLoading ? (
            <div className="text-center py-8">{t("dairyListing.loadingFarmers")}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dairyListing.id")}</TableHead>
                    <TableHead>{t("dairyListing.name")}</TableHead>
                    <TableHead>{t("dairyListing.phone")}</TableHead>
                    <TableHead>{t("dairyListing.email")}</TableHead>
                    <TableHead>{t("dairyListing.dairyId")}</TableHead>
                    <TableHead>{t("dairyListing.status")}</TableHead>
                    <TableHead>{t("dairyListing.currentMonthMilk")}</TableHead>
                    <TableHead>{t("dairyListing.createdAt")}</TableHead>
                    <TableHead>{t("dairyListing.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        {t("dairyListing.noFarmersFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    farmers.map((farmer) => (
                      <TableRow key={farmer.id}>
                        <TableCell>{farmer.id}</TableCell>
                        <TableCell className="font-medium">{farmer.name}</TableCell>
                        <TableCell>{farmer.phone}</TableCell>
                        <TableCell>{farmer.email || "-"}</TableCell>
                        <TableCell>{farmer.dairyId}</TableCell>
                        <TableCell>{getStatusBadge(farmer.isActive)}</TableCell>
                        <TableCell className="font-medium">
                          {formatMilkAmount(farmer.currentMonthMilkAmount)}
                        </TableCell>
                        <TableCell>{formatDate(farmer.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("dairyListing.view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("dairyListing.edit")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("dairyListing.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t("dairyListing.showing")} {(currentPage - 1) * limit + 1}{" "}
                    {t("dairyListing.to")}{" "}
                    {Math.min(currentPage * limit, farmersTotal)}{" "}
                    {t("dairyListing.of")} {farmersTotal}{" "}
                    {t("dairyListing.farmers")}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {t("dairyListing.previous")}
                    </Button>
                    <span className="text-sm">
                      {t("dairyListing.page")} {currentPage} {t("dairyListing.of")}{" "}
                      {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {t("dairyListing.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerListing;
