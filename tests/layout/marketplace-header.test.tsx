import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarketplaceHeader } from "@/components/layout/marketplace-header";
import * as useSessionModule from "@/auth/use-session";

vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/api/generated", () => ({
  getApiV1NotificationsUnreadCount: vi.fn().mockResolvedValue({
    data: { unreadCount: 2 },
    response: new Response(null, { status: 200 }),
  }),
  getApiV1Notifications: vi.fn().mockResolvedValue({
    data: { items: [], total: 0, unreadCount: 2 },
    response: new Response(null, { status: 200 }),
  }),
}));

describe("MarketplaceHeader", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  function renderHeader(dark = false) {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MarketplaceHeader dark={dark} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("renders Sign in and Sign up links when user is not authenticated", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: null,
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    renderHeader();

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /notifications/i })).not.toBeInTheDocument();
  });

  it("renders NotificationBell and UserMenu when candidate (user role) is authenticated", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "cand-1",
          email: "candidate@example.com",
          username: "candidate",
          role: "user",
          status: "active",
        },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    renderHeader();

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("renders UserMenu but omits NotificationBell when admin is authenticated", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "admin-1",
          email: "admin@example.com",
          username: "admin",
          role: "admin",
          status: "active",
        },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    renderHeader();

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /notifications/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
  });

  it("renders UserMenu but omits NotificationBell when recruiter is authenticated", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "recruiter-1",
          email: "recruiter@example.com",
          username: "recruiter",
          role: "recruiter",
          status: "active",
        },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    renderHeader();

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /notifications/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /recruiter/i })).toBeInTheDocument();
  });
});
