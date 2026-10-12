import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobPosting, JobPostingHistory } from "@/api/generated/types.gen";
import { JobPostingDetailPage } from "@/features/job-postings/job-posting-detail-page";
import * as jobQueries from "@/features/job-postings/job-postings.queries";

vi.mock("@/features/job-postings/job-postings.queries", () => ({
  deleteJobPosting: vi.fn(),
  jobPostingKeys: {
    detail: (id: string) => ["job-postings", "detail", id],
    history: (id: string) => ["job-postings", "history", id],
    root: (actor: string) => ["job-postings", actor],
  },
  moveJobPostingToDraft: vi.fn(),
  publishJobPosting: vi.fn(),
  transitionJobPosting: vi.fn(),
  useJobPosting: vi.fn(),
  useJobPostingHistory: vi.fn(),
}));

const showToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ dismissToast: vi.fn(), showToast }),
}));

const posting: JobPosting = {
  applicationCount: 2,
  benefits: "Health insurance and a learning budget.",
  createdAt: "2026-10-01T08:00:00.000Z",
  currency: "VND",
  description: "Build reliable products for our customers.",
  employmentType: "Full-time",
  enterprise: { id: "enterprise-1", logoUrl: null, name: "Acme" },
  enterpriseId: "enterprise-1",
  expiresAt: "2099-12-31T16:59:59.999Z",
  id: "507f1f77bcf86cd799439011",
  location: "Ho Chi Minh City",
  postedByUserId: "507f1f77bcf86cd799439012",
  recruitmentStatus: "open",
  requirements: "Strong TypeScript and React experience.",
  salaryNegotiable: true,
  slug: "platform-engineer",
  status: "published",
  title: "Platform engineer",
  updatedAt: "2026-10-02T08:00:00.000Z",
};

const history: JobPostingHistory = {
  items: [
    {
      action: "publish",
      actorUserId: "507f1f77bcf86cd799439012",
      id: "507f1f77bcf86cd799439013",
      occurredAt: "2026-10-02T08:00:00.000Z",
    },
  ],
  limit: 100,
  page: 1,
  total: 1,
  totalPages: 1,
};

function renderPage(actor: "admin" | "recruiter", value = posting) {
  vi.mocked(jobQueries.useJobPosting).mockReturnValue({
    data: value,
    isError: false,
    isPending: false,
  } as ReturnType<typeof jobQueries.useJobPosting>);
  vi.mocked(jobQueries.useJobPostingHistory).mockReturnValue({
    data: history,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof jobQueries.useJobPostingHistory>);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/${actor}/job-postings/${posting.id}`]}>
        <Routes>
          <Route
            element={<JobPostingDetailPage actor={actor} />}
            path={`/${actor}/job-postings/:jobPostingId`}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("JobPostingDetailPage lifecycle", () => {
  beforeEach(() => {
    showToast.mockClear();
    vi.mocked(jobQueries.transitionJobPosting).mockResolvedValue(posting);
    vi.mocked(jobQueries.moveJobPostingToDraft).mockResolvedValue({
      ...posting,
      recruitmentStatus: "closed",
      status: "draft",
    });
  });

  it("shows only valid actions for an open published job and renders history", () => {
    renderPage("recruiter");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Move to draft" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
    expect(screen.getByText("Job published")).toBeInTheDocument();
    expect(screen.getByText(/User 439012/)).toBeInTheDocument();
  });

  it("confirms archive for a closed job and calls the real transition adapter", async () => {
    const closed: JobPosting = {
      ...posting,
      recruitmentStatus: "closed",
      status: "closed",
    };
    vi.mocked(jobQueries.transitionJobPosting).mockResolvedValue({
      ...closed,
      status: "archived",
    });
    renderPage("recruiter", closed);

    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(
      screen.getByRole("heading", { name: "Archive “Platform engineer”?" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive job" }));

    await waitFor(() =>
      expect(jobQueries.transitionJobPosting).toHaveBeenCalledWith(
        posting.id,
        "archive",
      ),
    );
  });

  it("keeps lifecycle controls read-only for administrators", () => {
    renderPage("admin");
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Move to draft/ })).toBeNull();
    expect(screen.getByText("Job published")).toBeInTheDocument();
  });
});
