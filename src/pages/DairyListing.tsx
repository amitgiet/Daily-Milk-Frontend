import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Search, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../lib/apiCall";
import { allRoutes } from "../lib/apiRoutes";
import { useQuery } from "../hooks/useApi";
import { formatDisplayDate } from "../lib/dateFormat";
import { toast } from "sonner";
import {
  type Dairy,
  type DairiesListResponse,
  formatDairyCellValue,
  formatDairyFullAddress,
} from "../types/dairy";

function createDairySchema(t: (key: string) => string) {
  return z.object({
    dairyCode: z.string().trim().min(1, t("dairyListing.dairyCodeRequired")),
    name: z.string().trim().min(2, t("dairyListing.nameRequired")),
    phone: z
      .string()
      .trim()
      .min(10, t("dairyListing.phoneInvalid"))
      .max(15, t("dairyListing.phoneInvalid")),
    password: z.string().min(6, t("dairyListing.passwordMin")),
    referralCode: z.string().trim().optional(),
    village: z.string().trim().optional(),
  });
}

interface DairyRegistrationPayload {
  dairyCode: string;
  name: string;
  referralCode: string;
  phone: string;
  password: string;
  village: string;
}

type DairyFormData = z.infer<ReturnType<typeof createDairySchema>>;

const DairyListing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dairySchema = createDairySchema(t);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DairyFormData>({
    resolver: zodResolver(dairySchema),
    defaultValues: {
      dairyCode: "",
      name: "",
      phone: "",
      password: "",
      referralCode: "",
      village: "",
    },
  });

  const {
    data: dairiesData,
    loading: dairiesLoading,
    execute: fetchDairies,
  } = useQuery(
    () => apiCall(allRoutes.dairies.list(currentPage, limit, searchTerm), "get"),
    { autoExecute: false },
  );

  const dairiesList = (dairiesData?.data as DairiesListResponse | undefined)?.data ?? [];
  const pagination = (dairiesData?.data as DairiesListResponse | undefined)?.pagination;
  const dairies: Dairy[] = dairiesList;
  const dairiesTotal = pagination?.total ?? dairiesData?.data?.total ?? dairies.length;
  const totalPages =
    pagination?.totalPages ?? Math.max(1, Math.ceil(dairiesTotal / limit));

  useEffect(() => {
    fetchDairies();
  }, [currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleOpenAddDialog = () => {
    reset({
      dairyCode: "",
      name: "",
      phone: "",
      password: "",
      referralCode: "",
      village: "",
    });
    setShowAddDialog(true);
  };

  const handleAddDairy = async (data: DairyFormData) => {
    setIsSubmitting(true);

    try {
      const payload: DairyRegistrationPayload = {
        dairyCode: data.dairyCode.trim(),
        name: data.name.trim(),
        referralCode: data.referralCode?.trim() ?? "",
        phone: data.phone.trim(),
        password: data.password,
        village: data.village?.trim() ?? "",
      };

      const response = await apiCall(allRoutes.dairies.add, "post", payload);

      if (response.success) {
        toast.success(t("dairyListing.dairyAdded"));
        setShowAddDialog(false);
        reset();
        setCurrentPage(1);
        await fetchDairies();
        return;
      }

      toast.error(
        response.message?.toString() || t("dairyListing.failedToAddDairy"),
      );
    } catch (error) {
      console.error("Failed to add dairy:", error);
      toast.error(t("dairyListing.failedToAddDairy"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPagesDisplay = totalPages;
  const formatDate = (dateString?: string) => formatDisplayDate(dateString);

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {t("dairyListing.active")}
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="border-slate-200 bg-slate-100 text-slate-600 dark:border-border dark:bg-muted/60 dark:text-muted-foreground"
      >
        {t("dairyListing.inactive")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t("dairyListing.title")}</h1>
          <p className="text-muted-foreground">
            Manage and view all registered dairies
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("dairyListing.addDairy")}
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dairyListing.addNewDairy")}</DialogTitle>
            <DialogDescription>
              {t("dairyListing.addDairyDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleAddDairy)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dairyCode">{t("dairyListing.dairyCode")} *</Label>
                <Input
                  id="dairyCode"
                  {...register("dairyCode")}
                  placeholder={t("dairyListing.dairyCodePlaceholder")}
                />
                {errors.dairyCode && (
                  <p className="text-sm text-destructive">
                    {errors.dairyCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("dairyListing.name")} *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={t("dairyListing.dairyNamePlaceholder")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("dairyListing.phone")} *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder={t("dairyListing.phonePlaceholder")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("dairyListing.password")} *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder={t("dairyListing.passwordPlaceholder")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">
                  {t("dairyListing.referralCode")} ({t("dairyListing.optional")})
                </Label>
                <Input
                  id="referralCode"
                  {...register("referralCode")}
                  placeholder={t("dairyListing.referralCodePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="village">{t("dairyListing.village")}</Label>
                <Input
                  id="village"
                  {...register("village")}
                  placeholder={t("dairyListing.villagePlaceholder")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
              >
                {t("dairyListing.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("dairyListing.saving") : t("dairyListing.addDairy")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("dairyListing.searchDairies")}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dairyListing.dairyListing", "Dairy Listing")}</CardTitle>
          <CardDescription>
            List of all dairies currently in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dairiesLoading ? (
            <div className="text-center py-8">{t("dairyListing.loadingDairies")}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dairyListing.id")}</TableHead>
                      <TableHead>{t("dairyListing.dairyCode")}</TableHead>
                      <TableHead>{t("dairyListing.name")}</TableHead>
                      <TableHead>{t("dairyListing.phone")}</TableHead>
                      <TableHead>{t("dairyListing.email")}</TableHead>
                      <TableHead>{t("dairyListing.referralCode")}</TableHead>
                      <TableHead>{t("dairyListing.address")}</TableHead>
                      <TableHead>{t("dairyListing.status")}</TableHead>
                      <TableHead>{t("dairyListing.createdAt")}</TableHead>
                      <TableHead>{t("dairyListing.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dairies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          {t("dairyListing.noDairiesFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      dairies.map((dairy) => (
                        <TableRow key={dairy.id}>
                          <TableCell>{dairy.id}</TableCell>
                          <TableCell>{formatDairyCellValue(dairy.dairyCode)}</TableCell>
                          <TableCell className="font-medium">{dairy.name}</TableCell>
                          <TableCell>{dairy.phone}</TableCell>
                          <TableCell>{formatDairyCellValue(dairy.email)}</TableCell>
                          <TableCell>{formatDairyCellValue(dairy.referralCode)}</TableCell>
                          <TableCell className="max-w-[260px] truncate" title={formatDairyFullAddress(dairy)}>
                            {formatDairyFullAddress(dairy)}
                          </TableCell>
                          <TableCell>{getStatusBadge(dairy.isActive)}</TableCell>
                          <TableCell>{formatDate(dairy.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("dairyListing.view")}
                              onClick={() =>
                                navigate(`/dairy-listing/${dairy.id}`, { state: { dairy } })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPagesDisplay > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t("dairyListing.showing")}{" "}
                    {(currentPage - 1) * limit + 1} {t("dairyListing.to")}{" "}
                    {Math.min(currentPage * limit, dairiesTotal)}{" "}
                    {t("dairyListing.of")} {dairiesTotal}{" "}
                    {t("dairyListing.dairies")}
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
                      {t("dairyListing.page")} {currentPage}{" "}
                      {t("dairyListing.of")} {totalPagesDisplay}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPagesDisplay}
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

export default DairyListing;
