import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authClient from "@/api/client";
import type { UserDto } from "@/api/generated/types.gen";
import * as useSessionModule from "@/auth/use-session";
import * as toastProviderModule from "@/components/toast/toast-provider";
import { NotificationStreamListener, useNotificationStream } from "@/features/notifications";

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  dispatchEvent(type: string, data: unknown) {
    const handlers = this.listeners[type] || [];
    for (const h of handlers) {
      h(new MessageEvent(type, { data: JSON.stringify(data) }));
    }
  }

  close() {
    this.closed = true;
  }
}

describe("Notification Stream (SSE) Integration Suite", () => {
  let queryClient: QueryClient;
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(toastProviderModule, "useToast").mockReturnValue({
      showToast: mockShowToast,
      dismissToast: vi.fn(),
    });
  });

  function renderWithProviders(ui: ReactNode) {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>,
    );
  }

  it("does not initiate EventSource when user is unauthenticated", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: null,
      isPending: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    });
    vi.spyOn(authClient, "getStoredTokens").mockReturnValue(null);

    function TestComponent() {
      useNotificationStream();
      return null;
    }

    renderWithProviders(<TestComponent />);
    expect(MockEventSource.instances.length).toBe(0);
  });

  it("opens EventSource with bearer token and listens for live notifications", async () => {
    const mockUser: UserDto = {
      id: "user-123",
      email: "candidate@ittalent.io",
      role: "candidate",
      status: "active",
      fullName: "Test Candidate",
      avatarUrl: null,
      phoneNumber: null,
      isEmailVerified: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: { user: mockUser },
      isPending: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    });
    vi.spyOn(authClient, "getStoredTokens").mockReturnValue({
      accessToken: "test-access-token-xyz",
      refreshToken: "test-refresh-token",
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function TestComponent() {
      useNotificationStream();
      return null;
    }

    renderWithProviders(<TestComponent />);

    expect(MockEventSource.instances.length).toBe(1);
    const instance = MockEventSource.instances[0];
    expect(instance.url).toContain("/api/v1/notifications/stream?token=test-access-token-xyz");

    // Simulate incoming SSE notification event
    const mockNotification = {
      id: "notif-sse-1",
      title: "Interview Rescheduled",
      message: "New time: Tomorrow 14:00",
      type: "interview_rescheduled",
      category: "warning",
      actionUrl: "/my-applications/app-1",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    instance.dispatchEvent("notification", mockNotification);

    await waitFor(() => {
      // Check query cache invalidation
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications", "unread-count"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications", "list"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications", "infinite-list"] });

      // Check toast notification
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Notification",
          message: "Interview Rescheduled: New time: Tomorrow 14:00",
          tone: "warning",
          action: expect.objectContaining({
            label: "View",
          }),
        }),
      );
    });
  });

  it("closes EventSource cleanly on component unmount", () => {
    const mockUser: UserDto = {
      id: "user-123",
      email: "candidate@ittalent.io",
      role: "candidate",
      status: "active",
      fullName: "Test Candidate",
      avatarUrl: null,
      phoneNumber: null,
      isEmailVerified: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: { user: mockUser },
      isPending: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    });
    vi.spyOn(authClient, "getStoredTokens").mockReturnValue({
      accessToken: "test-access-token-xyz",
      refreshToken: "test-refresh-token",
    });

    const { unmount } = renderWithProviders(<NotificationStreamListener />);
    expect(MockEventSource.instances.length).toBe(1);
    const instance = MockEventSource.instances[0];
    expect(instance.closed).toBe(false);

    unmount();
    expect(instance.closed).toBe(true);
  });
});
