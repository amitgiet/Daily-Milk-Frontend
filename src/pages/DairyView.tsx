import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { formatDisplayDate } from "@/lib/dateFormat";
import {
  type Dairy,
  formatDairyCellValue,
  formatDairyFullAddress,
} from "@/types/dairy";

interface DairyViewLocationState {
  dairy?: Dairy;
}

function DetailField({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={emphasize ? "text-lg font-semibold" : "text-base"}>{value}</p>
    </div>
  );
}

export default function DairyView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const locationState = location.state as DairyViewLocationState | null;

  const [dairy, setDairy] = useState<Dairy | null>(locationState?.dairy ?? null);
  const [isLoading, setIsLoading] = useState(!locationState?.dairy);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadDairy() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiCall(allRoutes.dairies.get(id!), "get");

        if (response.success && response.data) {
          const payload = response.data as { data?: Dairy } | Dairy;
          const record = "data" in payload && payload.data ? payload.data : payload;
          setDairy(record as Dairy);
          return;
        }

        if (!locationState?.dairy) {
          setError(t("dairyListing.dairyNotFound"));
        }
      } catch (loadError) {
        console.error("Failed to load dairy:", loadError);
        if (!locationState?.dairy) {
          setError(t("dairyListing.failedToLoadDairy"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadDairy();
  }, [id, locationState?.dairy, t]);

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-16 text-muted-foreground">
          {t("dairyListing.loadingDairyDetails")}
        </div>
      </div>
    );
  }

  if (error || !dairy) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate("/dairy-listing")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("dairyListing.backToDairies")}
        </Button>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {error ?? t("dairyListing.dairyNotFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" className="px-0" asChild>
            <Link to="/dairy-listing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("dairyListing.backToDairies")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            {dairy.name}
          </h1>
          <p className="text-muted-foreground">{t("dairyListing.dairyDetails")}</p>
        </div>
        {getStatusBadge(dairy.isActive)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dairyListing.dairyInformation")}</CardTitle>
          <CardDescription>{t("dairyListing.dairyInformationDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailField label={t("dairyListing.id")} value={String(dairy.id)} />
            <DetailField
              label={t("dairyListing.dairyCode")}
              value={formatDairyCellValue(dairy.dairyCode)}
              emphasize
            />
            <DetailField
              label={t("dairyListing.name")}
              value={dairy.name}
              emphasize
            />
            <DetailField label={t("dairyListing.phone")} value={dairy.phone} />
            <DetailField
              label={t("dairyListing.email")}
              value={formatDairyCellValue(dairy.email)}
            />
            <DetailField
              label={t("dairyListing.referralCode")}
              value={formatDairyCellValue(dairy.referralCode)}
            />
            <DetailField
              label={t("dairyListing.address")}
              value={formatDairyFullAddress(dairy)}
            />
            <DetailField
              label={t("dairyListing.createdAt")}
              value={formatDisplayDate(dairy.createdAt)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
