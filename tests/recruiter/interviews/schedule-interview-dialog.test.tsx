import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScheduleInterviewDialog } from "@/features/recruiter/interviews/schedule-interview-dialog";
import { ictDayKey, MS_PER_DAY } from "@/lib/format";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

/** The pinned "now" (10:00 in Vietnam); every date below is derived from it, so the suite never rots. */
const NOW = new Date("2026-10-08T03:00:00.000Z");
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * MS_PER_DAY);
const TODAY = ictDayKey(NOW);
const DAY = ictDayKey(daysFromNow(12)); // the day the fixtures schedule on, "YYYY-MM-DD"
const DAY_DISPLAY = DAY.split("-").reverse().join("/");
const DAY_LABEL = `${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(`${DAY}T00:00:00Z`))}, ${Number(DAY.slice(8))} ${new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${DAY}T00:00:00Z`))}`;
const ictIso = (day: string, time: string) => new Date(`${day}T${time}:00+07:00`).toISOString();

const showToast = vi.hoisted(() => vi.fn());
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ dismissToast: vi.fn(), showToast }) }));
vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({
  useCreateInterview: vi.fn(),
  useFindInterviewerByEmail: vi.fn(),
  useInterviewerSearch: vi.fn(),
  useSchedulableApplications: vi.fn(),
}));

const applications = [
  { appliedAt: daysFromNow(-7).toISOString(), applicant: { email: "bao.ha@gmail.com", fullName: "Hà Quốc Bảo", id: "a1" }, id: "app1", job: { id: "j1", title: "Backend Developer (Go)" }, status: "under_review" },
  { appliedAt: daysFromNow(-6).toISOString(), applicant: { email: "long.t@gmail.com", fullName: "Trịnh Văn Long", id: "a2" }, id: "app2", job: { id: "j2", title: "DevOps Engineer" }, status: "submitted" },
];
const recruiters = [
  { email: "nam.bui@novafintech.vn", fullName: "Nam Bùi", id: "u-nam" },
  { email: "tran.b@novafintech.vn", fullName: "Trần B", id: "u-tran" },
];

type Mutate = (body: Record<string, unknown>, options: { onError: (error: unknown) => void; onSuccess: () => void }) => void;
let mutate: ReturnType<typeof vi.fn<Mutate>>;
const onClose = vi.fn();

function mockQueries(isPending = false) {
  vi.mocked(interviewQueries.useCreateInterview).mockReturnValue({ isPending, mutate } as unknown as ReturnType<typeof interviewQueries.useCreateInterview>);
  vi.mocked(interviewQueries.useSchedulableApplications).mockReturnValue({ data: { items: applications }, isFetching: false } as unknown as ReturnType<typeof interviewQueries.useSchedulableApplications>);
  vi.mocked(interviewQueries.useInterviewerSearch).mockReturnValue({ data: { items: recruiters } } as unknown as ReturnType<typeof interviewQueries.useInterviewerSearch>);
  vi.mocked(interviewQueries.useFindInterviewerByEmail).mockReturnValue(async (email: string) => recruiters.find((person) => person.email === email));
}

const failure = (status: number, code?: string) => Object.assign(new Error("failed"), { code, status });
const dialog = () => screen.getByRole("dialog", { name: "Schedule interview" });
const applicationInput = () => screen.getByRole("combobox", { name: /Application/ });

function renderDialog(initialDate?: string) {
  const user = userEvent.setup();
  render(<ScheduleInterviewDialog initialDate={initialDate} onClose={onClose} />);
  return user;
}

async function chooseApplication(user: ReturnType<typeof userEvent.setup>, name = "Hà Quốc Bảo") {
  await user.click(applicationInput());
  await user.click(await screen.findByRole("option", { name: new RegExp(name) }));
}

async function addInterviewer(user: ReturnType<typeof userEvent.setup>, email = "nam.bui@novafintech.vn") {
  await user.type(screen.getByLabelText(/Interviewer emails/), `${email}{Enter}`);
  await screen.findByText(email);
}

/** Fills every required field; the date comes from `initialDate`. */
async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await chooseApplication(user);
  fireEvent.change(screen.getByLabelText(/Start time/), { target: { value: "10:00" } });
  await addInterviewer(user);
  await user.type(screen.getByLabelText("Meeting link"), "https://meet.google.com/kqr-pmzt-bvx");
}

describe("Schedule interview dialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    showToast.mockReset();
    onClose.mockReset();
    mutate = vi.fn<Mutate>();
    mockQueries();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for the application, the time, the people and the place", () => {
    renderDialog();
    const form = within(dialog());
    for (const label of [/Application/, /Date/, /Start time/, /Duration/, /Timezone/, /Interviewer emails/, "Location", "Meeting link", "Notes"]) {
      expect(form.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(form.getAllByText("Asia/Ho Chi Minh (GMT+7)").length).toBeGreaterThan(0);
    expect(form.getAllByText("1 hour").length).toBeGreaterThan(0);
    expect(form.getByText("Provide at least one — location or meeting link.")).toBeInTheDocument();
  });

  it("starts on the day chosen in the calendar", () => {
    renderDialog(DAY);
    expect(within(dialog()).getByText(DAY_DISPLAY)).toBeInTheDocument();
  });

  it("sends nothing and says what is missing when submitted empty", async () => {
    const user = renderDialog();
    await user.click(screen.getByRole("button", { name: "Create schedule" }));
    expect(await screen.findByText("Choose an application.")).toBeInTheDocument();
    expect(screen.getByText("Choose a date.")).toBeInTheDocument();
    expect(screen.getByText("Enter a start time.")).toBeInTheDocument();
    expect(screen.getByText("Add at least one interviewer.")).toBeInTheDocument();
    expect(screen.getByText("Provide a location or a meeting link.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows the applicant, the job and the stage once an application is chosen", async () => {
    const user = renderDialog();
    await chooseApplication(user);
    const form = within(dialog());
    expect(form.getByText("bao.ha@gmail.com")).toBeInTheDocument();
    expect(form.getByText("Under Review")).toBeInTheDocument();
    expect(form.getByText("Scheduling doesn't change the application status.")).toBeInTheDocument();
    expect(applicationInput()).toHaveValue("Hà Quốc Bảo — Backend Developer (Go)");
  });

  it("says how long the interview runs once the date and the time are there", async () => {
    renderDialog(DAY);
    fireEvent.change(screen.getByLabelText(/Start time/), { target: { value: "10:00" } });
    expect(await screen.findByText(`Runs ${DAY_LABEL} · 10:00 – 11:00`)).toBeInTheDocument();
  });

  it("schedules an online interview in Vietnam time, then says so and closes", async () => {
    mutate.mockImplementation((_body, options) => options.onSuccess());
    const user = renderDialog(DAY);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Create schedule" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]![0]).toEqual({
      applicationId: "app1",
      durationMinutes: 60,
      interviewerIds: ["u-nam"],
      meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
      mode: "online",
      scheduledAt: ictIso(DAY, "10:00"),
    });
    expect(showToast).toHaveBeenCalledWith({ message: "The interview has been added to the schedule.", title: "Interview scheduled", tone: "success" });
    expect(onClose).toHaveBeenCalled();
  });

  it("schedules an onsite interview when only a location is given", async () => {
    const user = renderDialog(DAY);
    await chooseApplication(user);
    fireEvent.change(screen.getByLabelText(/Start time/), { target: { value: "14:30" } });
    await addInterviewer(user);
    await user.type(screen.getByLabelText("Location"), "12 Tôn Đản, Quận 4");
    await user.click(screen.getByRole("button", { name: "Create schedule" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]![0]).toMatchObject({ location: "12 Tôn Đản, Quận 4", mode: "onsite", scheduledAt: ictIso(DAY, "14:30") });
    expect(mutate.mock.calls[0]![0]).not.toHaveProperty("meetingLink");
  });

  it("refuses a link that is not https", async () => {
    const user = renderDialog(DAY);
    await fillValid(user);
    await user.clear(screen.getByLabelText("Meeting link"));
    await user.type(screen.getByLabelText("Meeting link"), "http://meet.example.com/x");
    await user.click(screen.getByRole("button", { name: "Create schedule" }));
    expect(await screen.findByText("Enter a link that starts with https://.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("refuses a time that has already passed today, in Vietnam time", async () => {
    const user = renderDialog(TODAY);
    await chooseApplication(user);
    fireEvent.change(screen.getByLabelText(/Start time/), { target: { value: "09:00" } });
    await addInterviewer(user);
    await user.type(screen.getByLabelText("Meeting link"), "https://meet.google.com/kqr-pmzt-bvx");
    await user.click(screen.getByRole("button", { name: "Create schedule" }));
    expect(await screen.findByText("Choose a future date and time.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  describe("interviewer emails", () => {
    it("suggests the company's recruiters and adds one on click", async () => {
      const user = renderDialog();
      await user.click(screen.getByLabelText(/Interviewer emails/));
      await user.click(await screen.findByRole("option", { name: /tran\.b@novafintech\.vn/ }));
      expect(screen.getByText("tran.b@novafintech.vn")).toBeInTheDocument();
    });

    it("checks an address as it is added", async () => {
      const user = renderDialog();
      const input = screen.getByLabelText(/Interviewer emails/);
      await user.type(input, "not-an-email{Enter}");
      expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
      await user.clear(input);
      await user.type(input, "stranger@elsewhere.com{Enter}");
      expect(await screen.findByText("No active recruiter in your company has this email.")).toBeInTheDocument();
      await user.clear(input);
      await addInterviewer(user);
      await user.type(input, "nam.bui@novafintech.vn{Enter}");
      expect(await screen.findByText("This interviewer is already added.")).toBeInTheDocument();
    });

    it("removes an interviewer from its chip, or with Backspace", async () => {
      const user = renderDialog();
      await addInterviewer(user);
      await addInterviewer(user, "tran.b@novafintech.vn");
      await user.click(screen.getByRole("button", { name: "Remove nam.bui@novafintech.vn" }));
      expect(screen.queryByRole("button", { name: "Remove nam.bui@novafintech.vn" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove tran.b@novafintech.vn" })).toBeInTheDocument();
      await user.click(screen.getByLabelText(/Interviewer emails/));
      await user.keyboard("{Backspace}");
      expect(screen.queryByRole("button", { name: "Remove tran.b@novafintech.vn" })).not.toBeInTheDocument();
    });
  });

  describe("when the API refuses", () => {
    async function submitWith(error: unknown) {
      mutate.mockImplementation((_body, options) => options.onError(error));
      const user = renderDialog(DAY);
      await fillValid(user);
      await user.click(screen.getByRole("button", { name: "Create schedule" }));
    }

    it("says an interviewer is busy, at the top, and keeps what was typed", async () => {
      await submitWith(failure(409, "INTERVIEWER_CONFLICT"));
      expect(await screen.findByText("An interviewer already has another interview at this time. Choose another time or interviewer.")).toBeInTheDocument();
      expect(screen.getByLabelText("Meeting link")).toHaveValue("https://meet.google.com/kqr-pmzt-bvx");
      expect(onClose).not.toHaveBeenCalled();
    });

    it("says the applicant is busy", async () => {
      await submitWith(failure(409, "APPLICANT_CONFLICT"));
      expect(await screen.findByText("The applicant already has another interview at this time. Choose another time.")).toBeInTheDocument();
    });

    it("says the application is not eligible, next to the application", async () => {
      await submitWith(failure(409, "APPLICATION_NOT_SCHEDULABLE"));
      expect(await screen.findByText("This application isn't eligible for scheduling an interview.")).toBeInTheDocument();
    });

    it("says the time is in the past, next to the date", async () => {
      await submitWith(failure(400, "INTERVIEW_TIME_IN_PAST"));
      expect(await screen.findByText("Choose a future date and time.")).toBeInTheDocument();
    });

    it("says an interviewer is not allowed, next to the interviewers", async () => {
      await submitWith(failure(400, "INVALID_INTERVIEWERS"));
      expect(await screen.findByText("Every interviewer must be an active recruiter of your company.")).toBeInTheDocument();
    });

    it("keeps everything and says it could not be created for any other reason", async () => {
      await submitWith(failure(500));
      expect(await screen.findByText("Could not create this interview. Check the fields and try again.")).toBeInTheDocument();
      expect(showToast).not.toHaveBeenCalled();
    });
  });

  it("locks the dialog while the interview is being created", () => {
    mockQueries(true);
    renderDialog();
    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  describe("closing", () => {
    it("closes at once when nothing was entered", async () => {
      const user = renderDialog();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("asks before throwing away what was entered, and lets the recruiter keep editing", async () => {
      const user = renderDialog();
      await user.type(screen.getByLabelText("Location"), "HQ");
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      const confirm = await screen.findByRole("alertdialog", { name: "Discard unsaved changes?" });
      expect(within(confirm).getByText("This interview won't be scheduled.")).toBeInTheDocument();
      await user.click(within(confirm).getByRole("button", { name: "Keep editing" }));
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Location")).toHaveValue("HQ");
    });

    it("discards when the recruiter agrees", async () => {
      const user = renderDialog();
      await addInterviewer(user);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Discard" }));
      expect(onClose).toHaveBeenCalled();
    });

    it("counts a day chosen in the calendar as nothing entered", async () => {
      const user = renderDialog(DAY);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
