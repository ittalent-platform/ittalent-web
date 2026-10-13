import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewItem } from "@/features/recruiter/interviews/interviews.constants";
import { RescheduleInterviewDialog } from "@/features/recruiter/interviews/reschedule-interview-dialog";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

const showToast = vi.hoisted(() => vi.fn());
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ dismissToast: vi.fn(), showToast }) }));
vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({ useUpdateInterview: vi.fn() }));

const interview: InterviewItem = {
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
};

type Mutate = (variables: Record<string, unknown>, options: { onError: (error: unknown) => void; onSuccess: () => void }) => void;
let mutate: ReturnType<typeof vi.fn<Mutate>>;
const onClose = vi.fn();
const failure = (status: number, code?: string) => Object.assign(new Error("failed"), { code, status });

function mockQueries(isPending = false) {
  vi.mocked(interviewQueries.useUpdateInterview).mockReturnValue({ isPending, mutate } as unknown as ReturnType<typeof interviewQueries.useUpdateInterview>);
}

const renderDialog = () => {
  const user = userEvent.setup();
  render(<RescheduleInterviewDialog interview={interview} onClose={onClose} />);
  return user;
};
const time = () => screen.getByLabelText(/Start time/);
const save = () => screen.getByRole("button", { name: "Save new time" });

describe("Reschedule interview dialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-10-08T03:00:00.000Z"), toFake: ["Date"] });
    showToast.mockReset();
    onClose.mockReset();
    mutate = vi.fn<Mutate>();
    mockQueries();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says who it is about and the time it has now, and starts from that time", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Reschedule interview" });
    expect(within(dialog).getByText("Phạm Minh Khoa · currently Thu, 15 Oct · 10:00")).toBeInTheDocument();
    expect(within(dialog).getByText("15/10/2026")).toBeInTheDocument();
    expect(time()).toHaveValue("10:00");
    expect(within(dialog).getByText("Runs Thu, 15 Oct · 10:00 – 11:00 (Asia/Ho Chi Minh)")).toBeInTheDocument();
    expect(within(dialog).getByText("Phạm Minh Khoa and the interviewers get an email with the new time.")).toBeInTheDocument();
  });

  it("keeps Save off while the time is the one it already has", () => {
    renderDialog();
    expect(save()).toBeDisabled();
    fireEvent.change(time(), { target: { value: "14:00" } });
    expect(save()).toBeEnabled();
    fireEvent.change(time(), { target: { value: "10:00" } });
    expect(save()).toBeDisabled();
  });

  it("shows when the interview now runs, keeping its duration", () => {
    renderDialog();
    fireEvent.change(time(), { target: { value: "14:00" } });
    expect(screen.getByText("Runs Thu, 15 Oct · 14:00 – 15:00 (Asia/Ho Chi Minh)")).toBeInTheDocument();
  });

  it("sends the new time in Vietnam time, then says who has been told and closes", async () => {
    mutate.mockImplementation((_variables, options) => options.onSuccess());
    const user = renderDialog();
    fireEvent.change(time(), { target: { value: "14:00" } });
    await user.click(save());

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]![0]).toEqual({ id: "i1", scheduledAt: "2026-10-15T07:00:00.000Z" });
    expect(showToast).toHaveBeenCalledWith({
      message: "Phạm Minh Khoa has been notified of the new time: Thu, 15 Oct · 14:00.",
      title: "Interview rescheduled",
      tone: "success",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("asks for a start time", async () => {
    const user = renderDialog();
    fireEvent.change(time(), { target: { value: "" } });
    await user.click(save());
    expect(await screen.findByText("Enter a start time.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("refuses a time that has already passed, in Vietnam time, without asking the API", async () => {
    vi.setSystemTime(new Date("2026-10-15T03:30:00.000Z")); // 10:30 in Vietnam
    const user = renderDialog();
    fireEvent.change(time(), { target: { value: "09:00" } });
    await user.click(save());
    expect(await screen.findByText("Choose a future date and time.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  describe("when the API refuses", () => {
    async function saveWith(error: unknown) {
      mutate.mockImplementation((_variables, options) => options.onError(error));
      const user = renderDialog();
      fireEvent.change(time(), { target: { value: "14:00" } });
      await user.click(save());
    }

    it("says the time is in the past, at the top", async () => {
      await saveWith(failure(400, "INTERVIEW_TIME_IN_PAST"));
      expect(await screen.findByText("Choose a future date and time.")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("says an interviewer is busy and keeps the time that was typed", async () => {
      await saveWith(failure(409, "INTERVIEWER_CONFLICT"));
      expect(await screen.findByText("An interviewer already has another interview at this time. Choose another time or interviewer.")).toBeInTheDocument();
      expect(time()).toHaveValue("14:00");
    });

    it("says the applicant is busy", async () => {
      await saveWith(failure(409, "APPLICANT_CONFLICT"));
      expect(await screen.findByText("The applicant already has another interview at this time. Choose another time.")).toBeInTheDocument();
    });

    it("says it could not be rescheduled for any other reason", async () => {
      await saveWith(failure(500));
      expect(await screen.findByText("Could not reschedule this interview. Check the date and time and try again.")).toBeInTheDocument();
    });

    it("explains that nothing was saved when someone else changed the interview first", async () => {
      await saveWith(failure(409, "INTERVIEW_STATE_CHANGED"));
      expect(await screen.findByRole("alertdialog", { name: "This interview was updated" })).toBeInTheDocument();
    });

    it("explains that an interview that is no longer scheduled cannot be moved", async () => {
      await saveWith(failure(409, "INTERVIEW_NOT_EDITABLE"));
      expect(await screen.findByRole("alertdialog", { name: "This interview can't be changed" })).toBeInTheDocument();
    });
  });

  it("locks the dialog while the new time is being saved", () => {
    mockQueries(true);
    renderDialog();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("closes with Cancel", async () => {
    const user = renderDialog();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
