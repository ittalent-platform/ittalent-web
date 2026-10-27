import { Check, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { NotificationItem } from "@/features/notifications/types";
import { NotificationTypeIcon } from "./notification-type-icon";
import { formatNotificationRelativeTime } from "@/features/notifications/notifications.format";
import { cn } from "@/lib/utils";

export interface NotificationRowMiniProps {
  item: NotificationItem;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (item: NotificationItem) => void;
}

/**
 * Compact notification row for the bell dropdown popover.
 * Matches exact design specs: unread indicator, category icon, 2-line clamp,
 * and hover action buttons replacing timestamp.
 */
export function NotificationRowMini({
  item,
  onMarkRead,
  onDelete,
  onSelect,
}: NotificationRowMiniProps) {
  const { t, i18n } = useTranslation();
  const isUnread = !item.isRead;
  const timeFormatted = formatNotificationRelativeTime(item.createdAt, i18n.language);

  const targetUrl = item.actionUrl || "/notifications";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3.5 border-t border-line-muted py-3.5 pl-6 pr-3 transition-colors",
        isUnread ? "bg-ember-wash/30" : "bg-card",
        "hover:bg-muted focus-within:bg-muted",
      )}
      data-slot="notification-row-mini"
      data-unread={isUnread}
      role="listitem"
    >
      {/* Unread dot */}
      {isUnread && (
        <span
          aria-label={t("notifications.tabs.unread")}
          className="absolute left-2.5 top-1/2 -mt-1 size-2 rounded-full bg-brand"
        />
      )}

      {/* Category icon */}
      <NotificationTypeIcon type={item.type} />

      {/* Title & Preview Content */}
      <Link
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-foreground no-underline focus:outline-none"
        onClick={() => {
          if (isUnread && onMarkRead && item.id) {
            onMarkRead(item.id);
          }
          if (onSelect) {
            onSelect(item);
          }
        }}
        to={targetUrl}
      >
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
            "line-clamp-2 text-[13.5px] leading-normal",
            isUnread ? "text-foreground/80" : "text-muted-foreground",
          )}
        >
          {item.message}
        </span>
      </Link>

      {/* Timestamp (hidden when hovering / focusing actions) */}
      <span
        aria-hidden="true"
        className="block shrink-0 whitespace-nowrap text-right text-[12.5px] text-muted-foreground group-focus-within:hidden group-hover:hidden"
      >
        {timeFormatted}
      </span>

      {/* Action buttons on hover / focus */}
      <div className="hidden shrink-0 items-center gap-0.5 group-focus-within:flex group-hover:flex">
        {isUnread && (
          <button
            aria-label={t("notifications.actions.markAsRead")}
            className="flex size-[34px] items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.id && onMarkRead) {
                onMarkRead(item.id);
              }
            }}
            title={t("notifications.actions.markAsRead")}
            type="button"
          >
            <Check className="size-[17px]" />
          </button>
        )}
        <button
          aria-label={t("notifications.actions.delete")}
          className="flex size-[34px] items-center justify-center rounded-[10px] text-danger transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (item.id && onDelete) {
              onDelete(item.id);
            }
          }}
          title={t("notifications.actions.delete")}
          type="button"
        >
          <Trash2 className="size-[17px]" />
        </button>
      </div>
    </div>
  );
}
