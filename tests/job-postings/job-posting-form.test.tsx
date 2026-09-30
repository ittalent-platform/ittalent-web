import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { JobPosting } from "@/api/generated/types.gen";
import { JobPostingForm } from "@/features/job-postings/job-posting-form";

const posting: JobPosting = {
  benefits: "Remote allowance",
  createdAt: "2026-01-01T00:00:00.000Z",
  currency: "USD",
  description: "Build reliable products.",
  employmentType: "Full-time",
  enterprise: { id: "enterprise-1", logoUrl: null, name: "Acme Technology" },
  enterpriseId: "enterprise-1",
  expiresAt: "2026-12-31T12:00:00.000Z",
  id: "job-1",
  level: "Senior",
  location: "Ho Chi Minh City",
  openings: 2,
  postedByUserId: "recruiter-1",
  requirements: "TypeScript",
  salaryMax: 3000,
  salaryMin: 2000,
  salaryNegotiable: false,
  slug: "senior-engineer",
  status: "draft",
  title: "Senior engineer",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("JobPostingForm", () => {
  it("sends null for cleared optional fields when editing", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <JobPostingForm
          isSaving={false}
          onCreate={vi.fn()}
          onUpdate={onUpdate}
          posting={posting}
        />
      </MemoryRouter>,
    );

    for (const label of [
      /location/i,
      /minimum salary/i,
      /maximum salary/i,
      /expiry date/i,
      /description/i,
      /requirements/i,
      /benefits/i,
    ]) {
      await user.clear(screen.getByLabelText(label));
    }
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        benefits: null,
        description: null,
        expires_at: null,
        location: null,
        requirements: null,
        salary_max: null,
        salary_min: null,
      }),
    );
  });
});
