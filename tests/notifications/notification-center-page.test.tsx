import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api/generated";
import { NotificationCenterPage, NotificationItemRow } from "@/features/notifications";
import type { NotificationItem } from "@/features/notifications/types";

vi.mock("@/api/generated", () => ({
  deleteApiV1Notifications: vi.fn(),
  deleteApiV1NotificationsById: vi.fn(),
  getApiV1Notifications: vi.fn(),
  getApiV1NotificationsUnreadCount: vi.fn(),
  patchApiV1NotificationsByIdRead: vi.fn(),
  patchApiV1NotificationsReadAll: vi.fn(),
}));

describe("NotificationCenterPage & NotificationItemRow Suite", () => {
  let queryClient: QueryClient;

  function renderWithProviders(ui: ReactNode, initialEntries = ["/notifications"]) {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  }

  const sampleNotifications: NotificationItem[] = [
    {
      category: "info",
      createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      id: "notif-1",
      isRead: false,
      message: "PM at CloudBridge · Video call on Thu 15 Oct, 10:00. Please confirm you can attend.",
      title: "Interview scheduled",
      type: "interview_scheduled",
    },
    {
      category: "success",
      createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      id: "notif-2",
      isRead: true,
      message: "DevOps at Pixel Labs moved to Offered.",
      title: "Application status changed",
      type: "application_status_changed",
    },
    {
      category: "warning",
      createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
      id: "notif-3",
      isRead: false,
      message: "ITTalent will be unavailable from 22:00 to 23:30 on 18 Oct 2026.",
      title: "Scheduled maintenance on 18 Oct",
      type: "system_announcement",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(api.getApiV1NotificationsUnreadCount).mockResolvedValue({
      data: { unreadCount: 2 },
      response: new Response(null, { status: 200 }),
    });

    vi.mocked(api.getApiV1Notifications).mockResolvedValue({
      data: {
        hasNext: true,
        items: sampleNotifications,
        limit: 10,
        page: 1,
        total: 25,
        unreadCount: 2,
      },
      response: new Response(null, { status: 200 }),
    });

    vi.mocked(api.patchApiV1NotificationsByIdRead).mockResolvedValue({
      data: {
        ...sampleNotifications[0],
        isRead: true,
        readAt: new Date().toISOString(),
      },
      response: new Response(null, { status: 200 }),
    });

    vi.mocked(api.patchApiV1NotificationsReadAll).mockResolvedValue({
      data: { markedCount: 2 },
      response: new Response(null, { status: 200 }),
    });

    vi.mocked(api.deleteApiV1NotificationsById).mockResolvedValue({
      data: { success: true },
      response: new Response(null, { status: 200 }),
    });

    vi.mocked(api.deleteApiV1Notifications).mockResolvedValue({
      data: { deletedCount: 25 },
      response: new Response(null, { status: 200 }),
    });
  });

  describe("NotificationItemRow Component", () => {
    it("renders unread dot, category icon, title, message, and relative time", () => {
      renderWithProviders(
        <NotificationItemRow
          item={sampleNotifications[0]}
          onDelete={vi.fn()}
          onMarkRead={vi.fn()}
        />,
      );

      expect(screen.getByText("Interview scheduled")).toBeInTheDocument();
      expect(
        screen.getByText(
          "PM at CloudBridge · Video call on Thu 15 Oct, 10:00. Please confirm you can attend.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("12 min ago")).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toHaveAttribute("data-unread", "true");
    });

    it("renders announcement eyebrow badge for system_announcement items", () => {
      renderWithProviders(
        <NotificationItemRow
          item={sampleNotifications[2]}
          onDelete={vi.fn()}
          onMarkRead={vi.fn()}
        />,
      );

      expect(screen.getByText(/ANNOUNCEMENT · ITTALENT/i)).toBeInTheDocument();
      expect(screen.getByText("Scheduled maintenance on 18 Oct")).toBeInTheDocument();
    });

    it("triggers onMarkRead when quick check action button is clicked", async () => {
      const user = userEvent.setup();
      const onMarkRead = vi.fn();

      renderWithProviders(
        <NotificationItemRow
          item={sampleNotifications[0]}
          onDelete={vi.fn()}
          onMarkRead={onMarkRead}
        />,
      );

      const markBtn = screen.getByRole("button", { name: /mark as read/i });
      await user.click(markBtn);

      expect(onMarkRead).toHaveBeenCalledWith("notif-1");
    });

    it("triggers onDelete when trash quick action button is clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      renderWithProviders(
        <NotificationItemRow
          item={sampleNotifications[0]}
          onDelete={onDelete}
          onMarkRead={vi.fn()}
        />,
      );

      const deleteBtn = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteBtn);

      expect(onDelete).toHaveBeenCalledWith("notif-1");
    });
  });

  describe("NotificationCenterPage", () => {
    it("renders page header with heading, unread count subtitle, and tabs with counts", async () => {
      renderWithProviders(<NotificationCenterPage />);

      expect(
        await screen.findByRole("heading", { name: /notifications/i, level: 1 }),
      ).toBeInTheDocument();
      expect(await screen.findByText(/2 unread/i)).toBeInTheDocument();

      expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /unread/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /announcements/i })).toBeInTheDocument();
    });

    it("renders list of notifications with pagination footer", async () => {
      renderWithProviders(<NotificationCenterPage />);

      expect(await screen.findByText("Interview scheduled")).toBeInTheDocument();
      expect(screen.getByText("Application status changed")).toBeInTheDocument();
      expect(screen.getByText("Scheduled maintenance on 18 Oct")).toBeInTheDocument();

      expect(screen.getByText(/Showing 3 of 25/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /show older/i })).toBeInTheDocument();
    });

    it("switches tabs and updates active selection", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const unreadTab = await screen.findByRole("tab", { name: /unread/i });
      await user.click(unreadTab);

      expect(unreadTab).toHaveAttribute("aria-selected", "true");

      const announcementsTab = screen.getByRole("tab", { name: /announcements/i });
      await user.click(announcementsTab);

      expect(announcementsTab).toHaveAttribute("aria-selected", "true");
    });

    it("triggers mark all as read mutation when clicking header button", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const markAllBtn = await screen.findByRole("button", { name: /mark all as read/i });
      await user.click(markAllBtn);

      expect(api.patchApiV1NotificationsReadAll).toHaveBeenCalled();
    });

    it("opens more actions dropdown menu and triggers delete all mutation", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const moreBtn = await screen.findByRole("button", { name: /more actions/i });
      await user.click(moreBtn);

      const deleteAllMenuItem = await screen.findByRole("menuitem", { name: /delete all/i });
      await user.click(deleteAllMenuItem);

      expect(api.deleteApiV1Notifications).toHaveBeenCalled();
    });

    it("requests more items when clicking Show older button", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const showOlderBtn = await screen.findByRole("button", { name: /show older/i });
      await user.click(showOlderBtn);

      // Verify getApiV1Notifications was called with increased limit (20)
      await waitFor(() => {
        expect(api.getApiV1Notifications).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.objectContaining({ limit: 20 }),
          }),
        );
      });
    });

    it("renders contextual empty states when list has no items", async () => {
      vi.mocked(api.getApiV1Notifications).mockResolvedValue({
        data: {
          hasNext: false,
          items: [],
          limit: 10,
          page: 1,
          total: 0,
          unreadCount: 0,
        },
        response: new Response(null, { status: 200 }),
      });
      vi.mocked(api.getApiV1NotificationsUnreadCount).mockResolvedValue({
        data: { unreadCount: 0 },
        response: new Response(null, { status: 200 }),
      });

      renderWithProviders(<NotificationCenterPage />);

      expect(await screen.findByText(/No notifications yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /when a company reviews your application or schedules an interview/i,
        ),
      ).toBeInTheDocument();
      expect(screen.getAllByText("All caught up")).toHaveLength(2);
    });
  });
});
