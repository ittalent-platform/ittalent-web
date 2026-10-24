import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { ToastProvider } from "@/components/toast/toast-provider";

describe("NotificationCenterPage & NotificationItemRow Suite", () => {
  let queryClient: QueryClient;

  function renderWithProviders(ui: ReactNode, initialEntries = ["/notifications"]) {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
        </ToastProvider>
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

  afterEach(() => {
    vi.useRealTimers();
  });

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
        totalPages: 3,
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

    it("sanitizes system_announcements by ignoring external actionUrl and triggers onSelect", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onMarkRead = vi.fn();
      const maliciousAnnouncement: NotificationItem = {
        ...sampleNotifications[2],
        actionUrl: "https://malicious-phishing.com/steal-creds",
      };

      renderWithProviders(
        <NotificationItemRow
          item={maliciousAnnouncement}
          onDelete={vi.fn()}
          onMarkRead={onMarkRead}
          onSelect={onSelect}
        />,
      );

      // Verify no external link is rendered
      expect(screen.queryByRole("link")).not.toBeInTheDocument();

      // Clicking row triggers onSelect and marks read
      const rowButton = screen.getByRole("button", { name: /scheduled maintenance/i });
      await user.click(rowButton);

      expect(onMarkRead).toHaveBeenCalledWith("notif-3");
      expect(onSelect).toHaveBeenCalledWith(maliciousAnnouncement);
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

    it("opens confirmation dialog and confirms before mutating mark all as read", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const markAllBtn = await screen.findByRole("button", { name: /mark all as read/i });
      await user.click(markAllBtn);

      // Verify confirmation dialog is displayed
      const dialog = await screen.findByRole("alertdialog");
      expect(
        within(dialog).getByRole("heading", { name: /mark 2 notifications as read\?/i }),
      ).toBeInTheDocument();
      expect(api.patchApiV1NotificationsReadAll).not.toHaveBeenCalled();

      // Click confirm inside dialog ("Mark as read")
      const confirmBtn = within(dialog).getByRole("button", { name: /^mark as read$/i });
      await user.click(confirmBtn);

      expect(api.patchApiV1NotificationsReadAll).toHaveBeenCalledTimes(1);
      expect(api.patchApiV1NotificationsReadAll).toHaveBeenCalledWith({
        query: { before: sampleNotifications[0].createdAt },
      });
    });

    it("uses singular wording when 1 unread notification is marked as read", async () => {
      const user = userEvent.setup();
      vi.mocked(api.getApiV1NotificationsUnreadCount).mockResolvedValue({
        data: { unreadCount: 1 },
        response: new Response(null, { status: 200 }),
      });

      renderWithProviders(<NotificationCenterPage />);

      const markAllBtn = await screen.findByRole("button", { name: /mark all as read/i });
      await user.click(markAllBtn);

      const dialog = await screen.findByRole("alertdialog");
      expect(
        within(dialog).getByRole("heading", { name: "Mark 1 notification as read?" }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Mark as read" }),
      ).toBeInTheDocument();
    });

    it("displays error toast when mark all as read mutation fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.patchApiV1NotificationsReadAll).mockRejectedValue(new Error("Network error"));

      renderWithProviders(<NotificationCenterPage />);

      const markAllBtn = await screen.findByRole("button", { name: /mark all as read/i });
      await user.click(markAllBtn);

      const dialog = await screen.findByRole("alertdialog");
      const confirmBtn = within(dialog).getByRole("button", { name: /^mark as read$/i });
      await user.click(confirmBtn);

      expect(
        await screen.findByText(
          /nothing was marked as read.*you still have 2 unread notifications/i,
        ),
      ).toBeInTheDocument();
    });

    it("opens more actions dropdown menu and confirms delete all dialog before mutating", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const moreBtn = await screen.findByRole("button", { name: /more actions/i });
      await user.click(moreBtn);

      const deleteAllMenuItem = await screen.findByRole("menuitem", { name: /delete all/i });
      await user.click(deleteAllMenuItem);

      // Verify destructive action confirmation dialog is shown and mutation has not run yet
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /delete.*notifications\?/i })).toBeInTheDocument();
      expect(api.deleteApiV1Notifications).not.toHaveBeenCalled();

      // Click confirm button inside the dialog
      const confirmBtn = screen.getByRole("button", { name: /delete.*notifications/i });
      await user.click(confirmBtn);

      expect(api.deleteApiV1Notifications).toHaveBeenCalledTimes(1);
    });

    it("cancels delete all confirmation without calling delete API", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const moreBtn = await screen.findByRole("button", { name: /more actions/i });
      await user.click(moreBtn);

      const deleteAllMenuItem = await screen.findByRole("menuitem", { name: /delete all/i });
      await user.click(deleteAllMenuItem);

      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelBtn);

      expect(api.deleteApiV1Notifications).not.toHaveBeenCalled();
    });

    it("renders stale batch dialog variant when inbox count changes before confirming delete all", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      const moreBtn = await screen.findByRole("button", { name: /more actions/i });
      await user.click(moreBtn);

      const deleteAllMenuItem = await screen.findByRole("menuitem", { name: /delete all/i });
      await user.click(deleteAllMenuItem);

      // Dialog is open with initial count 25
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /delete 25 notifications\?/i })).toBeInTheDocument();

      // Total count changes in cache (e.g. new notification arrives, count becomes 26)
      queryClient.setQueriesData<{ pages: Array<{ total: number; [key: string]: unknown }> }>(
        { queryKey: ["notifications", "infinite-list"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({ ...p, total: 26 })),
          };
        },
      );

      // Dialog updates to Stale Batch variant
      expect(await screen.findByRole("heading", { name: /your notifications changed/i })).toBeInTheDocument();
      expect(screen.getByText(/you now have 26 notifications, not 25/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete 26 notifications/i })).toBeInTheDocument();
    });

    it("requests more items when clicking Show older button", async () => {
      const user = userEvent.setup();
      vi.mocked(api.getApiV1Notifications).mockImplementation(async ({ query }) => {
        const page = (query?.page as number) ?? 1;
        return {
          data: {
            hasNext: page < 3,
            items: sampleNotifications.map((n) => ({ ...n, id: `${n.id}-p${page}` })),
            limit: 10,
            page,
            total: 25,
            totalPages: 3,
            unreadCount: 2,
          },
          response: new Response(null, { status: 200 }),
        };
      });

      renderWithProviders(<NotificationCenterPage />);

      const showOlderBtn = await screen.findByRole("button", { name: /show older/i });
      await user.click(showOlderBtn);

      // Verify getApiV1Notifications was called for the next page (page: 2)
      await waitFor(() => {
        expect(api.getApiV1Notifications).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.objectContaining({ page: 2, limit: 10 }),
          }),
        );
      });
    });

    it("keeps existing rows visible and shows inline retry when fetching next page fails", async () => {
      const user = userEvent.setup();
      let failPage2 = true;
      vi.mocked(api.getApiV1Notifications).mockImplementation(async ({ query }) => {
        const page = (query?.page as number) ?? 1;
        if (page === 2 && failPage2) {
          failPage2 = false;
          throw new Error("Page 2 fetch failed");
        }
        return {
          data: {
            hasNext: page === 1,
            items:
              page === 1
                ? sampleNotifications
                : [{ ...sampleNotifications[0], id: "notif-p2-1", title: "Page 2 item" }],
            limit: 10,
            page,
            total: 25,
            totalPages: 3,
            unreadCount: 2,
          },
          response: new Response(null, { status: 200 }),
        };
      });

      renderWithProviders(<NotificationCenterPage />);

      // Existing items from page 1 are shown
      expect(await screen.findByText("Interview scheduled")).toBeInTheDocument();

      const showOlderBtn = screen.getByRole("button", { name: /show older/i });
      await user.click(showOlderBtn);

      // Page 1 rows are NOT wiped out
      expect(screen.getByText("Interview scheduled")).toBeInTheDocument();

      // Inline error message appears
      expect(await screen.findByRole("alert")).toHaveTextContent(/couldn['’]t load older notifications/i);

      // Button now says "Try again"
      const tryAgainBtn = screen.getByRole("button", { name: /try again/i });
      expect(tryAgainBtn).toBeInTheDocument();

      // Click "Try again"
      await user.click(tryAgainBtn);

      // Page 2 items load successfully
      expect(await screen.findByText("Page 2 item")).toBeInTheDocument();
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

    it("opens AnnouncementDetailDialog when clicking an announcement and allows deleting it", async () => {
      const user = userEvent.setup();
      vi.mocked(api.deleteApiV1NotificationsById).mockResolvedValue({
        data: { id: "notif-3", deletedAt: new Date().toISOString() },
        response: new Response(null, { status: 200 }),
      });

      renderWithProviders(<NotificationCenterPage />);

      // Find announcement row and click it
      const announceRow = await screen.findByRole("button", {
        name: /scheduled maintenance on 18 oct/i,
      });
      await user.click(announceRow);

      // Verify patchApiV1NotificationsByIdRead was called to mark as read exactly once
      expect(api.patchApiV1NotificationsByIdRead).toHaveBeenCalledTimes(1);
      expect(api.patchApiV1NotificationsByIdRead).toHaveBeenCalledWith({
        path: { id: "notif-3" },
      });

      // Verify dialog is open and displays announcement details
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText("Sent to everyone in a group. Replies aren’t possible.")).toBeInTheDocument();

      // Click Delete inside dialog
      const deleteDialogBtn = screen.getByRole("button", { name: /^delete$/i });
      await user.click(deleteDialogBtn);

      // Announcement row is removed immediately from visible items
      expect(screen.queryByRole("button", { name: /scheduled maintenance on 18 oct/i })).not.toBeInTheDocument();
      // Toast appears with Undo
      expect(screen.getByText("Notification deleted")).toBeInTheDocument();
    });

    it("restores row and aborts delete when Undo is clicked within 5 seconds", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenterPage />);

      expect(await screen.findByText("Interview scheduled")).toBeInTheDocument();
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Row disappears immediately
      expect(screen.queryByText("Interview scheduled")).not.toBeInTheDocument();

      // Toast appears with Undo button
      const undoBtn = screen.getByRole("button", { name: /undo/i });
      expect(undoBtn).toBeInTheDocument();

      // Click Undo
      await user.click(undoBtn);

      // Row is restored!
      expect(screen.getByText("Interview scheduled")).toBeInTheDocument();

      // Delete API was never called
      expect(api.deleteApiV1NotificationsById).not.toHaveBeenCalled();
    });

    it("dispatches delete API call after 5-second undo window closes", async () => {
      vi.mocked(api.deleteApiV1NotificationsById).mockResolvedValue({
        data: { id: "notif-1", deletedAt: new Date().toISOString() },
        response: new Response(null, { status: 200 }),
      });

      renderWithProviders(<NotificationCenterPage />);
      expect(await screen.findByText("Interview scheduled")).toBeInTheDocument();

      vi.useFakeTimers();
      try {
        const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        // Row disappears immediately
        expect(screen.queryByText("Interview scheduled")).not.toBeInTheDocument();
        // Delete API not called yet
        expect(api.deleteApiV1NotificationsById).not.toHaveBeenCalled();

        // Advance 5 seconds
        await vi.advanceTimersByTimeAsync(5000);

        // Delete API called
        expect(api.deleteApiV1NotificationsById).toHaveBeenCalledWith({
          path: { id: "notif-1" },
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it("renders error state with retry button when query fails and retries on click", async () => {
      const user = userEvent.setup();
      vi.mocked(api.getApiV1Notifications).mockRejectedValue(new Error("Network failed"));

      renderWithProviders(<NotificationCenterPage />);

      expect(await screen.findByText(/notifications couldn['’]t be loaded/i)).toBeInTheDocument();
      expect(
        screen.getByText(/something went wrong on our side/i),
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /try again/i });
      expect(retryBtn).toBeInTheDocument();

      // Reset mock to succeed on retry
      vi.mocked(api.getApiV1Notifications).mockResolvedValueOnce({
        data: {
          hasNext: false,
          items: sampleNotifications,
          limit: 10,
          page: 1,
          total: 3,
          totalPages: 1,
          unreadCount: 2,
        },
        response: new Response(null, { status: 200 }),
      });

      await user.click(retryBtn);

      expect(await screen.findByText("Interview scheduled")).toBeInTheDocument();
    });

    it("renders 'Browse jobs' CTA button in 'All' tab empty state linking to /jobs", async () => {
      vi.mocked(api.getApiV1Notifications).mockResolvedValue({
        data: {
          hasNext: false,
          items: [],
          limit: 10,
          page: 1,
          total: 0,
          totalPages: 1,
          unreadCount: 0,
        },
        response: new Response(null, { status: 200 }),
      });

      renderWithProviders(<NotificationCenterPage />);

      expect(await screen.findByText("No notifications yet")).toBeInTheDocument();
      const browseBtn = screen.getByRole("link", { name: /browse jobs/i });
      expect(browseBtn).toBeInTheDocument();
      expect(browseBtn).toHaveAttribute("href", "/jobs");
    });
  });
});
