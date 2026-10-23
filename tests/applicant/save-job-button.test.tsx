import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as sessionHook from "@/auth/use-session";
import { SaveJobButton } from "@/features/applicant/saved-jobs/components/save-job-button";
import * as savedJobsApi from "@/features/applicant/saved-jobs/saved-jobs.api";

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
      <MemoryRouter>{ui}</MemoryRouter>
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

  it("opens SignInToSaveDialog when guest clicks save", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: null,
    } as never);

    renderWithClient(<SaveJobButton jobId="job-1" />);

    const button = screen.getByRole("button", { name: /save/i });
    fireEvent.click(button);

    expect(await screen.findByText("Sign in to save jobs")).toBeInTheDocument();
    expect(
      screen.getByText("Saved jobs are private to your candidate account. You’ll come back to this job after signing in."),
    ).toBeInTheDocument();
  });

  it("triggers toggle mutation when candidate clicks save button", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });
    vi.mocked(savedJobsApi.toggleSaveJob).mockResolvedValue({
      saved: true,
      message: "Job added to wishlist successfully",
      id: "wl-1",
    });

    const onSaveSuccess = vi.fn();
    renderWithClient(<SaveJobButton jobId="job-1" onSaveSuccess={onSaveSuccess} />);

    const button = screen.getByRole("button", { name: /save/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(savedJobsApi.toggleSaveJob).toHaveBeenCalledWith("job-1");
      expect(onSaveSuccess).toHaveBeenCalled();
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
