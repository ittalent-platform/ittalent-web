import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewItem } from "@/features/recruiter/interviews/interviews.constants";
import { EditInterviewDialog } from "@/features/recruiter/interviews/edit-interview-dialog";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

const showToast = vi.hoisted(() => vi.fn());
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ dismissToast: vi.fn(), showToast }) }));
vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({
  useFindInterviewerByEmail: vi.fn(),
  useInterviewerSearch: vi.fn(),
  useUpdateInterview: vi.fn(),
}));

const recruiters = [
  { email: "nam.bui@novafintech.vn", fullName: "Nam Bùi", id: "u-nam" },
  { email: "tran.b@novafintech.vn", fullName: "Trần B", id: "u-tran" },
  { email: "le.c@novafintech.vn", fullName: "Lê C", id: "u-le" },
];

const interview: InterviewItem = {
  applicant: { email: "khoa.pham@gmail.com", fullName: "Phạm Minh Khoa", id: "a1" },
  applicationId: "app1",
  canComplete: false,
  createdAt: "2026-10-06T02:12:00.000Z",
  durationMinutes: 60,
  endsAt: "2026-10-15T04:00:00.000Z",
  id: "i1",
  interviewers: recruiters.slice(0, 2),
  job: { id: "j1", title: "Backend Developer (Go)" },
  location: null,
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  mode: "online",
  notes: "Panel interview",
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
  vi.mocked(interviewQueries.useInterviewerSearch).mockReturnValue({ data: { items: recruiters } } as unknown as ReturnType<typeof interviewQueries.useInterviewerSearch>);
  vi.mocked(interviewQueries.useFindInterviewerByEmail).mockReturnValue(async (email: string) => recruiters.find((person) => person.email === email));
}

function renderDialog(overrides: Partial<InterviewItem> = {}) {
  const user = userEvent.setup();
  render(<EditInterviewDialog interview={{ ...interview, ...overrides }} onClose={onClose} />);
  return user;
}

const save = () => screen.getByRole("button", { name: "Save changes" });

