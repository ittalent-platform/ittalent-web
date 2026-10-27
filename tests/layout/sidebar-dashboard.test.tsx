import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as useSessionModule from "@/auth/use-session";
import { Sidebar } from "@/components/layout/sidebar";
import * as registrationQueries from "@/features/enterprise-registration/enterprise-registration.queries";

vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderSidebar(actor: "admin" | "recruiter", path: string) {
  vi.spyOn(useSessionModule, "useSession").mockReturnValue({
    data: { user: { email: "someone@example.com", id: "user-1", role: actor === "admin" ? "admin" : "recruiter", status: "active", username: "someone" } },
    isPending: false,
    logout: vi.fn(),
    refetch: vi.fn(),
  });
  vi.spyOn(registrationQueries, "useEnterpriseRegistrationsListQuery").mockReturnValue({ data: undefined } as unknown as ReturnType<typeof registrationQueries.useEnterpriseRegistrationsListQuery>);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Sidebar actor={actor} collapsed={false} mobileOpen={false} onCloseMobile={vi.fn()} onToggleCollapsed={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Sidebar dashboard entry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("puts the company dashboard first for HR and enterprise admins", () => {
    renderSidebar("recruiter", "/recruiter/dashboard");

    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[0]).toHaveAttribute("href", "/recruiter/dashboard");
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });

  it("puts the platform overview first for system admins", () => {
    renderSidebar("admin", "/admin/dashboard");

    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[0]).toHaveAttribute("href", "/admin/dashboard");
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });

  it("does not mark the dashboard as current on another page", () => {
    renderSidebar("recruiter", "/recruiter/applications");

    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});
