import { Bell, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useUnreadCountQuery,
} from "@/features/notifications/api/notifications.queries";
import { tabToNotificationQuery } from "@/features/notifications/types";
import { NotificationBadge } from "./notification-badge";
import { NotificationRowMini } from "./notification-row-mini";
import { cn } from "@/lib/utils";

export interface NotificationBellPopoverProps {
  className?: string;
  viewAllHref?: string;
  unreadCountOverride?: number;
}

/**
 * Interactive Notification Bell Popover component matching exact design specifications:
 * - Live unread badge (1-99, 99+)
 * - 440px rounded-[16px] drop panel with drop shadow
 * - Header with title and "Mark all as read"
 * - "All" and "Unread" tab navigation
 * - Mini scrollable row items with hover quick actions
 * - Empty state feedback
 * - "View all notifications" footer CTA
 */
export function NotificationBellPopover({
  className,
  viewAllHref = "/account/notifications",
  unreadCountOverride,
}: NotificationBellPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const unreadCountQuery = useUnreadCountQuery();
  const unreadCount = unreadCountOverride ?? unreadCountQuery.data?.unreadCount ?? 0;

  const notificationsQuery = useNotificationsQuery(
    tabToNotificationQuery(activeTab, { page: 1, limit: 6 }),
  );

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const items = notificationsQuery.data?.items ?? [];
  const totalCount = notificationsQuery.data?.total ?? 0;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label={
            unreadCount > 0
              ? t("nav.notificationsUnread", { count: unreadCount, defaultValue: `Notifications (${unreadCount} unread)` })
              : t("nav.notifications", { defaultValue: "Notifications" })
          }
          className={cn(
            "relative flex size-10 items-center justify-center rounded-full border border-input bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            open && "bg-muted ring-2 ring-primary/30",
            className,
          )}
          data-slot="notification-bell-trigger"
          type="button"
        >
          <Bell aria-hidden="true" className="size-[18px]" />
          <NotificationBadge count={unreadCount} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        aria-label={t("notifications.title", { defaultValue: "Notifications" })}
        className="w-[440px] rounded-[16px] border-0 bg-card p-0 shadow-[0_18px_50px_rgba(25,25,28,0.18),0_0_0_1px_rgba(25,25,28,0.06)]"
        data-slot="notification-bell-popover"
        sideOffset={10}
      >
        {/* Header container */}
        <div className="flex flex-col gap-2.5 px-[18px] pt-4">
          <div className="flex items-center justify-between">
            <span className="font-['Space_Grotesk'] text-[17px] font-semibold text-foreground">
              {t("notifications.title", { defaultValue: "Notifications" })}
            </span>
            {unreadCount > 0 && (
              <button
                className="text-[13px] font-bold text-fg-link transition-colors hover:text-link-hover disabled:opacity-50"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                type="button"
              >
                {t("notifications.markAllAsRead", { defaultValue: "Mark all as read" })}
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex gap-[22px]" role="tablist">
            <button
              aria-selected={activeTab === "all"}
              className={cn(
                "inline-flex h-10 items-center gap-2 border-b-2 px-0.5 text-[14px] transition-colors",
                activeTab === "all"
                  ? "border-brand font-bold text-foreground"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveTab("all")}
              role="tab"
              type="button"
            >
              <span>{t("notifications.tabs.all", { defaultValue: "All" })}</span>
              <span
                className={cn(
                  "box-border inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[12px] font-bold",
                  activeTab === "all"
                    ? "bg-ember-wash text-fg-link"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {totalCount}
              </span>
            </button>

            <button
              aria-selected={activeTab === "unread"}
              className={cn(
                "inline-flex h-10 items-center gap-2 border-b-2 px-0.5 text-[14px] transition-colors",
                activeTab === "unread"
                  ? "border-brand font-bold text-foreground"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveTab("unread")}
              role="tab"
              type="button"
            >
              <span>{t("notifications.tabs.unread", { defaultValue: "Unread" })}</span>
              <span
                className={cn(
                  "box-border inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[12px] font-bold",
                  activeTab === "unread"
                    ? "bg-ember-wash text-fg-link"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {unreadCount}
              </span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div
          className="max-h-[380px] overflow-y-auto border-t border-line-muted"
          role="list"
        >
          {notificationsQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col gap-2 p-6 text-left">
              <span className="font-['Space_Grotesk'] text-[17px] font-semibold text-foreground">
                {activeTab === "unread"
                  ? t("notifications.empty.allCaughtUp", { defaultValue: "You’re all caught up" })
                  : t("notifications.empty.noNotifications", { defaultValue: "No notifications yet" })}
              </span>
              <span className="text-[13.5px] leading-relaxed text-muted-foreground">
                {activeTab === "unread"
                  ? t("notifications.empty.allCaughtUpDesc", { defaultValue: "No unread notifications. Older ones are under All." })
                  : t("notifications.empty.noNotificationsDesc", { defaultValue: "We’ll let you know here when a company reviews your application or schedules an interview." })}
              </span>
            </div>
          ) : (
            items.map((item) => (
              <NotificationRowMini
                item={item}
                key={item.id}
                onDelete={(id) => deleteMutation.mutate({ id })}
                onMarkRead={(id) => markReadMutation.mutate({ id })}
                onSelect={() => setOpen(false)}
              />
            ))
          )}
        </div>

        {/* Footer CTA */}
        <Link
          className="flex h-12 items-center justify-center border-t border-line-muted text-[13.5px] font-bold text-fg-link no-underline transition-colors hover:bg-surface-subtle hover:text-link-hover"
          onClick={() => setOpen(false)}
          to={viewAllHref}
        >
          {t("notifications.popover.viewAll", { defaultValue: "View all notifications" })}
        </Link>
      </PopoverContent>
    </Popover>
  );
}