describe("Edit interview dialog", () => {
  beforeEach(() => {
    showToast.mockReset();
    onClose.mockReset();
    mutate = vi.fn<Mutate>();
    mockQueries();
  });

  it("says the date and time are locked, and who and when it is about", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Edit interview" });
    expect(within(dialog).getByText("Date and time are locked here — use Reschedule to change them.")).toBeInTheDocument();
    expect(within(dialog).getByText("Phạm Minh Khoa")).toBeInTheDocument();
    expect(within(dialog).getByText("Backend Developer (Go)")).toBeInTheDocument();
    expect(within(dialog).getByText("Thu, 15 Oct 2026 · 10:00 (Asia/Ho Chi Minh)")).toBeInTheDocument();
    expect(within(dialog).getByText("Runs Thu, 15 Oct · 10:00 – 11:00")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Start time/)).not.toBeInTheDocument();
  });

  it("starts from what the interview says", () => {
    renderDialog();
    expect(screen.getByLabelText("Meeting link")).toHaveValue("https://meet.google.com/kqr-pmzt-bvx");
    expect(screen.getByLabelText("Location")).toHaveValue("");
    expect(screen.getByLabelText("Notes")).toHaveValue("Panel interview");
    expect(screen.getByRole("button", { name: "Remove nam.bui@novafintech.vn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove tran.b@novafintech.vn" })).toBeInTheDocument();
    expect(screen.getByText("Saving sends Phạm Minh Khoa and the interviewers an email with the updated details.")).toBeInTheDocument();
  });

  it("keeps Save off until something changes, and off again when it is changed back", async () => {
    const user = renderDialog();
    expect(save()).toBeDisabled();
    await user.type(screen.getByLabelText("Notes"), "!");
    expect(save()).toBeEnabled();
    await user.type(screen.getByLabelText("Notes"), "{Backspace}");
    expect(save()).toBeDisabled();
  });

  it("sends only the fields that changed, then says so and closes", async () => {
    mutate.mockImplementation((_variables, options) => options.onSuccess());
    const user = renderDialog();
    await user.clear(screen.getByLabelText("Notes"));
    await user.type(screen.getByLabelText("Location"), "12 Tôn Đản, Quận 4");
    await user.click(save());

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]![0]).toEqual({ id: "i1", location: "12 Tôn Đản, Quận 4", notes: null });
    expect(showToast).toHaveBeenCalledWith({ message: "Your changes have been saved.", title: "Interview updated", tone: "success" });
    expect(onClose).toHaveBeenCalled();
  });

  it("changes the duration and shows when it now ends", async () => {
    mutate.mockImplementation((_variables, options) => options.onSuccess());
    const user = renderDialog();
    await user.click(screen.getByRole("combobox", { name: /Duration/ }));
    await user.click(await screen.findByRole("option", { name: /1 h 30 min/ }));
    expect(screen.getByText("Runs Thu, 15 Oct · 10:00 – 11:30")).toBeInTheDocument();
    await user.click(save());
    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]![0]).toEqual({ durationMinutes: 90, id: "i1" });
  });

  it("changes the interviewers and the mode when the link is dropped for a location", async () => {
    const user = renderDialog();
    await user.click(screen.getByRole("button", { name: "Remove tran.b@novafintech.vn" }));
    await user.type(screen.getByLabelText(/Interviewer emails/), "le.c@novafintech.vn{Enter}");
    await screen.findByRole("button", { name: "Remove le.c@novafintech.vn" });
    await user.clear(screen.getByLabelText("Meeting link"));
    await user.type(screen.getByLabelText("Location"), "HQ");
    await user.click(save());
    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]![0]).toEqual({ id: "i1", interviewerIds: ["u-nam", "u-le"], location: "HQ", meetingLink: null, mode: "onsite" });
  });

  it("asks for an interviewer and for a place before it sends anything", async () => {
    const user = renderDialog();
    await user.click(screen.getByRole("button", { name: "Remove nam.bui@novafintech.vn" }));
    await user.click(screen.getByRole("button", { name: "Remove tran.b@novafintech.vn" }));
    await user.clear(screen.getByLabelText("Meeting link"));
    await user.click(save());
    expect(await screen.findByText("Add at least one interviewer.")).toBeInTheDocument();
    expect(screen.getByText("Provide a location or a meeting link.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("refuses a link that is not https", async () => {
    const user = renderDialog();
    await user.clear(screen.getByLabelText("Meeting link"));
    await user.type(screen.getByLabelText("Meeting link"), "http://meet.example.com/x");
    await user.click(save());
    expect(await screen.findByText("Enter a link that starts with https://.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("lets an ended interview keep a duration of its own that is not in the list", () => {
    renderDialog({ durationMinutes: 50 });
    expect(screen.getByRole("combobox", { name: /Duration/ })).toHaveTextContent("50 minutes");
  });

  describe("when the API refuses", () => {
    async function saveWith(error: unknown) {
      mutate.mockImplementation((_variables, options) => options.onError(error));
      const user = renderDialog();
      await user.type(screen.getByLabelText("Notes"), "!");
      await user.click(save());
    }

    it("says an interviewer is busy, at the top, and keeps what was typed", async () => {
      await saveWith(failure(409, "INTERVIEWER_CONFLICT"));
      expect(await screen.findByText("An interviewer already has another interview at this time. Choose another interviewer or a shorter duration.")).toBeInTheDocument();
      expect(screen.getByLabelText("Notes")).toHaveValue("Panel interview!");
      expect(onClose).not.toHaveBeenCalled();
    });

    it("says the applicant is busy", async () => {
      await saveWith(failure(409, "APPLICANT_CONFLICT"));
      expect(await screen.findByText("The applicant has another interview that overlaps this one. Choose a shorter duration.")).toBeInTheDocument();
    });

    it("says an interviewer is not allowed, next to the interviewers", async () => {
      await saveWith(failure(400, "INVALID_INTERVIEWERS"));
      expect(await screen.findByText("Every interviewer must be an active recruiter of your company.")).toBeInTheDocument();
    });

    it("keeps everything and says it could not be saved for any other reason", async () => {
      await saveWith(failure(500));
      expect(await screen.findByText("Could not save your changes. Check the fields and try again.")).toBeInTheDocument();
      expect(showToast).not.toHaveBeenCalled();
    });

    it("explains that nothing was saved when someone else changed the interview first", async () => {
      await saveWith(failure(409, "INTERVIEW_STATE_CHANGED"));
      const dialog = await screen.findByRole("alertdialog", { name: "This interview was updated" });
      expect(within(dialog).getByText(/nothing was saved/)).toBeInTheDocument();
      await userEvent.setup().click(within(dialog).getByRole("button", { name: "Show latest" }));
      expect(onClose).toHaveBeenCalled();
    });

    it("explains that an interview that is no longer scheduled cannot be edited", async () => {
      await saveWith(failure(409, "INTERVIEW_NOT_EDITABLE"));
      expect(await screen.findByRole("alertdialog", { name: "This interview can't be changed" })).toBeInTheDocument();
    });
  });

  it("locks the dialog while the changes are being saved", () => {
    mockQueries(true);
    renderDialog();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  describe("closing", () => {
    it("closes at once when nothing changed", async () => {
      const user = renderDialog();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("asks before throwing away a change, and lets the recruiter keep editing", async () => {
      const user = renderDialog();
      await user.type(screen.getByLabelText("Notes"), "!");
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      const confirm = await screen.findByRole("alertdialog", { name: "Discard unsaved changes?" });
      expect(within(confirm).getByText("Your changes to this interview won't be saved.")).toBeInTheDocument();
      await user.click(within(confirm).getByRole("button", { name: "Keep editing" }));
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Notes")).toHaveValue("Panel interview!");
    });

    it("discards when the recruiter agrees", async () => {
      const user = renderDialog();
      await user.click(screen.getByRole("button", { name: "Remove tran.b@novafintech.vn" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Discard" }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
