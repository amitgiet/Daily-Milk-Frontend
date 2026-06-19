import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface NetworkStatusBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function NetworkStatusBadge({
  className,
  showLabel = true,
}: NetworkStatusBadgeProps) {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        isOnline
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-destructive/30 bg-destructive/10 text-destructive",
        className,
      )}
    >
      {isOnline ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      {showLabel ? (isOnline ? t("common.online") : t("common.offline")) : null}
    </Badge>
  );
}

export function NetworkStatusNotifier() {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isOnline) {
      toast.success(t("common.backOnline"));
      return;
    }

    toast.error(t("common.noInternet"));
  }, [isOnline, t]);

  return null;
}
