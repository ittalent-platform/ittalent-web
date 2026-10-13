import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewListResponse } from "@/api/generated/types.gen";
import { InterviewsPage } from "@/features/recruiter/interviews/interviews-page";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({ useInterviewList: vi.fn() }));

type Item = InterviewListResponse["items"][number];

const interview = (overrides: Partial<Item> = {}): Item => ({
  applicant: { email: "khoa.pham@gmail.com", fullName: "Phạm Minh Khoa", id: "a1" },
  applicationId: "app1",
  canComplete: false,
  createdAt: "2026-10-06T02:12:00.000Z",
  durationMinutes: 60,
  endsAt: "2026-10-15T04:00:00.000Z",
  id: "i1",
  interviewers: [],
  job: { id: "j1", title: "Backend Developer (Go)" },
  location: null,
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  mode: "online",
  notes: null,
  scheduledAt: "2026-10-15T03:00:00.000Z",
  status: "scheduled",
  updatedAt: "2026-10-06T02:12:00.000Z",
  ...overrides,
});

const page = (items: Item[], total = items.length): InterviewListResponse => ({ items, limit: 10, page: 1, total, totalPages: 1 });

function mockList(data: InterviewListResponse | undefined, extra: Record<string, unknown> = {}) {
  vi.mocked(interviewQueries.useInterviewList).mockReturnValue({
    data,
    isError: false,
    isPending: data === undefined,
    refetch: vi.fn(),
    ...extra,
  } as unknown as ReturnType<typeof interviewQueries.useInterviewList>);
}

const lastParams = () => vi.mocked(interviewQueries.useInterviewList).mock.lastCall?.[0];
const renderPage = (url = "/recruiter/interviews") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <InterviewsPage />
    </MemoryRouter>,
  );

describe("Recruiter interviews table", () => {
  beforeEach(() => {
    vi.mocked(interviewQueries.useInterviewList).mockReset();
    mockList(page([interview()]));
  });

  it("shows each interview with its applicant, job, Vietnam time, mode, link and status", () => {
    mockList(
      page([
        interview(),
        interview({ id: "i2", applicant: { email: "e@x.vn", fullName: "Lê Thu Trang", id: "a2" }, location: "12 Tôn Đản, Quận 4", meetingLink: null, mode: "onsite", status: "completed" }),
      ]),
    );
    renderPage();

    const row = screen.getByText("Phạm Minh Khoa").closest("tr")!;
    expect(within(row).getByText("Backend Developer (Go)")).toBeInTheDocument();
    expect(within(row).getByText("Thu, 15 Oct")).toBeInTheDocument();
    expect(within(row).getByText("10:00 – 11:00")).toBeInTheDocument();
    expect(within(row).getByText("Online")).toBeInTheDocument();
    expect(within(row).getByText("Scheduled")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "meet.google.com/kqr-pmzt-bvx" })).toHaveAttribute("href", "https://meet.google.com/kqr-pmzt-bvx");

    const onsite = screen.getByText("Lê Thu Trang").closest("tr")!;
    expect(within(onsite).getByText("12 Tôn Đản, Quận 4")).toBeInTheDocument();
    expect(within(onsite).getByText("Onsite")).toBeInTheDocument();
    expect(within(onsite).getByText("Completed")).toBeInTheDocument();
  });

  it("falls back to the email when the applicant has no name", () => {
    mockList(page([interview({ applicant: { email: "no.name@gmail.com", fullName: null, id: "a3" } })]));
    renderPage();
    expect(screen.getByText("no.name@gmail.com")).toBeInTheDocument();
  });

  it("says how many interviews the company has", () => {
    mockList(page([interview()], 10));
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Interviews" })).toBeInTheDocument();
    expect(screen.getByText("10 interviews · your company")).toBeInTheDocument();
  });

  it("asks for the first page of ten, earliest first, by default", () => {
    renderPage();
    expect(lastParams()).toEqual({ limit: 10, page: 1, sortBy: "scheduledAt", sortOrder: "asc" });
  });

  it("sends the status to the server and keeps it in the URL", async () => {
    renderPage("/recruiter/interviews?page=3");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Status:/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Completed" }));
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 1, status: "completed" }));
  });

  it("turns a date preset into a from / to window", async () => {
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Date:/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Today" }));
    await waitFor(() => expect(lastParams()).toHaveProperty("from"));
    expect(lastParams()).toHaveProperty("to");
  });

  it("searches the keyword once typing pauses", async () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search by applicant or job…"), { target: { value: "trang" } });
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 1, search: "trang" }));
  });

  it("does not search a keyword with unsafe characters and says why", () => {
    renderPage("/recruiter/interviews?search=%3Cscript%3E");
    expect(screen.getByText("Search keyword contains invalid characters. Please revise your input.")).toBeInTheDocument();
    expect(vi.mocked(interviewQueries.useInterviewList).mock.lastCall?.[1]).toEqual({ enabled: false });
  });

  it("flips the sort direction from the Date & time header", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Date & time/ }));
    await waitFor(() => expect(lastParams()).toMatchObject({ sortOrder: "desc" }));
  });

  it("shows loading rows while the first page is on its way", () => {
    mockList(undefined);
    renderPage();
    expect(screen.queryByText("No interviews yet")).not.toBeInTheDocument();
  });

  it("explains an empty company, and offers to clear filters when filters hide everything", async () => {
    mockList(page([]));
    renderPage();
    expect(screen.getByText("No interviews yet")).toBeInTheDocument();
  });

  it("keeps the keyword in the message and clears the filters from the empty state", async () => {
    mockList(page([]));
    renderPage("/recruiter/interviews?search=trang&status=completed");
    expect(screen.getByText("No results for “trang”")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(lastParams()).not.toHaveProperty("search"));
    expect(lastParams()).not.toHaveProperty("status");
  });

  it("shows a retry banner instead of a stale list when loading fails", () => {
    const refetch = vi.fn();
    mockList(undefined, { error: Object.assign(new Error("boom"), { status: 500 }), isError: true, isPending: false, refetch });
    renderPage();
    expect(screen.getByText("Could not load interviews. Please try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("tells a recruiter without access that nothing is shown", () => {
    mockList(undefined, { error: Object.assign(new Error("no company"), { status: 403 }), isError: true, isPending: false });
    renderPage();
    expect(screen.getByText("You no longer have access")).toBeInTheDocument();
  });
});
