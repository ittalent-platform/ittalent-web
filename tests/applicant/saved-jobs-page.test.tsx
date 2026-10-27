import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as savedJobsApi from "@/features/applicant/saved-jobs/saved-jobs.api";
import { SavedJobsPage } from "@/features/applicant/saved-jobs/saved-jobs-page";
import type { PaginatedWishlistResponse, SavedJobItem } from "@/features/applicant/saved-jobs/saved-jobs.types";

const mockShowToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: vi.fn() }),
}));

vi.mock("@/features/applicant/saved-jobs/saved-jobs.api", () => ({
  checkJobSaved: vi.fn(),
  saveJob: vi.fn(),
  removeSavedJob: vi.fn(),
  removeSavedJobById: vi.fn(),
  getSavedJobs: vi.fn(),
  clearUnavailableSavedJobs: vi.fn(),
  toggleSaveJob: vi.fn(),
}));

const mockAvailableJob: SavedJobItem = {
  id: "wishlist-1",
  jobId: "job-react-1",
  savedAt: "2026-10-25T10:00:00Z",
  availability: "available",
  isClosingSoon: true,
  title: "Frontend Developer (React)",
  slug: "frontend-developer-react",
  enterprise: {
    id: "ent-1",
    name: "Lumen Labs",
    logoUrl: null,
  },
  location: "Ho Chi Minh City",
  employmentType: "full-time",
  level: "mid",
  salaryMin: 25000000,
  salaryMax: 35000000,
  currency: "VND",
  expiresAt: "2026-10-28T00:00:00Z",
};

const mockUnavailableJob: SavedJobItem = {
  id: "wishlist-2",
  jobId: "job-closed-2",
  savedAt: "2026-09-12T10:00:00Z",
  availability: "unavailable",
  title: null,
  slug: null,
  enterprise: null,
  location: null,
  employmentType: null,
  level: null,
};

