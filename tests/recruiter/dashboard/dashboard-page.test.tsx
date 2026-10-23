import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as queries from "@/features/recruiter/dashboard/dashboard.queries";
import { DashboardPage } from "@/features/recruiter/dashboard/dashboard-page";

import { companyDashboard, emptyCompanyDashboard } from "./dashboard-fixtures";

type Result = ReturnType<typeof queries.useCompanyDashboard>;

const refetch = vi.fn();

function failure(status: number, code?: string) {
  return Object.assign(new Error("failed"), { code, status });
}

function mockResult(partial: Record<string, unknown>) {
  return vi.spyOn(queries, "useCompanyDashboard").mockReturnValue({ error: null, isError: false, isFetching: false, refetch, ...partial } as unknown as Result);
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderPage(entry = "/recruiter/dashboard") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route element={<DashboardPage />} path="/recruiter/dashboard" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refetch.mockReset();
  });

  it("shows the key numbers of the company with their wording", () => {
    mockResult({ data: companyDashboard() });
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Whole company · Nova Fintech/)).toBeInTheDocument();
    expect(screen.getByText(/dates in Ho Chi Minh City time \(UTC\+7\)/)).toBeInTheDocument();

    const kpis = screen.getByRole("region", { name: "Key numbers" });
    expect(within(kpis).getByText("Jobs posted").nextElementSibling).toHaveTextContent("9");
    expect(within(kpis).getByText("6 still open")).toBeInTheDocument();
    expect(within(kpis).getByText("Applications received").nextElementSibling).toHaveTextContent("128");
    expect(within(kpis).getByText("avg 4.3 a day")).toBeInTheDocument();
    expect(within(kpis).getByText("Interviews").nextElementSibling).toHaveTextContent("26");
    expect(within(kpis).getByText("12 completed")).toBeInTheDocument();
    expect(within(kpis).getByText("Hired").nextElementSibling).toHaveTextContent("5");
    expect(within(kpis).getByText("3.9% of applications")).toBeInTheDocument();
  });

  it("says in a tooltip exactly what the jobs and hired numbers count", () => {
    mockResult({ data: companyDashboard() });
    renderPage();

    const kpis = screen.getByRole("region", { name: "Key numbers" });
    expect(within(kpis).getByText("Jobs posted")).toHaveAttribute("title", expect.stringMatching(/created in this period/));
    expect(within(kpis).getByText("Hired")).toHaveAttribute("title", expect.stringMatching(/not the number of hiring decisions/));
  });

  it("splits the applications by current status and links each status to the matching list", () => {
    mockResult({ data: companyDashboard() });
    renderPage();

    const pipeline = screen.getByRole("region", { name: /Where this period/ });
    expect(within(pipeline).getByText("90")).toBeInTheDocument();
    expect(within(pipeline).getByText("still in progress")).toBeInTheDocument();
    expect(within(pipeline).getByText(/Rejected 24 · Withdrawn 7 · Position filled 2/)).toBeInTheDocument();

    const review = within(pipeline).getByRole("link", { name: /Under review/ });
    const params = new URL(review.getAttribute("href") ?? "", "http://localhost").searchParams;
    expect(review.getAttribute("href")).toMatch(/^\/recruiter\/applications\?/);
    expect(params.get("status")).toBe("under_review");
    expect(params.get("from")).toBe("2026-09-11");
    expect(params.get("to")).toBe("2026-10-10");

    const closed = within(pipeline).getByRole("link", { name: /Closed without hiring/ });
    expect(new URL(closed.getAttribute("href") ?? "", "http://localhost").searchParams.get("status")).toBe("rejected,withdrawn,position_filled");
    expect(within(pipeline).getByRole("link", { name: "Open Applications" })).toHaveAttribute("href", "/recruiter/applications");
  });

  it("charts applications per week and offers the same numbers as a table", async () => {
    const user = userEvent.setup();
    mockResult({ data: companyDashboard() });
    renderPage();

    const weekly = screen.getByRole("region", { name: "Applications received per week" });
    expect(within(weekly).getByRole("img", { name: "Applications received per week" })).toBeInTheDocument();
    expect(within(weekly).getByText("Weekly avg 29")).toBeInTheDocument();

    await user.click(within(weekly).getByRole("button", { name: "View as table" }));
    const table = within(weekly).getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(6);
    expect(within(rows[1] as HTMLElement).getByText("22")).toBeInTheDocument();
    expect(within(rows[5] as HTMLElement).getByText(/partial week \(2 days\)/)).toBeInTheDocument();
    await user.click(within(weekly).getByRole("button", { name: "View as chart" }));
    expect(within(weekly).queryByRole("table")).not.toBeInTheDocument();
  });

  it("names the busiest weekday for interviews", () => {
    mockResult({ data: companyDashboard() });
    renderPage();

    const heatmap = screen.getByRole("region", { name: "When interviews happen" });
    expect(within(heatmap).getByText("Fridays")).toBeInTheDocument();
    expect(within(heatmap).getByRole("link", { name: "Open Interviews" })).toHaveAttribute("href", "/recruiter/interviews");
  });

  it("lists interviews and jobs by their current status", () => {
    mockResult({ data: companyDashboard() });
    renderPage();

    const interviews = screen.getByRole("region", { name: "Interviews by status now" });
    for (const label of ["Scheduled", "Completed", "New time requested", "No-show", "Cancelled"]) {
      expect(within(interviews).getByText(label)).toBeInTheDocument();
    }
    expect(within(interviews).getByText(/46% completed/)).toBeInTheDocument();

    const jobs = screen.getByRole("region", { name: "Jobs posted" });
    expect(within(jobs).getByText("6/9")).toBeInTheDocument();
    for (const label of ["Open", "Closed", "Draft", "Archived"]) {
      expect(within(jobs).getByText(label)).toBeInTheDocument();
    }
  });

  it("ranks the jobs with the most applications and links each to its posting", () => {
    mockResult({ data: companyDashboard() });
    renderPage();

    const top = screen.getByRole("region", { name: "Jobs with the most applications" });
    const rows = within(top).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(5);
    expect(within(rows[0] as HTMLElement).getByRole("link", { name: "Senior Backend Engineer (Go)" })).toHaveAttribute("href", "/recruiter/job-postings/job-1");
    expect(within(rows[0] as HTMLElement).getByText("34")).toBeInTheDocument();
    expect(within(rows[4] as HTMLElement).getByRole("link", { name: "QA Automation Engineer" })).toBeInTheDocument();
  });

  it("shows only loading shapes, and no numbers, until the whole set has arrived", () => {
    mockResult({ data: undefined });
    renderPage();

    expect(screen.getByRole("status", { name: "Loading statistics" })).toBeInTheDocument();
    expect(screen.queryByText("128")).not.toBeInTheDocument();
  });

  it("says nothing loaded, and retries on request, when the request fails", async () => {
    const user = userEvent.setup();
    mockResult({ data: undefined, error: failure(500), isError: true });
    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("Statistics didn’t load");
    expect(screen.queryByText("128")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["DASHBOARD_NOT_A_MEMBER", "You’re no longer a member of a company"],
    ["DASHBOARD_COMPANY_NOT_ACTIVE", "Dashboard isn’t available"],
    [undefined, "You don’t have access"],
  ])("explains a refusal (%s) in its own words and offers no retry", (code, title) => {
    mockResult({ data: undefined, error: failure(403, code), isError: true });
    renderPage();

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("shows real zeros and says why when nothing happened in the period", () => {
    mockResult({ data: emptyCompanyDashboard({ days: 7, from: "2026-10-04", range: "custom", to: "2026-10-10" }) });
    renderPage("/recruiter/dashboard?range=custom&from=2026-10-04&to=2026-10-10");

    expect(screen.getByText(/Nothing was posted, received or scheduled in/)).toBeInTheDocument();
    expect(screen.getAllByText("none in this period")).toHaveLength(4);
    expect(screen.queryByRole("region", { name: /Where this period/ })).not.toBeInTheDocument();
  });

  it("says a period that has not started has only zeros", () => {
    mockResult({ data: emptyCompanyDashboard({ days: 7, from: "2099-01-01", range: "custom", to: "2099-01-07" }) });
    renderPage("/recruiter/dashboard?range=custom&from=2099-01-01&to=2099-01-07");

    expect(screen.getByText("This period hasn’t started yet, so every count is 0.")).toBeInTheDocument();
  });

  it("keeps the old numbers, labelled, while a new period loads", () => {
    mockResult({ data: companyDashboard(), isFetching: true });
    renderPage();

    expect(screen.getByText(/Updating… numbers shown are from 10:42/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Key numbers" })).toBeInTheDocument();
  });

  it("names the chosen period on the button at once, while the old numbers stay", () => {
    mockResult({ data: companyDashboard(), isFetching: true, isPlaceholderData: true });
    renderPage("/recruiter/dashboard?range=last_7_days");

    expect(screen.getByRole("button", { name: "Time period" })).toHaveTextContent("Last 7 days");
    expect(screen.getByRole("button", { name: "Time period" })).not.toHaveTextContent("Last 30 days");
    expect(screen.getByText(/Updating… numbers shown are from 10:42/)).toBeInTheDocument();
  });

  it("refreshes on request", async () => {
    const user = userEvent.setup();
    mockResult({ data: companyDashboard() });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  describe("time filter", () => {
    it("asks for the last 30 days at first", () => {
      const spy = mockResult({ data: companyDashboard() });
      renderPage();

      expect(spy).toHaveBeenLastCalledWith({ range: "last_30_days" });
      expect(screen.getByRole("button", { name: "Time period" })).toHaveTextContent("Last 30 days");
    });

    it("lists the presets with their days, marks the current one and asks for the one chosen", async () => {
      const user = userEvent.setup();
      const spy = mockResult({ data: companyDashboard() });
      renderPage();

      await user.click(screen.getByRole("button", { name: "Time period" }));
      const menu = screen.getByRole("group", { name: "Time period" });
      expect(within(menu).getByRole("button", { name: /Last 30 days/ })).toHaveAttribute("aria-pressed", "true");
      expect(within(menu).getByRole("button", { name: /Last 7 days/ })).toHaveAttribute("aria-pressed", "false");
      expect(within(menu).getByRole("button", { name: /This month/ })).toBeInTheDocument();
      expect(within(menu).getByRole("button", { name: /Custom range…/ })).toBeInTheDocument();

      await user.click(within(menu).getByRole("button", { name: /Last 7 days/ }));
      expect(spy).toHaveBeenLastCalledWith({ range: "last_7_days" });
      expect(screen.getByTestId("location")).toHaveTextContent("/recruiter/dashboard?range=last_7_days");
      expect(screen.queryByRole("group", { name: "Time period" })).not.toBeInTheDocument();
    });

    it("keeps the address clean for the default period", async () => {
      const user = userEvent.setup();
      mockResult({ data: companyDashboard() });
      renderPage("/recruiter/dashboard?range=last_90_days");

      await user.click(screen.getByRole("button", { name: "Time period" }));
      await user.click(screen.getByRole("button", { name: /Last 30 days/ }));
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/recruiter\/dashboard$/);
    });

    it("restores the period from a link", () => {
      const spy = mockResult({ data: companyDashboard() });
      renderPage("/recruiter/dashboard?range=custom&from=2026-10-04&to=2026-10-10");

      expect(spy).toHaveBeenLastCalledWith({ from: "2026-10-04", range: "custom", to: "2026-10-10" });
    });

    it("falls back to the default period, and says so, for dates it cannot use", () => {
      const spy = mockResult({ data: companyDashboard() });
      renderPage("/recruiter/dashboard?range=custom&from=2026-10-10&to=2026-10-04");

      expect(spy).toHaveBeenLastCalledWith({ range: "last_30_days" });
      expect(screen.getByText("That link has dates we can’t use")).toBeInTheDocument();
    });

    it("refuses a time zone other than Ho Chi Minh City", () => {
      const spy = mockResult({ data: companyDashboard() });
      renderPage("/recruiter/dashboard?tz=America/New_York");

      expect(spy).toHaveBeenLastCalledWith({ range: "last_30_days" });
      expect(screen.getByText("That link uses a time zone we can’t apply")).toBeInTheDocument();
    });

    it("never asks for another company, whatever the link carries", () => {
      const spy = mockResult({ data: companyDashboard() });
      renderPage("/recruiter/dashboard?companyId=someone-else");

      expect(spy).toHaveBeenLastCalledWith({ range: "last_30_days" });
      expect(screen.getByText("Showing Nova Fintech. Other companies’ numbers are never shown.")).toBeInTheDocument();
    });
  });
});
