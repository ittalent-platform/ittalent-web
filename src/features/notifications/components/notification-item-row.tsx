import { Check, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { NotificationItem } from "@/features/notifications/types";
import { NotificationTypeIcon } from "./notification-type-icon";
import { formatNotificationRelativeTime } from "@/features/notifications/notifications.format";
import { cn } from "@/lib/utils";

export interface NotificationItemRowProps {
  item: NotificationItem;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (item: NotificationItem) => void;
  className?: string;
}

/**
 * Primary row renderer for the Notification Center page matching exact design specifications:
 * - Unread indicator dot at left edge
 * - 40x40px rounded-[12px] category icon chip
 * - Announcement uppercase eyebrow badge ("ANNOUNCEMENT · ITTALENT")
 * - 2-line clamped title and message
 * - Right-aligned relative timestamp
 * - Hover / focus-within quick action swap (relative timestamp hides, revealing Check & Trash2 buttons)
 */
export function NotificationItemRow({
  item,
  onMarkRead,
  onDelete,
  onSelect,
  className,
}: NotificationItemRowProps) {
  const { t, i18n } = useTranslation();
  const isUnread = !item.isRead;
  const isAnnouncement = item.type === "system_announcement";
  const timeFormatted = formatNotificationRelativeTime(item.createdAt, i18n.language);

  const handleClick = () => {
    if (isUnread && onMarkRead && item.id) {
      onMarkRead(item.id);
    }
    if (onSelect) {
      onSelect(item);
    }
  };

  const contentElement = (
    <>
      {isAnnouncement && (
        <span className="text-[11px] font-bold tracking-wider text-fg-link uppercase">
          {t("notifications.announcement.badge", { defaultValue: "ANNOUNCEMENT · ITTALENT" })}
        </span>
      )}
      <span
        className={cn(
          "text-[14px] leading-tight text-foreground",
          isUnread ? "font-bold" : "font-semibold",
        )}
      >
        {item.title}
      </span>
      <span
        className={cn(
          "line-clamp-2 text-[13.5px] leading-relaxed",
          isUnread ? "text-foreground/80" : "text-muted-foreground",
        )}
      >
        {item.message}
      </span>
    </>
  );

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3.5 border-t border-line-muted py-3.5 pl-6 pr-4 sm:pr-6 transition-colors",
        isUnread ? "bg-ember-wash/20 hover:bg-ember-wash/35" : "bg-card hover:bg-muted",
        "focus-within:bg-muted",
        className,
      )}
      data-slot="notification-item-row"
      data-unread={isUnread}
      role="listitem"
    >
      {/* Unread dot */}
      {isUnread && (
        <span
          aria-label={t("notifications.tabs.unread", { defaultValue: "Unread" })}
          className="absolute left-2.5 top-1/2 -mt-1 size-2 rounded-full bg-brand"
        />
      )}

      {/* Category icon */}
      <NotificationTypeIcon type={item.type} />

      {/* Main content body */}
      {item.actionUrl ? (
        <Link
          className="flex min-w-0 flex-1 flex-col gap-0.5 text-foreground no-underline focus:outline-none"
          onClick={handleClick}
          to={item.actionUrl}
        >
          {contentElement}
        </Link>
      ) : (
        <button
          className="flex min-w-0 flex-1 flex-col gap-0.5 border-0 bg-transparent p-0 text-left text-foreground cursor-pointer focus:outline-none"
          onClick={handleClick}
          type="button"
        >
          {contentElement}
        </button>
      )}

      {/* Timestamp (hidden when hovering / focusing actions) */}
      <span
        aria-hidden="true"
        className="block w-[110px] shrink-0 whitespace-nowrap text-right text-[12.5px] text-muted-foreground group-focus-within:hidden group-hover:hidden"
      >
        {timeFormatted}
      </span>

      {/* Action buttons on hover / focus */}
      <div className="hidden shrink-0 items-center gap-1 group-focus-within:flex group-hover:flex">
        {isUnread && (
          <button
            aria-label={t("notifications.actions.markAsRead", { defaultValue: "Mark as read" })}
            className="flex size-[34px] items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.id && onMarkRead) {
                onMarkRead(item.id);
              }
            }}
            title={t("notifications.actions.markAsRead", { defaultValue: "Mark as read" })}
            type="button"
          >
            <Check className="size-4" />
          </button>
        )}
        <button
          aria-label={t("notifications.actions.delete", { defaultValue: "Delete" })}
          className="flex size-[34px] items-center justify-center rounded-[10px] text-danger-text transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-text/30 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (item.id && onDelete) {
              onDelete(item.id);
            }
          }}
          title={t("notifications.actions.delete", { defaultValue: "Delete" })}
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
