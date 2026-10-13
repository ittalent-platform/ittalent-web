import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InterviewListResponse } from "@/api/generated/types.gen";
import { InterviewsPage } from "@/features/recruiter/interviews/interviews-page";
import * as interviewQueries from "@/features/recruiter/interviews/interviews.queries";

const showToast = vi.hoisted(() => vi.fn());
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ dismissToast: vi.fn(), showToast }) }));
vi.mock("@/features/recruiter/interviews/interviews.queries", () => ({
  useInterviewCalendar: vi.fn(),
  useInterviewList: vi.fn(),
  useUpdateInterview: () => ({ isPending: false, mutate: vi.fn() }),
  useUpdateInterviewStatus: vi.fn(),
  useFindInterviewerByEmail: () => vi.fn(),
  useInterviewerSearch: () => ({ data: { items: [] } }),
}));

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

type Mutate = (variables: { id: string; status: string }, options: { onError: (error: unknown) => void; onSuccess: () => void }) => void;
let mutate: ReturnType<typeof vi.fn<Mutate>>;

function mockList(items: Item[]) {
  vi.mocked(interviewQueries.useInterviewList).mockReturnValue({
    data: { items, limit: 10, page: 1, total: items.length, totalPages: 1 },
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof interviewQueries.useInterviewList>);
}

function mockMutation(isPending = false) {
  vi.mocked(interviewQueries.useUpdateInterviewStatus).mockReturnValue({ isPending, mutate } as unknown as ReturnType<typeof interviewQueries.useUpdateInterviewStatus>);
}

const failure = (status: number, code?: string) => Object.assign(new Error("failed"), { code, status });

async function openMenu(user: ReturnType<typeof userEvent.setup>, name = "Phạm Minh Khoa") {
  render(
    <MemoryRouter initialEntries={["/recruiter/interviews"]}>
      <InterviewsPage />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: `Actions for ${name}` }));
}

describe("Interview status actions in the table", () => {
  beforeEach(() => {
    showToast.mockReset();
    mutate = vi.fn<Mutate>();
    vi.mocked(interviewQueries.useInterviewList).mockReset();
    mockMutation();
    mockList([interview()]);
  });

  it("offers an upcoming interview to be cancelled, and completing only after it ends", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    expect(await screen.findByRole("menuitem", { name: "View details" })).toBeInTheDocument();
    const complete = screen.getByRole("menuitem", { name: /Mark as completed/ });
    expect(complete).toHaveAttribute("aria-disabled", "true");
    expect(complete).toHaveTextContent("After it ends");
    expect(screen.queryByRole("menuitem", { name: /no-show/ })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancel interview" })).toBeInTheDocument();
  });

  it("offers an upcoming interview to be edited and rescheduled, in that order after its details", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    expect(await screen.findByRole("menuitem", { name: "Edit details" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Reschedule" })).toBeInTheDocument();
    const names = screen.getAllByRole("menuitem").map((item) => item.textContent ?? "");
    expect(names.map((name) => name.split("After")[0])).toEqual(["View details", "Edit details", "Reschedule", "Mark as completed", "Cancel interview"]);
  });

  it("opens the edit dialog and the reschedule dialog from the menu", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Edit details" }));
    expect(await screen.findByRole("dialog", { name: "Edit interview" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit interview" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Actions for Phạm Minh Khoa" }));
    await user.click(await screen.findByRole("menuitem", { name: "Reschedule" }));
    expect(await screen.findByRole("dialog", { name: "Reschedule interview" })).toBeInTheDocument();
  });

  it("offers an ended interview to be completed, marked no-show or cancelled", async () => {
    mockList([interview({ canComplete: true })]);
    const user = userEvent.setup();
    await openMenu(user);
    expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Mark as no-show" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancel interview" })).toBeInTheDocument();
  });

  it("lets an ended interview be edited (its notes, say) but not moved", async () => {
    mockList([interview({ canComplete: true })]);
    const user = userEvent.setup();
    await openMenu(user);
    expect(await screen.findByRole("menuitem", { name: "Edit details" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Reschedule" })).not.toBeInTheDocument();
  });

  it.each(["completed", "no_show", "cancelled"] as const)("offers nothing but the details for a %s interview", async (status) => {
    mockList([interview({ status })]);
    const user = userEvent.setup();
    await openMenu(user);
    expect(await screen.findByRole("menuitem", { name: "View details" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
  });

  it("completes an ended interview after confirming, then says so", async () => {
    mockList([interview({ canComplete: true })]);
    mutate.mockImplementation((_variables, options) => options.onSuccess());
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Mark as completed" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Mark interview as completed?" });
    expect(within(dialog).getByText("Phạm Minh Khoa · Thu, 15 Oct · 10:00. The application status doesn't change.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Complete" }));

    expect(mutate.mock.calls[0]![0]).toEqual({ id: "i1", status: "completed" });
    expect(showToast).toHaveBeenCalledWith({ message: "This interview is now marked as completed.", title: "Interview completed", tone: "success" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("marks an ended interview as no-show", async () => {
    mockList([interview({ canComplete: true })]);
    mutate.mockImplementation((_variables, options) => options.onSuccess());
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Mark as no-show" }));
    await user.click(within(await screen.findByRole("alertdialog", { name: "Mark as no-show?" })).getByRole("button", { name: "Mark as no-show" }));

    expect(mutate.mock.calls[0]![0]).toEqual({ id: "i1", status: "no_show" });
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Marked as no-show", tone: "success" }));
  });

  it("cancels an interview after confirming and says the applicant has been notified", async () => {
    mutate.mockImplementation((_variables, options) => options.onSuccess());
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Cancel interview" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Cancel interview with Phạm Minh Khoa?" });
    expect(within(dialog).getByText(/Thu, 15 Oct · 10:00\. They'll be notified\./)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel interview" }));

    expect(mutate.mock.calls[0]![0]).toEqual({ id: "i1", status: "cancelled" });
    expect(showToast).toHaveBeenCalledWith({ message: "Phạm Minh Khoa has been notified.", title: "Interview cancelled", tone: "success" });
  });

  it("changes nothing when the recruiter keeps the interview", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Cancel interview" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Keep interview" }));

    expect(mutate).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("explains that nothing was applied when someone else changed the interview first, and lets the recruiter move on", async () => {
    mutate.mockImplementation((_variables, options) => options.onError(failure(409, "INTERVIEW_STATUS_FINAL")));
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Cancel interview" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel interview" }));

    const stale = await screen.findByRole("alertdialog", { name: "This interview was already updated" });
    expect(showToast).not.toHaveBeenCalled();
    await user.click(within(stale).getByRole("button", { name: "Show latest" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("keeps the dialog open with the reason when the interview has not ended yet", async () => {
    mockList([interview({ canComplete: true })]);
    mutate.mockImplementation((_variables, options) => options.onError(failure(409, "INTERVIEW_NOT_ENDED")));
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Mark as completed" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Complete" }));

    expect(await screen.findByText("This interview hasn't ended yet. You can mark it once it ends.")).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("tells the recruiter with a toast when saving fails, and nothing is half done", async () => {
    mutate.mockImplementation((_variables, options) => options.onError(failure(500)));
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Cancel interview" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel interview" }));

    expect(showToast).toHaveBeenCalledWith({ message: "Could not cancel this interview. Please try again.", title: "Cancellation failed", tone: "error" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("locks the dialog while the change is being saved", async () => {
    mockMutation(true);
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(await screen.findByRole("menuitem", { name: "Cancel interview" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("button", { name: "Cancelling…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Keep interview" })).toBeDisabled();
  });
});
