import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as sessionHook from "@/auth/use-session";
import * as savedJobsApi from "@/features/applicant/saved-jobs/saved-jobs.api";
import { CareerPage } from "@/features/public-site/career/career-page";
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
    loadAllPublicJobs: vi.fn(),
    loadAllEnterprises: vi.fn(),
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

const mockJobs: publicSiteData.PublicJob[] = [
  {
    _id: "job-react-1",
    slug: "frontend-developer-react",
    title: "Frontend Developer (React)",
    location: "Ho Chi Minh City",
    employment_type: "full_time",
    level: "middle",
    salary_min: 25000000,
    salary_max: 35000000,
    currency: "VND",
    enterpriseId: "ent-lumen",
    createdAt: "2026-10-15T00:00:00Z",
    expires_at: "2026-11-15T00:00:00Z",
  },
];

function renderCareerPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/career"]}>
        <Routes>
          <Route element={<CareerPage />} path="/career" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Marketplace JobCard Save Button Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicSiteData.loadAllPublicJobs).mockResolvedValue(mockJobs);
    vi.mocked(publicSiteData.loadAllEnterprises).mockResolvedValue([
      {
        _id: "ent-lumen",
        name: "Lumen Labs",
        industry: "Software",
      },
    ]);
  });

  it("renders 40x40 icon button in JobCard and toggles save without navigating card", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "u-1", role: "user" } },
    } as never);
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({ isSaved: false });
    vi.mocked(savedJobsApi.saveJob).mockResolvedValue({
      message: "Job saved",
      wishlistId: "w-1",
      alreadySaved: false,
    });

    renderCareerPage();

    expect(await screen.findByText("Frontend Developer (React)")).toBeInTheDocument();
    const heartButton = screen.getByRole("button", { name: /save/i });
    expect(heartButton).toHaveClass("size-10");
    expect(heartButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(heartButton);

    await waitFor(() => {
      expect(savedJobsApi.saveJob).toHaveBeenCalledWith("job-react-1");
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "success",
          title: "Job saved",
        }),
      );
    });
  });

  it("intercepts guest clicks and forwards return path to sign-in modal without navigating", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({ data: null } as never);

    renderCareerPage();

    expect(await screen.findByText("Frontend Developer (React)")).toBeInTheDocument();
    const heartButton = screen.getByRole("button", { name: /save/i });

    fireEvent.click(heartButton);

    expect(await screen.findByRole("heading", { name: /sign in to save jobs/i })).toBeInTheDocument();
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute(
      "href",
      "/login?next=%2Fcareer%2Ffrontend-developer-react",
    );
  });

  it("does not render heart icon on job card for staff / recruiter accounts", async () => {
    vi.mocked(sessionHook.useSession).mockReturnValue({
      data: { user: { id: "hr-1", role: "recruiter" } },
    } as never);

    renderCareerPage();

    expect(await screen.findByText("Frontend Developer (React)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});
