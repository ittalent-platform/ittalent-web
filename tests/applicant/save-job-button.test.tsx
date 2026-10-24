import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as sessionHook from "@/auth/use-session";
import { SaveJobButton } from "@/features/applicant/saved-jobs/components/save-job-button";
import * as savedJobsApi from "@/features/applicant/saved-jobs/saved-jobs.api";

const mockShowToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: vi.fn() }),
}));

vi.mock("@/auth/use-session", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/features/applicant/saved-jobs/saved-jobs.api", () => ({
  checkJobSaved: vi.fn(),
  clearUnavailableSavedJobs: vi.fn(),
  getSavedJobs: vi.fn(),
  removeSavedJob: vi.fn(),
  removeSavedJobById: vi.fn(),
  saveJob: vi.fn(),
  toggleSaveJob: vi.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/jobs/frontend-dev"]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SaveJobButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Save' pill button in unsaved state", () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });

    renderWithClient(<SaveJobButton jobId="job-1" />);

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders 'Saved' pill button with aria-pressed=true when job is saved", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: true, wishlistId: "wl-1" });

    renderWithClient(<SaveJobButton jobId="job-1" />);

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /saved/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  it("opens SignInToSaveDialog with next param when guest clicks save", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: null,
    } as never);

    renderWithClient(<SaveJobButton jobId="job-1" />);

    const button = screen.getByRole("button", { name: /save/i });
    fireEvent.click(button);

    expect(await screen.findByText("Sign in to save jobs")).toBeInTheDocument();
    expect(
      screen.getByText("Saved jobs are private to your candidate account. Sign in to return directly to this job."),
    ).toBeInTheDocument();

    const signInLink = screen.getByRole("link", { name: "Sign in" });
    expect(signInLink).toHaveAttribute("href", expect.stringContaining("next="));
    expect(signInLink).not.toHaveAttribute("href", expect.stringContaining("redirect="));

    const registerLink = screen.getByRole("link", { name: "Create an account" });
    expect(registerLink).toHaveAttribute("href", expect.stringContaining("next="));
  });

  it("triggers idempotent saveJob mutation and shows toast when candidate clicks save", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });
    vi.mocked(savedJobsApi.saveJob).mockResolvedValue({
      saved: true,
      message: "Job added to wishlist successfully",
      id: "wl-1",
    });

    const onSaveSuccess = vi.fn();
    renderWithClient(<SaveJobButton jobId="job-1" onSaveSuccess={onSaveSuccess} />);

    const button = screen.getByRole("button", { name: /save/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(savedJobsApi.saveJob).toHaveBeenCalledWith("job-1");
      expect(savedJobsApi.toggleSaveJob).not.toHaveBeenCalled();
      expect(onSaveSuccess).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "success",
          title: "Job saved",
          action: expect.objectContaining({ label: "View saved jobs" }),
        }),
      );
    });
  });

  it("triggers idempotent removeSavedJob mutation and shows toast when candidate clicks saved", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: true, wishlistId: "wl-1" });
    vi.mocked(savedJobsApi.removeSavedJob).mockResolvedValue({
      removed: true,
      message: "Job removed from wishlist",
    });

    const onRemoveSuccess = vi.fn();
    renderWithClient(<SaveJobButton jobId="job-1" onRemoveSuccess={onRemoveSuccess} />);

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /saved/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(savedJobsApi.removeSavedJob).toHaveBeenCalledWith("job-1");
      expect(savedJobsApi.toggleSaveJob).not.toHaveBeenCalled();
      expect(onRemoveSuccess).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "success",
          title: "Removed from saved jobs",
          action: expect.objectContaining({ label: "Undo" }),
        }),
      );
    });
  });

  it("shows server message for 4xx errors (e.g. job closed)", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });
    const clientError = Object.assign(new Error("This job is no longer open, so it can't be saved"), {
      status: 400,
    });
    vi.mocked(savedJobsApi.saveJob).mockRejectedValue(clientError);

    renderWithClient(<SaveJobButton jobId="job-1" />);

    const button = screen.getByRole("button", { name: /save/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          title: "Couldn't save job",
          message: "This job is no longer open, so it can't be saved",
        }),
      );
    });
  });

  it("shows friendly fallback message for 5xx server errors", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });
    const serverError = Object.assign(new Error("Database is down"), {
      status: 500,
    });
    vi.mocked(savedJobsApi.saveJob).mockRejectedValue(serverError);

    renderWithClient(<SaveJobButton jobId="job-1" />);

    const button = screen.getByRole("button", { name: /save/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          title: "Couldn't save job",
          message: "Couldn't save. Try again",
        }),
      );
    });
  });

  it("renders disabled state for staff / non-candidate accounts", () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "admin-1", role: "admin" } },
    } as never);

    renderWithClient(<SaveJobButton jobId="job-1" />);

    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toHaveAttribute("title", "Saving jobs is for candidate accounts");
    expect(button).toHaveClass("cursor-not-allowed");
  });
});
