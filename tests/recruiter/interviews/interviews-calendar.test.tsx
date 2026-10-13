import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewCalendarResponse, InterviewListResponse } from "@/api/generated/types.gen";
import { InterviewsPage } from "@/features/recruiter/interviews/interviews-page";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({
  useInterviewCalendar: vi.fn(),
  useInterviewList: vi.fn(),
  useUpdateInterview: () => ({ isPending: false, mutate: vi.fn() }),
  useUpdateInterviewStatus: () => ({ isPending: false, mutate: vi.fn() }),
  useFindInterviewerByEmail: () => vi.fn(),
  useInterviewerSearch: () => ({ data: { items: [] } }),
}));
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ dismissToast: vi.fn(), showToast: vi.fn() }) }));

type Item = InterviewCalendarResponse["items"][number];

const interview = (id: string, overrides: Partial<Item> = {}): Item => ({
  applicant: { email: `${id}@gmail.com`, fullName: `Applicant ${id}`, id: `a-${id}` },
  applicationId: `app-${id}`,
  canComplete: false,
  createdAt: "2026-10-06T02:12:00.000Z",
  durationMinutes: 60,
  endsAt: "2026-10-15T04:00:00.000Z",
  id,
  interviewers: [
    { email: "nam.bui@novafintech.vn", fullName: "Nam Bùi", id: "u-nam" },
    { email: "tran.b@novafintech.vn", fullName: null, id: "u-tran" },
  ],
  job: { id: "j1", title: `Job ${id}` },
  location: null,
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  mode: "online",
  notes: null,
  scheduledAt: "2026-10-15T03:00:00.000Z",
  status: "scheduled",
  updatedAt: "2026-10-06T02:12:00.000Z",
  ...overrides,
});

const response = (items: Item[], extra: Partial<InterviewCalendarResponse> = {}): InterviewCalendarResponse => ({
  from: "2026-09-26T17:00:00.000Z",
  items,
  to: "2026-10-31T16:59:59.999Z",
  total: items.length,
  truncated: false,
  ...extra,
});

function mockCalendar(data: InterviewCalendarResponse | undefined, extra: Record<string, unknown> = {}) {
  vi.mocked(interviewQueries.useInterviewCalendar).mockReturnValue({
    data,
    isError: false,
    isPending: data === undefined,
    refetch: vi.fn(),
    ...extra,
  } as unknown as ReturnType<typeof interviewQueries.useInterviewCalendar>);
}

const lastParams = () => vi.mocked(interviewQueries.useInterviewCalendar).mock.lastCall?.[0];

function Where() {
  const location = useLocation();
  return <output data-testid="where">{`${location.pathname}${location.search}`}</output>;
}

const renderPage = (url = "/recruiter/interviews?view=calendar&month=2026-10") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <InterviewsPage />
      <Where />
    </MemoryRouter>,
  );

