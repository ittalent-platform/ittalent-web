import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { JobPosting } from "@/api/generated/types.gen";
import { JobPostingForm } from "@/features/job-postings/job-posting-form";

const posting: JobPosting = {
  benefits: "Remote allowance and learning budget",
  createdAt: "2026-01-01T00:00:00.000Z",
  currency: "VND",
  description: "Build reliable products for customers.",
  employmentType: "Full-time",
  enterprise: { id: "enterprise-1", logoUrl: null, name: "Acme Technology" },
  enterpriseId: "enterprise-1",
  // End of 31 Dec 2099 in Asia/Ho_Chi_Minh.
  expiresAt: "2099-12-31T16:59:59.999Z",
  id: "job-1",
  level: "Senior",
  location: "Ho Chi Minh City",
  openings: 2,
  postedByUserId: "recruiter-1",
  recruitmentStatus: "open",
  requirements: "TypeScript and React experience",
  salaryMax: 3000,
  salaryMin: 2000,
  salaryNegotiable: false,
  slug: "senior-engineer",
  status: "published",
  title: "Senior engineer",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderForm(props: Partial<React.ComponentProps<typeof JobPostingForm>> = {}) {
  const onCreate = vi.fn();
  const onUpdate = vi.fn();
  render(
    <MemoryRouter>
      <JobPostingForm isSaving={false} onCreate={onCreate} onUpdate={onUpdate} {...props} />
    </MemoryRouter>,
  );
  return { onCreate, onUpdate, user: userEvent.setup() };
}

describe("JobPostingForm", () => {
  it("sends null only for cleared optional fields when editing, and always sends the required ones", async () => {
    const { onUpdate, user } = renderForm({ posting });

    for (const label of [/minimum salary/i, /maximum salary/i, /openings/i]) {
      await user.clear(screen.getByLabelText(label));
    }
    await user.selectOptions(screen.getByLabelText(/^level/i), "");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    const payload = onUpdate.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      level: null,
      openings: null,
      salary_max: null,
      salary_min: null,
      employment_type: "Full-time",
      expires_at: "2099-12-31",
      location: "Ho Chi Minh City",
    });
    expect(payload).not.toHaveProperty("status");
  });

  it("does not offer a status or draft choice", () => {
    renderForm();
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /draft/i })).not.toBeInTheDocument();
  });

  it("requires every published field before creating and then saves without a status", async () => {
    const { onCreate, user } = renderForm();

    await user.click(screen.getByRole("button", { name: /create job posting/i }));
    expect(onCreate).not.toHaveBeenCalled();
    expect(await screen.findAllByText(/characters/i)).not.toHaveLength(0);
    expect(screen.getByText(/choose a job type/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a deadline/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^title/i), "Platform engineer");
    await user.type(screen.getByLabelText(/^location/i), "Ha Noi");
    await user.selectOptions(screen.getByLabelText(/employment type/i), "Remote");
    await user.type(screen.getByLabelText(/^description/i), "Own the platform that runs our services.");
    await user.type(screen.getByLabelText(/^requirements/i), "Five years of backend experience.");
    await user.type(screen.getByLabelText(/^benefits/i), "Health cover and flexible hours.");
    await user.type(screen.getByLabelText(/expiry date/i), "2099-01-01");
    await user.click(screen.getByRole("button", { name: /create job posting/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate.mock.calls[0]?.[0]).toEqual({
      title: "Platform engineer",
      location: "Ha Noi",
      employment_type: "Remote",
      currency: "VND",
      description: "Own the platform that runs our services.",
      requirements: "Five years of backend experience.",
      benefits: "Health cover and flexible hours.",
      expires_at: "2099-01-01",
    });
  });

  it("rejects a deadline before today", async () => {
    const { onCreate, user } = renderForm();
    await user.type(screen.getByLabelText(/^title/i), "Platform engineer");
    await user.type(screen.getByLabelText(/^location/i), "Ha Noi");
    await user.selectOptions(screen.getByLabelText(/employment type/i), "Remote");
    await user.type(screen.getByLabelText(/^description/i), "Own the platform that runs our services.");
    await user.type(screen.getByLabelText(/^requirements/i), "Five years of backend experience.");
    await user.type(screen.getByLabelText(/^benefits/i), "Health cover and flexible hours.");
    await user.type(screen.getByLabelText(/expiry date/i), "2020-01-01");
    await user.click(screen.getByRole("button", { name: /create job posting/i }));

    expect(await screen.findByText(/deadline must be today or later/i)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
