import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewCalendarResponse, InterviewListResponse } from "@/api/generated/types.gen";
import { InterviewsPage } from "@/features/recruiter/interviews/interviews-page";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({
  useInterviewCalendar: vi.fn(),
  useInterviewList: vi.fn(),
  useUpdateInterviewStatus: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ dismissToast: vi.fn(), showToast: vi.fn() }) }));
// The dialog has its own tests; here it only shows that it opened, and on which day.
vi.mock("@/features/recruiter/interviews/schedule-interview-dialog", () => ({
  ScheduleInterviewDialog: ({ initialDate, onClose }: { initialDate?: string; onClose: () => void }) => (
    <div aria-label="Schedule interview" role="dialog">
      <output data-testid="initial-date">{initialDate ?? "none"}</output>
      <button onClick={onClose} type="button">
        Close stub
      </button>
    </div>
  ),
}));

const emptyList: InterviewListResponse = { items: [], limit: 10, page: 1, total: 0, totalPages: 1 };
const calendar = (items: InterviewCalendarResponse["items"] = []): InterviewCalendarResponse => ({
  from: "2026-09-26T17:00:00.000Z",
  items,
  to: "2026-10-31T16:59:59.999Z",
  total: items.length,
  truncated: false,
});

function mockQueries(options: { calendarItems?: InterviewCalendarResponse["items"]; list?: InterviewListResponse } = {}) {
  vi.mocked(interviewQueries.useInterviewList).mockReturnValue({
    data: options.list ?? emptyList,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof interviewQueries.useInterviewList>);
  vi.mocked(interviewQueries.useInterviewCalendar).mockReturnValue({
    data: calendar(options.calendarItems),
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof interviewQueries.useInterviewCalendar>);
}

const renderPage = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <InterviewsPage />
    </MemoryRouter>,
  );

const busyDay = (id: string, scheduledAt: string): InterviewCalendarResponse["items"][number] => ({
  applicant: { email: `${id}@gmail.com`, fullName: `Applicant ${id}`, id: `a-${id}` },
  applicationId: `app-${id}`,
  canComplete: false,
  createdAt: "2026-10-06T02:12:00.000Z",
  durationMinutes: 60,
  endsAt: scheduledAt,
  id,
  interviewers: [],
  job: { id: "j1", title: `Job ${id}` },
  location: null,
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  mode: "online",
  notes: null,
  scheduledAt,
  status: "scheduled",
  updatedAt: "2026-10-06T02:12:00.000Z",
});

describe("Opening the Schedule interview dialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-10-08T03:00:00.000Z"), toFake: ["Date"] });
    mockQueries();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens from the header button without a day, and closes again", async () => {
    const user = userEvent.setup();
    renderPage("/recruiter/interviews");
    expect(screen.queryByRole("dialog", { name: "Schedule interview" })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Schedule interview" })[0]!);
    expect(await screen.findByRole("dialog", { name: "Schedule interview" })).toBeInTheDocument();
    expect(screen.getByTestId("initial-date")).toHaveTextContent("none");

    await user.click(screen.getByRole("button", { name: "Close stub" }));
    expect(screen.queryByRole("dialog", { name: "Schedule interview" })).not.toBeInTheDocument();
  });

  it("opens from the empty list's call to action", async () => {
    const user = userEvent.setup();
    renderPage("/recruiter/interviews");
    const empty = screen.getByText("No interviews yet").parentElement!;
    await user.click(within(empty).getByRole("button", { name: "Schedule interview" }));
    expect(await screen.findByRole("dialog", { name: "Schedule interview" })).toBeInTheDocument();
  });

  it("offers no schedule button when filters hide every interview, only a way to clear them", () => {
    renderPage("/recruiter/interviews?status=completed");
    expect(screen.getByText("No interviews match these filters")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Schedule interview" })).toHaveLength(1);
  });

  it("opens on a day of the calendar with the plus button of that day", async () => {
    const user = userEvent.setup();
    renderPage("/recruiter/interviews?view=calendar&month=2026-10");
    await user.click(screen.getByRole("button", { name: /^Schedule an interview on .*20/ }));
    expect(await screen.findByTestId("initial-date")).toHaveTextContent("2026-10-20");
  });

  it("offers the plus button on today and later days, but not on days gone by", () => {
    renderPage("/recruiter/interviews?view=calendar&month=2026-10");
    const plusOf = (day: string) => document.querySelector(`[data-day='${day}'] button[aria-label^='Schedule an interview on']`);
    expect(plusOf("2026-10-07")).toBeNull();
    expect(plusOf("2026-10-08")).not.toBeNull();
    expect(plusOf("2026-10-09")).not.toBeNull();
  });

  it("opens on the day listed in the '+N more' dialog", async () => {
    const user = userEvent.setup();
    const day = "2026-10-15T03:00:00.000Z";
    mockQueries({ calendarItems: ["a", "b", "c", "d", "e"].map((id) => busyDay(id, day)) });
    renderPage("/recruiter/interviews?view=calendar&month=2026-10");

    await user.click(screen.getByRole("button", { name: "+2 more" }));
    await user.click(await screen.findByRole("button", { name: "Schedule on this day" }));
    expect(await screen.findByTestId("initial-date")).toHaveTextContent("2026-10-15");
  });

  it("does not offer to schedule on a day that has gone by from the '+N more' dialog", async () => {
    const user = userEvent.setup();
    const day = "2026-10-02T03:00:00.000Z";
    mockQueries({ calendarItems: ["a", "b", "c", "d", "e"].map((id) => busyDay(id, day)) });
    renderPage("/recruiter/interviews?view=calendar&month=2026-10");

    await user.click(screen.getByRole("button", { name: "+2 more" }));
    expect(await screen.findByText("5 interviews")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule on this day" })).not.toBeInTheDocument();
  });
});
