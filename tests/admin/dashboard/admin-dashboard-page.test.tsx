import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as queries from "@/features/admin/dashboard/admin-dashboard.queries";
import { AdminDashboardPage } from "@/features/admin/dashboard/admin-dashboard-page";

import { platformOverview } from "../../recruiter/dashboard/dashboard-fixtures";

type Result = ReturnType<typeof queries.usePlatformOverview>;

const refetch = vi.fn();

function failure(status: number) {
  return Object.assign(new Error("failed"), { status });
}

function mockResult(partial: Record<string, unknown>) {
  return vi.spyOn(queries, "usePlatformOverview").mockReturnValue({ error: null, isError: false, isFetching: false, refetch, ...partial } as unknown as Result);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  );
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refetch.mockReset();
  });

  it("shows the size of the platform and what waits for a decision", () => {
    mockResult({ data: platformOverview() });
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText(/company hiring data isn’t shown here/)).toBeInTheDocument();

    const kpis = screen.getByRole("region", { name: "Platform numbers" });
    expect(within(kpis).getByText("Accounts").nextElementSibling).toHaveTextContent("2,116");
    expect(within(kpis).getByText("+64 in the last 30 days")).toBeInTheDocument();
    expect(within(kpis).getByText("Active companies").nextElementSibling).toHaveTextContent("58");
    expect(within(kpis).getByText("of 61 approved · 3 suspended")).toBeInTheDocument();
    expect(within(kpis).getByText("Companies waiting for review").nextElementSibling).toHaveTextContent("2");
    expect(within(kpis).getByText("oldest waiting 5 days")).toBeInTheDocument();
  });

  it("splits the accounts by role and by status", () => {
    mockResult({ data: platformOverview() });
    renderPage();

    const roles = screen.getByRole("region", { name: "Accounts by role" });
    expect(within(roles).getByText("Candidates").closest("li")).toHaveTextContent("1,840");
    expect(within(roles).getByText("HR").closest("li")).toHaveTextContent("212");
    expect(within(roles).getByText("Enterprise admins").closest("li")).toHaveTextContent("64");
    expect(within(roles).getByText(/Suspended/)).toHaveTextContent("27");
    expect(within(roles).getByText(/Invited/)).toHaveTextContent("48");
  });

  it("lists the inactive accounts only when there are some", () => {
    mockResult({ data: platformOverview() });
    const { unmount } = renderPage();
    expect(within(screen.getByRole("region", { name: "Accounts by role" })).queryByText(/Inactive/)).not.toBeInTheDocument();
    unmount();

    const base = platformOverview();
    mockResult({ data: { ...base, accounts: { ...base.accounts, byStatus: { ...base.accounts.byStatus, inactive: 5 } } } });
    renderPage();
    expect(within(screen.getByRole("region", { name: "Accounts by role" })).getByText(/Inactive/)).toHaveTextContent("5");
  });

  it("charts new accounts per week and links to the users list", () => {
    mockResult({ data: platformOverview() });
    renderPage();

    const weekly = screen.getByRole("region", { name: "New accounts per week" });
    expect(within(weekly).getByRole("img", { name: "New accounts per week" })).toBeInTheDocument();
    expect(within(weekly).getByRole("link", { name: "Open Users" })).toHaveAttribute("href", "/admin/users");
  });

  it("lists the companies waiting, each opening its review", () => {
    mockResult({ data: platformOverview() });
    renderPage();

    const waiting = screen.getByRole("region", { name: "Waiting for review" });
    const first = within(waiting).getByRole("link", { name: /Pixel Labs/ });
    expect(first).toHaveAttribute("href", "/admin/registrations/reg-1");
    expect(first).toHaveTextContent("5 days");
    expect(within(waiting).getByRole("link", { name: /Kite Health/ })).toHaveTextContent("1 day");
    expect(within(waiting).getByRole("link", { name: "View all" })).toHaveAttribute("href", "/admin/registrations");
  });

  it("says plainly when nothing waits", () => {
    mockResult({
      data: platformOverview({
        companies: { active: 58, approved: 61, oldestWaitingDays: null, suspended: 3, waitingForReview: 0 },
        waitingForReview: [],
      }),
    });
    renderPage();

    expect(screen.getByText("nothing is waiting")).toBeInTheDocument();
    expect(screen.getByText("Nothing is waiting for review.")).toBeInTheDocument();
  });

  it("never shows a company's hiring numbers", () => {
    mockResult({ data: platformOverview() });
    renderPage();

    for (const text of [/Applications received/, /Interviews/, /Jobs posted/, /Hired/]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });

  it("shows loading shapes and no numbers until everything has arrived", () => {
    mockResult({ data: undefined });
    renderPage();

    expect(screen.getByRole("status", { name: "Loading statistics" })).toBeInTheDocument();
    expect(screen.queryByText("2,116")).not.toBeInTheDocument();
  });

  it("offers a retry when the request fails", async () => {
    const user = userEvent.setup();
    mockResult({ data: undefined, error: failure(500), isError: true });
    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("The overview didn’t load");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("explains a refusal and offers no retry", () => {
    mockResult({ data: undefined, error: failure(403), isError: true });
    renderPage();

    expect(screen.getByRole("heading", { name: "You don’t have access" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
