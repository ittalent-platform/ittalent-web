import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminUserHistoryPage } from "@/features/admin/users/user-history-page";
import { historyChips, validateHistoryRange } from "@/features/admin/users/user-history";
import * as queries from "@/features/admin/users/users.queries";

const subject = { email: "a@x.vn", fullName: "Ann Lee", id: "u1", username: "ann" };
const event = (id: string, over: Record<string, unknown> = {}) => ({ action: "profile_updated", actorId: "admin-1", changes: null, id, occurredAt: "2026-03-01T03:00:00Z", reason: null, result: "success", version: 1, ...over });

function Probe() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function setup(feed: Record<string, unknown>, path = "/admin/users/u1/history") {
  vi.spyOn(queries, "useUserDetailQuery").mockReturnValue({ data: subject, isLoading: false } as never);
  const spy = vi.spyOn(queries, "useUserHistoryFeedQuery").mockReturnValue({ fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), ...feed } as never);
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={<><AdminUserHistoryPage /><Probe /></>} path="/admin/users/:userId/history" /></Routes>
    </MemoryRouter>,
  );
  return spy;
}

const pages = (items: unknown[], total = items.length) => ({ data: { pages: [{ items, limit: 10, page: 1, total, totalPages: 1 }] }, isError: false, isLoading: false });

afterEach(() => vi.restoreAllMocks());

describe("validateHistoryRange", () => {
  it("accepts open or ordered ranges up to 12 months and rejects the rest", () => {
    expect(validateHistoryRange("2026-01-01", "")).toBeNull();
    expect(validateHistoryRange("2026-01-01", "2026-01-01")).toBeNull();
    expect(validateHistoryRange("2026-01-01", "2027-01-01")).toBeNull();
    expect(validateHistoryRange("2026-02-01", "2026-01-01")).toBe("order");
    expect(validateHistoryRange("2026-01-01", "2027-01-02")).toBe("span");
  });
});

describe("historyChips", () => {
  it("pairs previous values and keeps masked values as sent", () => {
    expect(historyChips({ previousRole: "recruiter", role: "enterprise_admin", fullName: "N*** L**" })).toEqual([
      { after: "enterprise_admin", before: "recruiter", field: "role" },
      { after: "N*** L**", field: "fullName" },
    ]);
    expect(historyChips(null)).toEqual([]);
  });
});