function createMockResponse(
  items: SavedJobItem[],
  total: number,
  page = 1,
  limit = 20,
): PaginatedWishlistResponse {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function renderSavedJobsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SavedJobsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Candidate SavedJobsPage Workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(savedJobsApi.getSavedJobs).mockImplementation(async (params) => {
      const status = params?.status || "all";
      const q = params?.q?.toLowerCase();

      let items = [mockAvailableJob, mockUnavailableJob];
      if (status === "available") {
        items = [mockAvailableJob];
      } else if (status === "unavailable") {
        items = [mockUnavailableJob];
      }

      if (q) {
        items = items.filter(
          (j) =>
            j.title?.toLowerCase().includes(q) ||
            j.enterprise?.name?.toLowerCase().includes(q),
        );
      }

      const total = items.length;
      return createMockResponse(items, total, params?.page || 1, params?.limit || 20);
    });
  });

  it("renders page title, toolbar with search input and segmented tabs with counts", async () => {
    renderSavedJobsPage();

    expect(await screen.findByRole("heading", { name: "Saved jobs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^all/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^available/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /no longer available/i })).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Search title, company, city or skill"),
    ).toBeInTheDocument();
  });

  it("renders available job card with company monogram, salary, urgent tag, and Apply button", async () => {
    renderSavedJobsPage();

    expect(await screen.findByText("Frontend Developer (React)")).toBeInTheDocument();
    expect(screen.getByText("Lumen Labs")).toBeInTheDocument();
    expect(screen.getByText("25–35M VND / mo")).toBeInTheDocument();
    expect(screen.getByText("Closes in 2 days")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute(
      "href",
      "/career/frontend-developer-react",
    );
  });

  it("renders unavailable job card with obfuscated copy and no Apply link", async () => {
    renderSavedJobsPage();

    expect(
      await screen.findByText("This job is no longer available"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "It may have closed, passed its deadline or been taken down. Its details are hidden.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("No longer available").length).toBeGreaterThanOrEqual(2);
  });

  it("removes available job immediately with Undo toast, and restores when Undo is clicked", async () => {
    vi.mocked(savedJobsApi.removeSavedJobById).mockResolvedValue({
      removed: true,
      message: "Removed",
    });
    vi.mocked(savedJobsApi.saveJob).mockResolvedValue({
      alreadySaved: false,
      message: "Saved",
      wishlistId: "wishlist-1",
    });

    renderSavedJobsPage();

    expect(await screen.findByText("Frontend Developer (React)")).toBeInTheDocument();
    const removeButtons = screen.getAllByRole("button", {
      name: "Saved. Remove from saved jobs",
    });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(savedJobsApi.removeSavedJobById).toHaveBeenCalledWith("wishlist-1");
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "success",
          title: "Removed from saved jobs",
          action: expect.objectContaining({ label: "Undo" }),
        }),
      );
    });

    // Simulate clicking Undo action in toast
    const toastCall = mockShowToast.mock.calls[0][0];
    toastCall.action.onClick();

    await waitFor(() => {
      expect(savedJobsApi.saveJob).toHaveBeenCalledWith("job-react-1");
    });
  });

  it("opens confirmation modal when removing an unavailable job and confirms deletion", async () => {
    vi.mocked(savedJobsApi.removeSavedJobById).mockResolvedValue({
      removed: true,
      message: "Removed",
    });

    renderSavedJobsPage();

    expect(
      await screen.findByText("This job is no longer available"),
    ).toBeInTheDocument();
    const removeButtons = screen.getAllByRole("button", {
      name: "Saved. Remove from saved jobs",
    });
    fireEvent.click(removeButtons[1]); // second card is unavailable

    expect(
      await screen.findByRole("heading", { name: "Remove this saved job?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "It's no longer available, so you can't save it again unless the employer reopens it.",
      ),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: "Remove" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(savedJobsApi.removeSavedJobById).toHaveBeenCalledWith("wishlist-2");
    });
  });

  it("filters by 'No longer available' tab and displays custom subtitle", async () => {
    renderSavedJobsPage();

    const unavailableTab = await screen.findByRole("tab", {
      name: /no longer available/i,
    });
    fireEvent.click(unavailableTab);

    await waitFor(() => {
      expect(
        screen.getByText(
          /saved jobs are no longer available · you can only remove them/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows all-available green callout banner when 0 unavailable jobs exist", async () => {
    vi.mocked(savedJobsApi.getSavedJobs).mockImplementation(async (params) => {
      if (params?.status === "unavailable") {
        return createMockResponse([], 0);
      }
      return createMockResponse([mockAvailableJob], 1);
    });

    renderSavedJobsPage();

    const unavailableTab = await screen.findByRole("tab", {
      name: /no longer available/i,
    });
    fireEvent.click(unavailableTab);

    expect(
      await screen.findByText("All your saved jobs are still available"),
    ).toBeInTheDocument();
    const showAllBtn = screen.getByRole("button", { name: "Show all" });
    fireEvent.click(showAllBtn);

    expect(screen.getByRole("tab", { name: /all/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("handles search input, character counter, and clear search", async () => {
    renderSavedJobsPage();

    const searchInput = await screen.findByPlaceholderText(
      "Search title, company, city or skill",
    );
    fireEvent.change(searchInput, { target: { value: "react" } });

    expect(screen.getByText("5 / 100")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue("");
  });

  it("shows over-limit alert when keyword exceeds 100 characters", async () => {
    renderSavedJobsPage();

    const searchInput = await screen.findByPlaceholderText(
      "Search title, company, city or skill",
    );
    const longText = "a".repeat(105);
    fireEvent.change(searchInput, { target: { value: longText } });

    expect(screen.getByText("105 / 100")).toBeInTheDocument();
    expect(screen.getByText("Use up to 100 characters.")).toBeInTheDocument();
  });

  it("displays empty state when candidate has 0 saved jobs", async () => {
    vi.mocked(savedJobsApi.getSavedJobs).mockResolvedValue(
      createMockResponse([], 0),
    );

    renderSavedJobsPage();

    expect(await screen.findByText("No saved jobs yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse jobs" })).toHaveAttribute(
      "href",
      "/career",
    );
  });

  it("displays error recovery banner on query failure with retry action", async () => {
    vi.mocked(savedJobsApi.getSavedJobs).mockRejectedValue(
      new Error("Network Error"),
    );

    renderSavedJobsPage();

    expect(
      await screen.findByText("Your saved jobs didn’t load"),
    ).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: "Try again" });
    expect(retryBtn).toBeInTheDocument();
  });
});
