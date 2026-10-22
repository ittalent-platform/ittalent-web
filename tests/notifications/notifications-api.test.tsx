import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api/generated";
import {
  notificationKeys,
  tabToNotificationQuery,
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useUnreadCountQuery,
} from "@/features/notifications";

vi.mock("@/api/generated", () => ({
  deleteApiV1Notifications: vi.fn(),
  deleteApiV1NotificationsById: vi.fn(),
  getApiV1Notifications: vi.fn(),
  getApiV1NotificationsUnreadCount: vi.fn(),
  patchApiV1NotificationsByIdRead: vi.fn(),
  patchApiV1NotificationsReadAll: vi.fn(),
}));

describe("Notifications API & React Query Layer", () => {
  let queryClient: QueryClient;

  function createWrapper() {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe("tabToNotificationQuery", () => {
    it("maps all tab to unbounded query params", () => {
      expect(tabToNotificationQuery("all")).toEqual({ limit: 20, page: 1 });
    });

    it("maps unread tab to isRead=false query params", () => {
      expect(tabToNotificationQuery("unread")).toEqual({ isRead: false, limit: 20, page: 1 });
    });

    it("maps announcements tab to type=system_announcement query params", () => {
      expect(tabToNotificationQuery("announcements", { limit: 10, page: 2 })).toEqual({
        limit: 10,
        page: 2,
        type: "system_announcement",
      });
    });
  });

  describe("useNotificationsQuery", () => {
    it("fetches notifications list successfully", async () => {
      const mockResponse = {
        items: [
          {
            category: "info" as const,
            createdAt: "2026-10-22T10:00:00Z",
            id: "notif-1",
            isRead: false,
            message: "Application moved to Offered.",
            title: "Application status changed",
            type: "application_status_changed" as const,
          },
        ],
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
        unreadCount: 1,
      };

      vi.mocked(api.getApiV1Notifications).mockResolvedValueOnce({
        data: mockResponse,
        response: new Response(null, { status: 200 }),
      });

      const { result } = renderHook(() => useNotificationsQuery({ limit: 20, page: 1 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockResponse);
      expect(api.getApiV1Notifications).toHaveBeenCalledWith({ query: { limit: 20, page: 1 } });
    });
  });

  describe("useUnreadCountQuery", () => {
    it("fetches unread count badge data", async () => {
      vi.mocked(api.getApiV1NotificationsUnreadCount).mockResolvedValueOnce({
        data: { unreadCount: 5 },
        response: new Response(null, { status: 200 }),
      });

      const { result } = renderHook(() => useUnreadCountQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.unreadCount).toBe(5);
    });
  });

  describe("useMarkNotificationRead", () => {
    it("optimistically marks a notification as read and calls patch API", async () => {
      const initialList = {
        items: [
          {
            category: "info" as const,
            createdAt: "2026-10-22T10:00:00Z",
            id: "notif-1",
            isRead: false,
            message: "Test message",
            title: "Test title",
            type: "account_alert" as const,
          },
        ],
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
        unreadCount: 1,
      };

      queryClient.setQueryData(notificationKeys.list({ limit: 20, page: 1 }), initialList);
      queryClient.setQueryData(notificationKeys.unreadCount(), { unreadCount: 1 });

      vi.mocked(api.patchApiV1NotificationsByIdRead).mockResolvedValueOnce({
        data: {
          category: "info" as const,
          createdAt: "2026-10-22T10:00:00Z",
          id: "notif-1",
          isRead: true,
          message: "Test message",
          readAt: "2026-10-22T10:05:00Z",
          title: "Test title",
          type: "account_alert" as const,
        },
        response: new Response(null, { status: 200 }),
      });

      const { result } = renderHook(() => useMarkNotificationRead(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: "notif-1" });

      expect(api.patchApiV1NotificationsByIdRead).toHaveBeenCalledWith({ path: { id: "notif-1" } });
    });
  });

  describe("useMarkAllNotificationsRead", () => {
    it("calls read-all API and clears unread counter", async () => {
      queryClient.setQueryData(notificationKeys.unreadCount(), { unreadCount: 3 });

      vi.mocked(api.patchApiV1NotificationsReadAll).mockResolvedValueOnce({
        data: {
          message: "All notifications marked as read",
          unreadCount: 0,
          updatedCount: 3,
        },
        response: new Response(null, { status: 200 }),
      });

      const { result } = renderHook(() => useMarkAllNotificationsRead(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync();

      expect(api.patchApiV1NotificationsReadAll).toHaveBeenCalled();
      expect(queryClient.getQueryData(notificationKeys.unreadCount())).toEqual({ unreadCount: 0 });
    });
  });

  describe("useDeleteNotification", () => {
    it("optimistically removes the item from the list", async () => {
      const initialList = {
        items: [
          {
            category: "info" as const,
            createdAt: "2026-10-22T10:00:00Z",
            id: "notif-1",
            isRead: false,
            message: "Test message",
            title: "Test title",
            type: "account_alert" as const,
          },
        ],
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
        unreadCount: 1,
      };

      queryClient.setQueryData(notificationKeys.list({ limit: 20, page: 1 }), initialList);

      vi.mocked(api.deleteApiV1NotificationsById).mockResolvedValueOnce({
        data: { message: "Notification deleted", success: true as const },
        response: new Response(null, { status: 200 }),
      });

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: "notif-1" });

      expect(api.deleteApiV1NotificationsById).toHaveBeenCalledWith({ path: { id: "notif-1" } });
    });
  });

  describe("useDeleteAllNotifications", () => {
    it("optimistically clears all items and zeros unread count", async () => {
      queryClient.setQueryData(notificationKeys.unreadCount(), { unreadCount: 4 });

      vi.mocked(api.deleteApiV1Notifications).mockResolvedValueOnce({
        data: { deletedCount: 4, message: "All notifications deleted" },
        response: new Response(null, { status: 200 }),
      });

      const { result } = renderHook(() => useDeleteAllNotifications(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync();

      expect(api.deleteApiV1Notifications).toHaveBeenCalled();
      expect(queryClient.getQueryData(notificationKeys.unreadCount())).toEqual({ unreadCount: 0 });
    });
  });
});
