import { Bell, Calendar, FileText, Megaphone, TrendingUp } from "lucide-react";

import type { NotificationType } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

export interface NotificationTypeIconProps {
  type?: NotificationType | string;
  className?: string;
}

/**
 * 40x40 rounded-12px icon chip for notification categories per design tokens.
 */
export function NotificationTypeIcon({ type, className }: NotificationTypeIconProps) {
  switch (type) {
    case "interview_scheduled":
    case "interview_rescheduled":
    case "interview_cancelled":
      return (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-mkt-blue-bg text-mkt-blue-fg",
            className,
          )}
        >
          <Calendar className="size-[18px]" />
        </span>
      );

    case "application_status_changed":
      return (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-mkt-green-bg text-mkt-green-fg",
            className,
          )}
        >
          <TrendingUp className="size-[18px]" />
        </span>
      );

    case "application_submitted":
      return (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-muted text-muted-foreground",
            className,
          )}
        >
          <FileText className="size-[18px]" />
        </span>
      );

    case "system_announcement":
      return (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-danger-bg text-danger",
            className,
          )}
        >
          <Megaphone className="size-[18px]" />
        </span>
      );

    default:
      return (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-muted text-muted-foreground",
            className,
          )}
        >
          <Bell className="size-[18px]" />
        </span>
      );
  }
}
