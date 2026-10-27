import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as sessionHook from "@/auth/use-session";
import * as savedJobsApi from "@/features/applicant/saved-jobs/saved-jobs.api";
import { CareerJobPage } from "@/features/public-site/career/career-job-page";
import * as publicSiteData from "@/features/public-site/shared/public-site.data";

const mockShowToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: vi.fn() }),
}));

vi.mock("@/auth/use-session", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/features/public-site/shared/public-site.data", async (importOriginal) => {
  const actual = await importOriginal<typeof publicSiteData>();
  return {
    ...actual,
    loadPublicJob: vi.fn(),
    loadEnterprise: vi.fn(),
    loadEnterpriseOpenJobs: vi.fn(),
  };
});

vi.mock("@/features/applicant/saved-jobs/saved-jobs.api", () => ({
  checkJobSaved: vi.fn(),
  saveJob: vi.fn(),
  removeSavedJob: vi.fn(),
  removeSavedJobById: vi.fn(),
  getSavedJobs: vi.fn(),
  clearUnavailableSavedJobs: vi.fn(),
  toggleSaveJob: vi.fn(),
}));

const mockJob: publicSiteData.PublicJob = {
  _id: "job-101",
  slug: "senior-backend-engineer-go",
  title: "Senior Backend Engineer (Go)",
  location: "Ha Noi",
  employment_type: "full_time",
  level: "senior",
  openings: 2,
  salary_min: 45000000,
  salary_max: 60000000,
  currency: "VND",
  aboutTheRole: "Design and build Go services.",
  requirements: "5+ years backend.",
  benefits: "Insurance, Annual bonus",
  enterpriseId: "ent-1",
  createdAt: "2026-10-10T00:00:00Z",
  expires_at: "2026-10-30T00:00:00Z",
};

function renderCareerJobPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/career/senior-backend-engineer-go"]}>
        <Routes>
          <Route element={<CareerJobPage />} path="/career/:slug" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CareerJobPage Save Job Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicSiteData.loadPublicJob).mockResolvedValue(mockJob);
    vi.mocked(publicSiteData.loadEnterprise).mockResolvedValue({
      _id: "ent-1",
      name: "Nimbus Pay",
      industry: "Fintech",
    });
    vi.mocked(publicSiteData.loadEnterpriseOpenJobs).mockResolvedValue([]);
  });

  it("mounts SaveJobButton in the header and shows 'Save' when unsaved for candidates", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });

    renderCareerJobPage();

    expect(await screen.findByRole("heading", { name: /Senior Backend Engineer \(Go\)/i })).toBeInTheDocument();
    const saveButton = await screen.findByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute("aria-pressed", "false");
  });

  it("triggers save mutation and displays toast when candidate clicks Save", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });
    vi.mocked(savedJobsApi.saveJob).mockResolvedValue({
      message: "Job saved",
      wishlistId: "w-1",
      alreadySaved: false,
    });

    renderCareerJobPage();

    const saveButton = await screen.findByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(savedJobsApi.saveJob).toHaveBeenCalledWith("job-101");
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "success",
          title: "Job saved",
          action: expect.objectContaining({
            label: "View saved jobs",
          }),
        }),
      );
    });
  });

  it("shows 'Saved' state when already bookmarked", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: true, wishlistId: "w-1" });

    renderCareerJobPage();

    const savedButton = await screen.findByRole("button", { name: /saved/i });
    expect(savedButton).toHaveAttribute("aria-pressed", "true");
    expect(savedButton).toHaveAttribute("title", "Click to remove from saved jobs");
  });

  it("intercepts unauthenticated guests and opens sign-in modal with next url", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({ data: null } as never);

    renderCareerJobPage();

    const saveButton = await screen.findByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(await screen.findByRole("heading", { name: /sign in to save jobs/i })).toBeInTheDocument();
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute(
      "href",
      "/login?next=%2Fcareer%2Fsenior-backend-engineer-go",
    );
  });
});
