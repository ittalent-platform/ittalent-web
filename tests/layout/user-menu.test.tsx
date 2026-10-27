import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/layout/user-menu";
import * as useSessionModule from "@/auth/use-session";

vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("UserMenu job posting navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["recruiter", "Recruiter"],
    ["enterprise_admin", "Enterprise admin"],
  ])(
    "shows the shared job posting entry for %s",
    async (role, roleLabel) => {
      vi.spyOn(useSessionModule, "useSession").mockReturnValue({
        data: {
          user: {
            id: "manager-1",
            email: `${role}@example.com`,
            username: role,
            role,
            status: "active",
          },
        },
        isPending: false,
        logout: vi.fn(),
        refetch: vi.fn(),
      });
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <UserMenu />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByText(roleLabel)).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: `Account menu, ${role}` }),
      );
      expect(
        await screen.findByRole("menuitem", { name: "Job postings" }),
      ).toBeInTheDocument();
    },
    15000,
  );

  it("shows saved jobs navigation entry for candidate (user role) and navigates to /saved-jobs", async () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "candidate-1",
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
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();

    function LocationDisplay() {
      const location = useLocation();
      return <div data-testid="location-display">{location.pathname}</div>;
    }

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/"]}>
          <UserMenu />
          <LocationDisplay />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Account menu, candidate" }),
    );
    const savedJobsItem = await screen.findByRole("menuitem", {
      name: "Saved jobs",
    });
    expect(savedJobsItem).toBeInTheDocument();
    await user.click(savedJobsItem);

    expect(screen.getByTestId("location-display")).toHaveTextContent(
      "/saved-jobs",
    );
  });
});
