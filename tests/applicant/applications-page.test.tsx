import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationDetailDto, ApplicationHistoryResponse, ApplicationListResponse } from "@/api/generated/types.gen";
import { ApplicationsPage } from "@/features/applicant/applications/applications-page";
import { ApplicationDetailPage } from "@/features/applicant/applications/application-detail-page";
import * as applicationQueries from "@/features/applicant/applications/applications.queries";

vi.mock("@/features/applicant/applications/applications.queries", () => ({
  useApplications: vi.fn(),
  useApplication: vi.fn(),
  useApplicationHistory: vi.fn(),
  useWithdrawApplications: vi.fn(),
  requestStatus: (error: unknown) => (error as { status?: number } | null)?.status,
}));

const showToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({ useToast: () => ({ showToast, dismissToast: vi.fn() }) }));

const id = "507f1f77bcf86cd799439011";
const summary: ApplicationListResponse["items"][number] = {
  reappliedFrom: null, reappliedAs: null, canApplyAgain: false,
  id, jobId: "507f1f77bcf86cd799439012", job: { title: "Kỹ sư Backend", companyName: "Công ty An", location: "Hà Nội", jobType: "Full-time", deadline: null, publicStatus: "closed" },
  status: "submitted", reviewStage: null, submittedDocuments: [], canWithdraw: true, submittedAt: "2026-09-01T10:00:00.000Z", latestStatusAt: "2026-09-02T10:00:00.000Z", withdrawnAt: null,
};
const list: ApplicationListResponse = { items: [summary], total: 1, totalPages: 1, page: 1, limit: 10, statusCounts: { submitted: 1, under_review: 0, interviewing: 0, offered: 0, hired: 0, rejected: 0, withdrawn: 0, position_filled: 0 } };
const detail: ApplicationDetailDto = { ...summary, message: null, withdrawalReason: null, attachments: [], version: 0, createdAt: summary.submittedAt, updatedAt: summary.latestStatusAt };
const history: ApplicationHistoryResponse = { items: [{ status: "submitted", reviewStage: null, actorRole: "candidate", occurredAt: summary.submittedAt }], page: 1, limit: 100, total: 1, totalPages: 1 };

function renderApp(initial: string) {
  return render(<MemoryRouter initialEntries={[initial]}><Routes><Route element={<ApplicationsPage />} path="/my-applications" /><Route element={<ApplicationDetailPage />} path="/my-applications/:id" /></Routes></MemoryRouter>);
}

function mockWithdraw(mutateAsync = vi.fn().mockResolvedValue({ succeeded: 1, failed: [] })) {
  vi.mocked(applicationQueries.useWithdrawApplications).mockReturnValue({ mutateAsync, isPending: false, isError: false } as unknown as ReturnType<typeof applicationQueries.useWithdrawApplications>);
  return mutateAsync;
}

