import { cn } from "@/lib/utils";

export interface NotificationBadgeProps {
  count?: number;
  className?: string;
}

/**
 * Notification badge overlay for bell icon.
 * Caps at "99+" and hides completely when count is 0 or undefined.
 */
export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (!count || count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -right-1.5 -top-1 box-border flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-[5px] text-[11px] font-bold text-white",
        className,
      )}
      data-slot="notification-badge"
    >
      {displayCount}
    </span>
  );
}
