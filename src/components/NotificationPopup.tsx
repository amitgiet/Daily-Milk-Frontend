import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { fetchNotifications } from "@/lib/notifications";
import { formatDisplayDate } from "@/lib/dateFormat";
import type { AppNotification, NotificationType } from "@/types/notification";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    default:
      return Info;
  }
}

function getNotificationStyles(type: NotificationType) {
  switch (type) {
    case "success":
      return "text-green-600 bg-green-50";
    case "warning":
      return "text-amber-600 bg-amber-50";
    case "error":
      return "text-destructive bg-destructive/10";
    default:
      return "text-primary bg-primary/10";
  }
}

export function NotificationPopup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Array<string | number>>([]);

  useEffect(() => {
    if (!open) return;

    let isActive = true;

    async function loadNotifications() {
      setLoading(true);
      try {
        const entries = await fetchNotifications();
        if (isActive) setNotifications(entries);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        if (isActive) setNotifications([]);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      isActive = false;
    };
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.includes(item.id)).length,
    [notifications, readIds],
  );

  const markAsRead = (id: string | number) => {
    setReadIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  };

  const markAllAsRead = () => {
    setReadIds(notifications.map((item) => item.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center p-0 px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{t("notifications.title")}</p>
            {unreadCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("notifications.unreadCount", { count: unreadCount })}
              </p>
            ) : null}
          </div>
          {notifications.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              {t("notifications.markAllRead")}
            </Button>
          ) : null}
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">{t("notifications.noNotifications")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("notifications.noNotificationsDescription")}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const isUnread = !readIds.includes(notification.id);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      isUnread && "bg-primary/5",
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        getNotificationStyles(notification.type),
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        {isUnread ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.createdAt ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDisplayDate(notification.createdAt)}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
          >
            {t("notifications.viewSettings")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
