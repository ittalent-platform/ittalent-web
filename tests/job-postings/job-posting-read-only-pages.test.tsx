import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobPosting, JobPostingHistory } from "@/api/generated/types.gen";
import { JobPostingReadOnlyDetailPage } from "@/features/job-postings/job-posting-read-only-detail-page";
import { JobPostingReadOnlyListPage } from "@/features/job-postings/job-posting-read-only-list-page";
import * as jobQueries from "@/features/job-postings/job-postings.queries";

vi.mock("@/features/job-postings/job-postings.queries", () => ({
  useJobPosting: vi.fn(),
  useJobPostingHistory: vi.fn(),
  useJobPostingList: vi.fn(),
}));

vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ dismissToast: vi.fn(), showToast: vi.fn() }),
}));

const base: JobPosting = {
  applicationCount: 24,
  benefits: "Health insurance.",
  createdAt: "2026-10-01T09:40:00.000Z",
  currency: "USD",
  description: "Build and run the payment services.",
  employmentType: "Full-time",
  enterprise: { id: "enterprise-1", logoUrl: null, name: "Nova Fintech" },
  enterpriseId: "enterprise-1",
  expiresAt: "2099-10-31T16:59:59.999Z",
  id: "507f1f77bcf86cd799430142",
  location: "Ho Chi Minh City",
  openings: 2,
  postedByUserId: "507f1f77bcf86cd799439012",
  publishedAt: "2026-10-02T02:05:00.000Z",
  recruitmentStatus: "open",
  requirements: "3+ years with Go.",
  salaryMax: 2800,
  salaryMin: 1800,
  salaryNegotiable: false,
  slug: "backend-developer-go",
  status: "published",
  title: "Backend Developer (Go)",
  updatedAt: "2026-10-05T07:20:00.000Z",
};

const expired: JobPosting = {
  ...base,
  expiresAt: "2020-10-06T16:59:59.999Z",
  id: "507f1f77bcf86cd799430138",
  recruitmentStatus: "closed",
  title: "Frontend Engineer (React)",
};

const draft: JobPosting = {
  ...base,
  applicationCount: 0,
  expiresAt: undefined,
  id: "507f1f77bcf86cd799430151",
  publishedAt: undefined,
  recruitmentStatus: "closed",
  status: "draft",
  title: "Senior Platform Engineer",
};

const history: JobPostingHistory = {
  items: [
    {
      action: "update",
      actorUserId: "507f1f77bcf86cd799439012",
      changedFields: ["salary_min"],
      id: "h3",
      occurredAt: "2026-10-05T07:20:00.000Z",
    },
    { action: "publish", actorUserId: "u2", id: "h2", occurredAt: "2026-10-02T02:05:00.000Z" },
    { action: "create", actorUserId: "u1", id: "h1", occurredAt: "2026-10-01T09:40:00.000Z" },
  ],
  limit: 100,
  page: 1,
  total: 3,
  totalPages: 1,
};

function renderList(items: JobPosting[]) {
  vi.mocked(jobQueries.useJobPostingList).mockReturnValue({
    data: { items, limit: 10, page: 1, total: items.length, totalPages: 1 },
    isError: false,
    isPending: false,
  } as unknown as ReturnType<typeof jobQueries.useJobPostingList>);
  return render(
    <MemoryRouter initialEntries={["/recruiter/job-postings"]}>
      <JobPostingReadOnlyListPage companyName="Nova Fintech" />
    </MemoryRouter>,
  );
}

function renderDetail(posting: JobPosting) {
  vi.mocked(jobQueries.useJobPosting).mockReturnValue({
    data: posting,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof jobQueries.useJobPosting>);
  vi.mocked(jobQueries.useJobPostingHistory).mockReturnValue({
    data: history,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof jobQueries.useJobPostingHistory>);
  return render(
    <MemoryRouter initialEntries={[`/recruiter/job-postings/${posting.id}`]}>
      <Routes>
        <Route element={<JobPostingReadOnlyDetailPage />} path="/recruiter/job-postings/:jobPostingId" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JobPostingReadOnlyListPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the company's jobs with the design columns and no create or row actions", () => {
    renderList([draft, base, expired]);

    expect(screen.getByText("3 job postings in Nova Fintech · newest created first")).toBeInTheDocument();
    for (const header of ["Job", "Status", "Deadline", "Applications", "Created", "Published"])
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /actions for/i })).toBeNull();

    const row = screen.getByRole("row", { name: /Backend Developer \(Go\)/ });
    expect(within(row).getByText("JOB-0142 · Ho Chi Minh City")).toBeInTheDocument();
    expect(within(row).getByText("24")).toBeInTheDocument();
    expect(within(row).getByRole("link")).toHaveAttribute("href", `/recruiter/job-postings/${base.id}`);
    expect(within(screen.getByRole("row", { name: /Senior Platform Engineer/ })).getByText("Not published")).toBeInTheDocument();
  });

  it("marks a passed deadline in red with a label", () => {
    renderList([expired]);
    const row = screen.getByRole("row", { name: /Frontend Engineer/ });
    expect(within(row).getByText("Deadline passed")).toBeInTheDocument();
    expect(within(row).getByText("06/10/2020")).toHaveClass("text-destructive");
  });

  it("shows the empty state without a create action", () => {
    renderList([]);
    expect(screen.getByText("No job postings in Nova Fintech yet")).toBeInTheDocument();
    expect(screen.getByText("When your HR team creates a job posting, it will appear here.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create/i })).toBeNull();
  });
});

describe("JobPostingReadOnlyDetailPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows status, details, applications and activity without lifecycle buttons", () => {
    renderDetail(base);

    expect(screen.getByRole("heading", { name: "Backend Developer (Go)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    for (const name of ["Edit", "Publish", "Close", "Move to draft", "Archive", "Reopen", "Restore", "Actions", "View applications"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
      expect(screen.queryByRole("link", { name })).toBeNull();
    }

    expect(screen.getByText("Accepting applications")).toBeInTheDocument();
    expect(screen.getByText("1,800 – 2,800 USD")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Applications" })).getByText("24")).toBeInTheDocument();

    const activity = screen.getByRole("region", { name: "Activity" });
    expect(within(activity).getByText("First published")).toBeInTheDocument();
    expect(within(activity).getByText("Job updated")).toBeInTheDocument();

    fireEvent.click(within(activity).getByRole("button", { name: "View history" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Job published");
  });

  it("shows Not published and the draft notice for a draft", () => {
    renderDetail({ ...draft });
    expect(screen.getByText("Draft. Only people in Nova Fintech can see this job.")).toBeInTheDocument();
    expect(screen.getAllByText("No").length).toBe(2);
  });
});