describe("AdminUserHistoryPage", () => {
  it("groups events by day with actor, verb, ICT time, diff chips and reason", () => {
    setup(pages([
      event("1", { action: "role_changed", changes: { previousRole: "recruiter", role: "enterprise_admin" }, occurredAt: "2026-03-01T03:00:00Z", reason: "Promoted after review" }),
      event("2", { action: "profile_updated", actorId: "u1", changes: { fullName: "A** L**" }, occurredAt: "2026-02-20T17:30:00Z" }),
    ], 23));

    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("Administrator", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/changed the role/)).toBeInTheDocument();
    expect(screen.getByText(/Role: HR|Role: recruiter → enterprise_admin/)).toBeInTheDocument();
    expect(screen.getByText("Promoted after review", { exact: false })).toHaveTextContent("Reason: Promoted after review");
    expect(screen.getByText(/Full name: A\*\* L\*\*/)).toBeInTheDocument();
    expect(screen.getByText("This user", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("00:30")).toBeInTheDocument();
    expect(screen.getByText("Showing 2 of 23 events")).toBeInTheDocument();
  });

  it("loads older events on demand instead of paging", async () => {
    const fetchNextPage = vi.fn();
    setup({ ...pages([event("1")], 23), fetchNextPage, hasNextPage: true });

    await userEvent.setup().click(screen.getByRole("button", { name: "Show older events" }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /next page/i })).not.toBeInTheDocument();
  });

  it("sends group, actor and dates from the URL and writes them back when filters change", async () => {
    const spy = setup(pages([event("1")]), "/admin/users/u1/history?group=email&actor=self&from=2026-01-01&to=2026-02-01");
    expect(spy).toHaveBeenLastCalledWith("u1", { actor: "self", from: "2026-01-01", group: ["email"], to: "2026-02-01" }, true);

    await userEvent.setup().click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });

  it("shows every event type checked, and sends the checked ones as a group array", async () => {
    const spy = setup(pages([event("1")]));
    const events = userEvent.setup();
    for (const name of ["Account and status", "Personal information", "Email and invitation"]) expect(screen.getByRole("checkbox", { name })).toBeChecked();
    expect(spy).toHaveBeenLastCalledWith("u1", expect.objectContaining({ group: undefined }), true);

    await events.click(screen.getByRole("checkbox", { name: "Account and status" }));
    expect(screen.getByTestId("search")).toHaveTextContent("group=profile%2Cemail");
    expect(spy).toHaveBeenLastCalledWith("u1", expect.objectContaining({ group: ["profile", "email"] }), true);

    await events.click(screen.getByRole("checkbox", { name: "Account and status" }));
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });

  it("treats no event type checked as no filter", () => {
    const spy = setup(pages([event("1")]), "/admin/users/u1/history?group=");
    expect(spy).toHaveBeenLastCalledWith("u1", expect.objectContaining({ group: undefined }), true);
  });

  it("filters by who did it with radios", async () => {
    const spy = setup(pages([event("1")]));
    expect(screen.getByRole("radio", { name: "Anyone" })).toBeChecked();
    await userEvent.setup().click(screen.getByRole("radio", { name: "Administrators" }));
    expect(screen.getByTestId("search")).toHaveTextContent("actor=admin");
    expect(spy).toHaveBeenLastCalledWith("u1", expect.objectContaining({ actor: "admin" }), true);
  });

  it("puts every day in one card: bold day name + date, avatar rows without boxes, connectors between rows of a day, footer inside", () => {
    setup({ ...pages([
      event("1", { occurredAt: "2026-03-02T03:00:00Z" }),
      event("2", { actorId: "u1", occurredAt: "2026-03-01T04:00:00Z" }),
      event("3", { occurredAt: "2026-03-01T03:00:00Z" }),
    ], 9), hasNextPage: true });

    const card = screen.getByTestId("history-card");
    expect(screen.getAllByTestId("history-card")).toHaveLength(1);
    expect(within(card).getByRole("region", { name: "Monday 2 Mar 2026" })).toBeInTheDocument();
    expect(within(card).getByRole("region", { name: "Sunday 1 Mar 2026" })).toBeInTheDocument();
    expect(within(card).getByText("Sunday", { selector: "strong" })).toBeInTheDocument();
    expect(within(card).getAllByRole("listitem").filter((item) => item.className.includes("border"))).toHaveLength(0);
    expect(within(card).getByText("AL")).toBeInTheDocument(); // This user: the account's own initials
    expect(within(card).getAllByText("A")).toHaveLength(2); // Administrator
    expect(within(card).getAllByTestId("history-connector")).toHaveLength(1); // only between the two rows of the same day
    expect(within(card).getByText("Showing 3 of 9 events")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Show older events" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /search events/i })).not.toBeInTheDocument();
  });

  it("does not query and explains an invalid range", () => {
    const spy = setup(pages([]), "/admin/users/u1/history?from=2026-02-01&to=2026-01-01");
    expect(screen.getByText("'To' must be on or after 'From'.")).toBeInTheDocument();
    expect(spy).toHaveBeenLastCalledWith("u1", expect.anything(), false);

    expect(screen.getByText("Fix the date range to see events.")).toBeInTheDocument();
  });

  it("flags a range over 12 months", () => {
    setup(pages([]), "/admin/users/u1/history?from=2025-01-01&to=2026-06-01");
    expect(screen.getByText("The range can't be longer than 12 months.")).toBeInTheDocument();
  });

  it("shows the empty, loading and store failure states", () => {
    const refetch = vi.fn();
    setup({ data: undefined, isError: true, isLoading: false, refetch });
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
    expect(screen.getByText("History unavailable")).toBeInTheDocument();
  });

  it("explains an empty history", () => {
    setup(pages([]));
    expect(screen.getByText("No history yet")).toBeInTheDocument();
  });

  it("shows loading", () => {
    setup({ data: undefined, isError: false, isLoading: true });
    expect(screen.queryByText("No history yet")).not.toBeInTheDocument();
  });
});
