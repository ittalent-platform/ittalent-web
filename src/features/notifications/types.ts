import type {
  GetApiV1NotificationsData,
  NotificationItemDto,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/api/generated/types.gen";

export type NotificationTab = "all" | "unread" | "announcements";

export type NotificationListParams = NonNullable<GetApiV1NotificationsData["query"]>;

export type NotificationItem = NotificationItemDto;
export type NotificationType = NotificationItemDto["type"];

export type { NotificationItemDto, NotificationListResponse, UnreadCountResponse };

/**
 * Maps UI filter tabs to backend query parameters.
 */
export function tabToNotificationQuery(
  tab: NotificationTab,
  options: { page?: number; limit?: number } = {},
): NotificationListParams {
  const { limit = 20, page = 1 } = options;

  switch (tab) {
    case "unread":
      return { isRead: false, limit, page };
    case "announcements":
      return { limit, page, type: "system_announcement" };
    case "all":
    default:
      return { limit, page };
  }
}