describe("Candidate My Applications", () => {
  beforeEach(() => {
    showToast.mockClear();
    vi.mocked(applicationQueries.useApplications).mockReturnValue({ data: list, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplications>);
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: detail, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplication>);
    vi.mocked(applicationQueries.useApplicationHistory).mockReturnValue({ data: history, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplicationHistory>);
    mockWithdraw();
  });

  it("shows server results in the table and switches to the board", async () => {
    renderApp("/my-applications");
    expect(screen.getByRole("link", { name: /Kỹ sư Backend/ })).toBeInTheDocument();
    expect(screen.getByText("APP-9011")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Board" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByRole("region", { name: "Submitted" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select APP-9011" })).toBeInTheDocument();
  });

  it("sends several statuses to the server, resets the page and keeps them in the URL", async () => {
    renderApp("/my-applications?page=3");
    fireEvent.click(screen.getByRole("button", { name: /Status:/ }));
    fireEvent.click(await screen.findByRole("button", { name: "In progress" }));
    await waitFor(() => expect(applicationQueries.useApplications).toHaveBeenCalledWith(expect.objectContaining({ page: 1, status: "submitted,under_review,interviewing,offered" }), expect.anything()));
  });

  it("shows keyword validation instead of searching a blank keyword (UC-MYAPP-05.EX.2)", () => {
    renderApp("/my-applications?search=%20%20");
    expect(screen.getByText(/Enter a keyword/)).toBeInTheDocument();
    expect(applicationQueries.useApplications).toHaveBeenLastCalledWith(expect.anything(), { enabled: false });
  });

  it("shows filter validation for a contradictory custom date range (UC-MYAPP-05.EX.3)", () => {
    renderApp("/my-applications?range=custom&from=2026-09-30&to=2026-01-01");
    expect(screen.getAllByText(/start date must not be after/)[0]).toBeInTheDocument();
    expect(screen.getByText("These search criteria aren't valid.")).toBeInTheDocument();
    expect(applicationQueries.useApplications).toHaveBeenLastCalledWith(expect.anything(), { enabled: false });
  });

  it("shows filter validation for an unsupported status in the link", () => {
    renderApp("/my-applications?status=archived");
    expect(screen.getByText("These search criteria aren't valid.")).toBeInTheDocument();
  });

  it("sorts by a table header through the URL", async () => {
    renderApp("/my-applications");
    fireEvent.click(screen.getByRole("button", { name: /^Updated/ }));
    await waitFor(() => expect(applicationQueries.useApplications).toHaveBeenCalledWith(expect.objectContaining({ sortBy: "latestStatusAt", sortOrder: "desc" }), expect.anything()));
    fireEvent.click(screen.getByRole("button", { name: /^Updated/ }));
    await waitFor(() => expect(applicationQueries.useApplications).toHaveBeenCalledWith(expect.objectContaining({ sortBy: "latestStatusAt", sortOrder: "asc" }), expect.anything()));
  });

  it("tags a reapplication and links both records (BR-APP-008)", () => {
    const earlier = "507f1f77bcf86cd7994390aa";
    vi.mocked(applicationQueries.useApplications).mockReturnValue({ data: { ...list, items: [{ ...summary, reappliedFrom: earlier }, { ...summary, id: earlier, status: "withdrawn", canWithdraw: false, reappliedAs: id, reappliedFrom: null }] }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplications>);
    renderApp("/my-applications");
    expect(screen.getByRole("link", { name: "2nd application" })).toHaveAttribute("href", `/my-applications/${earlier}`);
    expect(screen.getByRole("link", { name: /Reapplied as APP-/ })).toHaveAttribute("href", `/my-applications/${id}`);
  });

  it("shows the empty-state guidance when the candidate has no applications (UC-MYAPP-01.AC.1)", () => {
    vi.mocked(applicationQueries.useApplications).mockReturnValue({ data: { ...list, items: [], total: 0, totalPages: 0 }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplications>);
    renderApp("/my-applications");
    expect(screen.getByRole("heading", { name: "No applications yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse jobs" })).toBeInTheDocument();
  });

  it("offers a retry when retrieval fails (UC-MYAPP-01.EX.4)", () => {
    const refetch = vi.fn();
    vi.mocked(applicationQueries.useApplications).mockReturnValue({ data: undefined, isPending: false, isError: true, refetch } as unknown as ReturnType<typeof applicationQueries.useApplications>);
    renderApp("/my-applications");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load your applications.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("selecting a board card offers withdraw and confirms with the shared dialog", async () => {
    const mutateAsync = mockWithdraw();
    renderApp("/my-applications?view=board");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select APP-9011" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    const dialog = screen.getByRole("alertdialog", { name: "Withdraw this application?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Withdraw application" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith([{ id }]));
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ tone: "success" }));
  });

  it("shows public detail and history and requires confirmation before withdrawal", () => {
    renderApp(`/my-applications/${id}`);
    expect(screen.getByRole("heading", { name: "Kỹ sư Backend" })).toBeInTheDocument();
    expect(screen.getByText(/by You/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw application" }));
    expect(screen.getByRole("alertdialog", { name: "Withdraw this application?" })).toBeInTheDocument();
    expect(screen.getByText(/can’t apply to it again/)).toBeInTheDocument();
    expect(vi.mocked(applicationQueries.useWithdrawApplications).mock.results.at(-1)?.value.mutateAsync).not.toHaveBeenCalled();
  });

  it("cancels without mutating and submits the expected version after confirmation", async () => {
    const mutateAsync = mockWithdraw();
    renderApp(`/my-applications/${id}`);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw application" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep application" }));
    expect(mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw application" }));
    const dialog = screen.getByRole("alertdialog", { name: "Withdraw this application?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Withdraw application" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith([{ id, expectedVersion: 0 }]));
  });

  it("shows a not-found state for an application that is not the candidate's", () => {
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: undefined, isPending: false, isError: true, error: { status: 404 } } as unknown as ReturnType<typeof applicationQueries.useApplication>);
    renderApp(`/my-applications/${id}`);
    expect(screen.getByRole("heading", { name: "Application not found" })).toBeInTheDocument();
  });

  it("shows validation guidance for a malformed application id (UC-MYAPP-02.EX.3)", () => {
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: undefined, isPending: false, isError: true, error: { status: 400 } } as unknown as ReturnType<typeof applicationQueries.useApplication>);
    renderApp("/my-applications/not-an-id");
    expect(screen.getByRole("heading", { name: "This link isn't valid" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to my applications" })).toBeInTheDocument();
  });

  it("offers a retry when the detail cannot be retrieved (UC-MYAPP-02.EX.5)", () => {
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: undefined, isPending: false, isError: true, error: { status: 500 }, refetch: vi.fn() } as unknown as ReturnType<typeof applicationQueries.useApplication>);
    renderApp(`/my-applications/${id}`);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load your applications.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows an empty history state (UC-MYAPP-03.AC.1) and a history retry (EX.4)", () => {
    vi.mocked(applicationQueries.useApplicationHistory).mockReturnValue({ data: { ...history, items: [], total: 0 }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplicationHistory>);
    const view = renderApp(`/my-applications/${id}`);
    expect(screen.getByText("No status events yet")).toBeInTheDocument();
    view.unmount();
    const refetch = vi.fn();
    vi.mocked(applicationQueries.useApplicationHistory).mockReturnValue({ data: undefined, isPending: false, isError: true, refetch } as unknown as ReturnType<typeof applicationQueries.useApplicationHistory>);
    renderApp(`/my-applications/${id}`);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it.each(["interviewing", "offered", "hired", "rejected", "position_filled", "withdrawn"] as const)("hides Withdraw for %s (UC-MYAPP-04.EX.3)", (status) => {
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: { ...detail, status, canWithdraw: false }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplication>);
    renderApp(`/my-applications/${id}`);
    expect(screen.queryByRole("button", { name: "Withdraw application" })).not.toBeInTheDocument();
  });

  it("offers Apply again only for a withdrawn first application (BR-APP-008)", () => {
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: { ...detail, status: "withdrawn", canWithdraw: false, canApplyAgain: true, withdrawnAt: detail.submittedAt }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplication>);
    renderApp(`/my-applications/${id}`);
    expect(screen.getByRole("link", { name: "Apply again" })).toHaveAttribute("href", `/jobs/${detail.jobId}`);
  });

  it("warns that a reapplication cannot be applied for again when withdrawing it (UC-MYAPP-04 Assumption 2)", () => {
    vi.mocked(applicationQueries.useApplication).mockReturnValue({ data: { ...detail, reappliedFrom: "507f1f77bcf86cd7994390aa" }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplication>);
    renderApp(`/my-applications/${id}`);
    expect(screen.getByText("Your second application to this job")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw application" }));
    expect(screen.getByText(/already your second application/)).toBeInTheDocument();
  });

  it("reports a partial bulk withdrawal and leaves the failed application listed (UC-MYAPP-04.AC.3)", async () => {
    const second = "507f1f77bcf86cd7994390bb";
    vi.mocked(applicationQueries.useApplications).mockReturnValue({ data: { ...list, items: [summary, { ...summary, id: second }], total: 2 }, isPending: false, isError: false } as ReturnType<typeof applicationQueries.useApplications>);
    const mutateAsync = mockWithdraw(vi.fn().mockResolvedValue({ succeeded: 1, failed: [{ id: second, error: { status: 409 } }] }));
    renderApp("/my-applications?view=board");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select APP-9011" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select APP-90BB" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    const dialog = screen.getByRole("alertdialog", { name: "Withdraw 2 applications?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Withdraw 2 applications" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(await screen.findByText(/1 withdrawn, 1 left unchanged/)).toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Withdraw this application?" })).toBeInTheDocument();
  });

  it("does not open the withdraw dialog when a card is dropped on a company-only column (UC-MYAPP-04.EX.6)", () => {
    renderApp("/my-applications?view=board");
    const card = screen.getByRole("link", { name: /Kỹ sư Backend/ }).closest("[draggable]")!;
    const dataTransfer = { setData: vi.fn(), getData: () => id, effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(screen.getByRole("region", { name: "Interviewing" }), { dataTransfer });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(screen.getByRole("region", { name: "Withdrawn" }), { dataTransfer });
    expect(screen.getByRole("alertdialog", { name: "Withdraw this application?" })).toBeInTheDocument();
  });
});
