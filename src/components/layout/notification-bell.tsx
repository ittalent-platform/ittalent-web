import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/** Header bell. The unread dot only renders when a real count is supplied (no notification API yet). */
export function NotificationBell({ unreadCount = 0 }: { unreadCount?: number }) {
  const { t } = useTranslation();
  return (
    <button
      aria-label={unreadCount > 0 ? t("nav.notificationsUnread", { count: unreadCount }) : t("nav.notifications")}
      className="relative grid size-10 place-items-center rounded-full border border-(--border-strong) text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40"
      type="button"
    >
      <Bell aria-hidden className="size-[18px]" />
      {unreadCount > 0 ? (
        <span className={cn("absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-card bg-primary px-[5px] text-[11px] font-bold text-primary-foreground")}>{unreadCount}</span>
      ) : null}
    </button>
  );
}