describe("Recruiter interviews calendar", () => {
  beforeEach(() => {
    vi.mocked(interviewQueries.useInterviewCalendar).mockReset();
    vi.mocked(interviewQueries.useInterviewList).mockReset();
    vi.mocked(interviewQueries.useInterviewList).mockReturnValue({
      data: { items: [], limit: 10, page: 1, total: 0, totalPages: 1 } satisfies InterviewListResponse,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof interviewQueries.useInterviewList>);
    mockCalendar(response([interview("khoa")]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for the whole grid of the month in the address", () => {
    renderPage();
    expect(lastParams()).toEqual({ from: "2026-09-26T17:00:00.000Z", to: "2026-10-31T16:59:59.999Z" });
    expect(screen.getByRole("heading", { level: 2, name: "October 2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((node) => node.textContent)).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });

  it("shows each interview on its day with the time, the applicant and the job", () => {
    renderPage();
    const day = document.querySelector("[data-day='2026-10-15']") as HTMLElement;
    expect(within(day).getByText("10:00 · Applicant khoa")).toBeInTheDocument();
    expect(within(day).getByText("Job khoa")).toBeInTheDocument();
  });

  it("counts only the interviews of the month itself", () => {
    mockCalendar(response([interview("in"), interview("before", { scheduledAt: "2026-09-30T04:00:00.000Z" })]));
    renderPage();
    expect(screen.getByText("1 interview in October · your company")).toBeInTheDocument();
  });

  it("strikes the name of a cancelled interview", () => {
    mockCalendar(response([interview("gone", { status: "cancelled" })]));
    renderPage();
    expect(screen.getByText("10:00 · Applicant gone")).toHaveClass("line-through");
  });

  it("opens a summary of the interview from its chip", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("10:00 · Applicant khoa"));
    expect(await screen.findByText("Thu, 15 Oct 2026 · 10:00 – 11:00 (1h)")).toBeInTheDocument();
    expect(screen.getByText("meet.google.com/kqr-pmzt-bvx")).toBeInTheDocument();
    expect(screen.getByText("nam.bui@novafintech.vn, tran.b@novafintech.vn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", "/recruiter/interviews/khoa");
  });

  it("cancels from the summary: the summary closes and the confirmation opens", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("10:00 · Applicant khoa"));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("alertdialog", { name: "Cancel interview with Applicant khoa?" })).toBeInTheDocument();
    expect(screen.queryByText("Thu, 15 Oct 2026 · 10:00 – 11:00 (1h)")).not.toBeInTheDocument();
  });

  it("offers no cancel on the summary of an interview that is no longer scheduled", async () => {
    mockCalendar(response([interview("done", { status: "completed" })]));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("10:00 · Applicant done"));
    expect(await screen.findByRole("link", { name: "View details" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
  });

  it("offers to edit and reschedule from the summary of an upcoming interview", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("10:00 · Applicant khoa"));
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("dialog", { name: "Edit interview" })).toBeInTheDocument();
    expect(screen.queryByText("Thu, 15 Oct 2026 · 10:00 – 11:00 (1h)")).not.toBeInTheDocument();
  });

  it("opens the reschedule dialog from the summary", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("10:00 · Applicant khoa"));
    await user.click(await screen.findByRole("button", { name: "Reschedule" }));
    expect(await screen.findByRole("dialog", { name: "Reschedule interview" })).toBeInTheDocument();
  });

  it("offers an ended interview to be edited but not rescheduled from the summary", async () => {
    mockCalendar(response([interview("over", { canComplete: true })]));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("10:00 · Applicant over"));
    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
  });

  it("shows three interviews of a day and lists the rest in a dialog", async () => {
    const day = (id: string, hour: string) => interview(id, { scheduledAt: `2026-10-15T0${hour}:00:00.000Z` });
    mockCalendar(response([day("a", "1"), day("b", "2"), day("c", "3"), day("d", "4")]));
    const user = userEvent.setup();
    renderPage();
    const cell = document.querySelector("[data-day='2026-10-15']") as HTMLElement;
    expect(within(cell).queryByText(/Applicant d/)).not.toBeInTheDocument();
    await user.click(within(cell).getByRole("button", { name: "+1 more" }));
    const dialog = await screen.findByRole("dialog", { name: "Thursday, October 15" });
    expect(within(dialog).getByText("4 interviews")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("link")).toHaveLength(4);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("moves to the next and the previous month through the address", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByTestId("where")).toHaveTextContent("month=2026-11");
    expect(lastParams()).toMatchObject({ from: "2026-10-31T17:00:00.000Z" });
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByTestId("where")).toHaveTextContent("month=2026-09");
  });

  it("goes back to the current month with Today, and leaves it out of the address", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-08T03:00:00.000Z"), toFake: ["Date"] });
    const user = userEvent.setup();
    renderPage("/recruiter/interviews?view=calendar&month=2027-02");
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByTestId("where").textContent).not.toContain("month=");
    expect(screen.getByRole("heading", { level: 2, name: "October 2026" })).toBeInTheDocument();
  });

  it("marks today in Vietnam time", () => {
    vi.useFakeTimers({ now: new Date("2026-10-08T18:30:00.000Z"), toFake: ["Date"] });
    renderPage();
    const marked = document.querySelector("[data-day='2026-10-09'] span.bg-primary");
    expect(marked).toHaveTextContent("9");
  });

  it("sends the keyword and the status, and offers no date filter", async () => {
    const user = userEvent.setup();
    renderPage("/recruiter/interviews?view=calendar&month=2026-10&search=trang&status=completed");
    expect(lastParams()).toMatchObject({ search: "trang", status: "completed" });
    expect(screen.queryByRole("button", { name: /Date:/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Status:/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Cancelled" }));
    await waitFor(() => expect(lastParams()).toMatchObject({ status: "cancelled" }));
  });

  it("chooses what the chips say, and keeps at least one field", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Fields" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Job" }));
    expect(screen.queryByText("Job khoa")).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Time" }));
    expect(screen.getByText("Applicant khoa")).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Applicant" })).toHaveAttribute("aria-disabled", "true");
  });

  it("switches to the table and back, keeping the keyword", async () => {
    const user = userEvent.setup();
    renderPage("/recruiter/interviews?view=calendar&month=2026-10&search=trang");
    await user.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/recruiter/interviews?month=2026-10&search=trang");
    expect(interviewQueries.useInterviewList).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByTestId("where")).toHaveTextContent("view=calendar");
  });

  it("warns when more interviews matched than the calendar can hold", () => {
    mockCalendar(response([interview("khoa")], { truncated: true }));
    renderPage();
    expect(screen.getByText("Showing the first 1 interviews of this month. Narrow the search or the status to see the rest.")).toBeInTheDocument();
  });

  it("fades the grid while the month loads", () => {
    mockCalendar(undefined);
    renderPage();
    expect(document.querySelector("[aria-busy=true]")).toBeInTheDocument();
  });

  it("does not ask for a keyword with unsafe characters and says why", () => {
    renderPage("/recruiter/interviews?view=calendar&month=2026-10&search=%3Cscript%3E");
    expect(screen.getByText("Search keyword contains invalid characters. Please revise your input.")).toBeInTheDocument();
    expect(vi.mocked(interviewQueries.useInterviewCalendar).mock.lastCall?.[1]).toEqual({ enabled: false });
  });

  it("shows a retry banner when loading fails, and the no-access message for a recruiter without a company", async () => {
    const refetch = vi.fn();
    mockCalendar(undefined, { error: Object.assign(new Error("boom"), { status: 500 }), isError: true, isPending: false, refetch });
    const user = userEvent.setup();
    const { unmount } = renderPage();
    expect(screen.getByText("Could not load interviews. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
    unmount();

    mockCalendar(undefined, { error: Object.assign(new Error("no company"), { status: 403 }), isError: true, isPending: false });
    renderPage();
    expect(screen.getByText("You no longer have access")).toBeInTheDocument();
  });
});
