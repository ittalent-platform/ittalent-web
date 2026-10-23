import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api/generated";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  NotificationBadge,
  NotificationBellPopover,
  NotificationRowMini,
} from "@/features/notifications";
import type { NotificationItem } from "@/features/notifications/types";

vi.mock("@/api/generated", () => ({
  deleteApiV1Notifications: vi.fn(),
  deleteApiV1NotificationsById: vi.fn(),
  getApiV1Notifications: vi.fn(),
  getApiV1NotificationsUnreadCount: vi.fn(),
  patchApiV1NotificationsByIdRead: vi.fn(),
  patchApiV1NotificationsReadAll: vi.fn(),
}));

describe("Notification Bell & Popover Component Suite", () => {
  let queryClient: QueryClient;

  function renderWithProviders(ui: ReactNode) {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>,
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

    vi.mocked(api.getApiV1NotificationsUnreadCount).mockResolvedValue({
      data: { unreadCount: 3 },
      response: new Response(null, { status: 200 }),
    });

    vi.mocked(api.getApiV1Notifications).mockResolvedValue({
      data: {
        items: [
          {
            category: "info",
            createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
            id: "notif-1",
            isRead: false,
            message: "PM at CloudBridge · Video call on Thu 15 Oct, 10:00",
            title: "Interview scheduled",
            type: "interview_scheduled",
          },
          {
            category: "success",
            createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
            id: "notif-2",
            isRead: true,
            message: "DevOps at Pixel Labs moved to Offered",
            title: "Application status changed",
            type: "application_status_changed",
          },
        ],
        limit: 6,
        page: 1,
        total: 2,
        totalPages: 1,
        unreadCount: 3,
      },
      response: new Response(null, { status: 200 }),
    });
  });

  describe("NotificationBadge", () => {
    it("returns null when count is 0 or negative", () => {
      const { container } = render(<NotificationBadge count={0} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders numeric count when 1 <= count <= 99", () => {
      render(<NotificationBadge count={3} />);
      const badge = screen.getByText("3");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-brand");
    });

    it("caps at 99+ when count exceeds 99", () => {
      render(<NotificationBadge count={120} />);
      const badge = screen.getByText("99+");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-brand");
    });
  });

  describe("NotificationRowMini", () => {
    const mockItem: NotificationItem = {
      category: "info",
      createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      id: "test-row-1",
      isRead: false,
      message: "Test notification description",
      title: "Test Interview",
      type: "interview_scheduled",
    };

    it("renders unread dot, title, description, and relative time", () => {
      render(
        <MemoryRouter>
          <NotificationRowMini item={mockItem} />
        </MemoryRouter>,
      );

      expect(screen.getByText("Test Interview")).toBeInTheDocument();
      expect(screen.getByText("Test notification description")).toBeInTheDocument();
      expect(screen.getByText("10 min ago")).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toHaveAttribute("data-unread", "true");
    });

    it("triggers onMarkRead when mark-as-read checkmark is clicked", () => {
      const handleMarkRead = vi.fn();
      render(
        <MemoryRouter>
          <NotificationRowMini item={mockItem} onMarkRead={handleMarkRead} />
        </MemoryRouter>,
      );

      const markReadBtn = screen.getByTitle("Mark as read");
      fireEvent.click(markReadBtn);
      expect(handleMarkRead).toHaveBeenCalledWith("test-row-1");
    });

    it("triggers onDelete when delete button is clicked", () => {
      const handleDelete = vi.fn();
      render(
        <MemoryRouter>
          <NotificationRowMini item={mockItem} onDelete={handleDelete} />
        </MemoryRouter>,
      );

      const deleteBtn = screen.getByTitle("Delete");
      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith("test-row-1");
    });
  });

  describe("NotificationBellPopover", () => {
    it("renders trigger with live unread badge", async () => {
      renderWithProviders(<NotificationBellPopover />);

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("opens popover panel when trigger is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationBellPopover />);

      const trigger = screen.getByRole("button", { name: /notifications/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: /notifications/i })).toBeInTheDocument();
      });

      expect(screen.getByText("Interview scheduled")).toBeInTheDocument();
      expect(screen.getByText("Application status changed")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /unread/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /view all notifications/i })).toHaveAttribute(
        "href",
        "/account/notifications",
      );
    });

    it("calls markAllAsRead API when header quick action is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(api.patchApiV1NotificationsReadAll).mockResolvedValue({
        data: { message: "All marked read", updatedCount: 3 },
        response: new Response(null, { status: 200 }),
      });

      renderWithProviders(<NotificationBellPopover />);

      const trigger = screen.getByRole("button", { name: /notifications/i });
      await user.click(trigger);

      const markAllBtn = await screen.findByRole("button", { name: /mark all as read/i });
      await user.click(markAllBtn);

      expect(api.patchApiV1NotificationsReadAll).toHaveBeenCalled();
    });

    it("switches tabs between All and Unread", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationBellPopover />);

      const trigger = screen.getByRole("button", { name: /notifications/i });
      await user.click(trigger);

      const unreadTab = await screen.findByRole("tab", { name: /unread/i });
      await user.click(unreadTab);

      expect(unreadTab).toHaveAttribute("aria-selected", "true");
    });

    it("NotificationBell wrapper renders correctly", async () => {
      renderWithProviders(<NotificationBell unreadCount={5} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });
});
