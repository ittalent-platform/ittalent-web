import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewDetailDto } from "@/api/generated/types.gen";
import { InterviewDetailPage } from "@/features/recruiter/interviews/interview-detail-page";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({ useInterviewDetail: vi.fn() }));
vi.mock("@/auth/use-session", () => ({
  useSession: () => ({ data: { user: { email: "tran.bao@novafintech.vn", fullName: "Trần Bảo", id: "u-me" } } }),
}));

const detail = (overrides: Partial<InterviewDetailDto> = {}): InterviewDetailDto => ({
  applicant: { email: "khoa.pham@gmail.com", fullName: "Phạm Minh Khoa", id: "a1" },
  applicationId: "app1",
  canComplete: false,
  createdAt: "2026-10-06T02:12:00.000Z",
  createdBy: "u-me",
  durationMinutes: 60,
  endsAt: "2026-10-15T04:00:00.000Z",
  id: "i1",
  interviewers: [
    { email: "nam.bui@novafintech.vn", fullName: "Nam Bùi", id: "u-nam" },
    { email: "tran.b@novafintech.vn", fullName: null, id: "u-tran" },
  ],
  job: { id: "j1", title: "Backend Developer (Go)" },
  location: null,
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  mode: "online",
  notes: "Panel interview — system design + coding round.",
  scheduledAt: "2026-10-15T03:00:00.000Z",
  status: "scheduled",
  statusHistory: [{ changedAt: "2026-10-06T02:12:00.000Z", changedBy: "u-me", note: null, status: "scheduled" }],
  updatedAt: "2026-10-06T02:12:00.000Z",
  ...overrides,
});

function mockDetail(data: InterviewDetailDto | undefined, extra: Record<string, unknown> = {}) {
  vi.mocked(interviewQueries.useInterviewDetail).mockReturnValue({
    data,
    isError: false,
    isPending: data === undefined && !extra.isError,
    refetch: vi.fn(),
    ...extra,
  } as unknown as ReturnType<typeof interviewQueries.useInterviewDetail>);
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/recruiter/interviews/i1"]}>
      <Routes>
        <Route element={<InterviewDetailPage />} path="/recruiter/interviews/:interviewId" />
        <Route element={<p>Interviews list</p>} path="/recruiter/interviews" />
      </Routes>
    </MemoryRouter>,
  );

const failure = (status: number) => ({ error: Object.assign(new Error("failed"), { status }), isError: true, isPending: false });

describe("Recruiter interview detail", () => {
  beforeEach(() => {
    vi.mocked(interviewQueries.useInterviewDetail).mockReset();
    mockDetail(detail());
  });

  it("asks for the interview named in the address", () => {
    renderPage();
    expect(interviewQueries.useInterviewDetail).toHaveBeenCalledWith("i1");
  });

  it("shows who and what, with a way back to the list", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Phạm Minh Khoa" })).toBeInTheDocument();
    expect(screen.getByText("Scheduled", { selector: "[data-slot=badge]" })).toBeInTheDocument();
    expect(screen.getByText("Backend Developer (Go)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Interviews" })).toHaveAttribute("href", "/recruiter/interviews");
  });

  it("shows the date, the time in Vietnam, the duration, the mode, the link and the notes", () => {
    renderPage();
    const info = screen.getByRole("region", { name: /Interview information/i });
    expect(within(info).getByText("Thu, 15 Oct 2026")).toBeInTheDocument();
    expect(within(info).getByText("10:00 – 11:00")).toBeInTheDocument();
    expect(within(info).getByText("(Asia/Ho Chi Minh)")).toBeInTheDocument();
    expect(within(info).getByText("1 hour")).toBeInTheDocument();
    expect(within(info).getByText("Online")).toBeInTheDocument();
    expect(within(info).getByRole("link", { name: "Open meeting link" })).toHaveAttribute("href", "https://meet.google.com/kqr-pmzt-bvx");
    expect(within(info).getByText("Panel interview — system design + coding round.")).toBeInTheDocument();
  });

  it("shows the place of an onsite interview and no link", () => {
    mockDetail(detail({ location: "12 Tôn Đản, Quận 4", meetingLink: null, mode: "onsite", notes: null }));
    renderPage();
    expect(screen.getByText("12 Tôn Đản, Quận 4")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open meeting link" })).not.toBeInTheDocument();
    expect(screen.getByText("Onsite")).toBeInTheDocument();
  });

  it("lists the interviewers with their count", () => {
    renderPage();
    const card = screen.getByRole("region", { name: /Interviewers/i });
    expect(within(card).getByText("nam.bui@novafintech.vn")).toBeInTheDocument();
    expect(within(card).getByText("tran.b@novafintech.vn")).toBeInTheDocument();
    expect(within(card).getByText("2")).toBeInTheDocument();
  });

  it("lists the status history newest first and names the signed-in recruiter only", () => {
    mockDetail(
      detail({
        status: "cancelled",
        statusHistory: [
          { changedAt: "2026-10-06T02:12:00.000Z", changedBy: "u-me", note: null, status: "scheduled" },
          { changedAt: "2026-10-08T04:02:00.000Z", changedBy: "u-other", note: "Applicant replied: link disabled.", status: "cancelled" },
        ],
      }),
    );
    renderPage();
    const labels = screen.getAllByText(/^(Scheduled|Cancelled)$/, { selector: "p" }).map((node) => node.textContent);
    expect(labels).toEqual(["Cancelled", "Scheduled"]);
    expect(screen.getByText("8 Oct 2026, 11:02")).toBeInTheDocument();
    expect(screen.getByText("Applicant replied: link disabled.")).toBeInTheDocument();
    expect(screen.getByText("6 Oct 2026, 09:12 · by Trần Bảo")).toBeInTheDocument();
  });

  it("says a cancelled interview can no longer be edited", () => {
    mockDetail(detail({ status: "cancelled" }));
    renderPage();
    expect(screen.getByText("This interview is cancelled and can no longer be edited.")).toBeInTheDocument();
  });

  it("does not show that notice for an interview that is still scheduled", () => {
    renderPage();
    expect(screen.queryByText(/can no longer be edited/)).not.toBeInTheDocument();
  });

  it("shows loading placeholders while the interview is on its way", () => {
    mockDetail(undefined);
    renderPage();
    expect(document.querySelector("[aria-busy=true]")).toBeInTheDocument();
  });

  it.each([404, 400])("explains an interview that is missing or not the company's (HTTP %i) and goes back to the list", (status) => {
    mockDetail(undefined, failure(status));
    renderPage();
    expect(screen.getByText("This interview isn't available")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to interviews" }));
    expect(screen.getByText("Interviews list")).toBeInTheDocument();
  });

  it("tells a recruiter without access that nothing is shown", () => {
    mockDetail(undefined, failure(403));
    renderPage();
    expect(screen.getByText("You no longer have access")).toBeInTheDocument();
  });

  it("offers to try again when loading fails for another reason", () => {
    const refetch = vi.fn();
    mockDetail(undefined, { ...failure(500), refetch });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });
});
