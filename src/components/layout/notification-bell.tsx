import { NotificationBellPopover } from "@/features/notifications/components/notification-bell-popover";

export interface NotificationBellProps {
  unreadCount?: number;
  className?: string;
  viewAllHref?: string;
}

/**
 * Header notification bell.
 * Renders an interactive popover with live unread badge, quick actions,
 * and category tabs ("All" / "Unread").
 */
export function NotificationBell({
  unreadCount,
  className,
  viewAllHref,
}: NotificationBellProps) {
  return (
    <NotificationBellPopover
      className={className}
      unreadCountOverride={unreadCount}
      viewAllHref={viewAllHref}
    />
  );
}
