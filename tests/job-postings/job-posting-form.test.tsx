import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { JobPosting } from "@/api/generated/types.gen";
import { JobPostingForm } from "@/features/job-postings/job-posting-form";
import { toDeadlineDate } from "@/features/job-postings/job-postings.format";

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

type User = ReturnType<typeof userEvent.setup>;
const INTERACTIVE_TEST_TIMEOUT = 10_000;

// The selects are Radix comboboxes: open the list, then pick an option.
async function choose(user: User, name: RegExp, option: string) {
  await user.click(screen.getByRole("combobox", { name }));
  await user.click(await screen.findByRole("option", { name: option }));
}

// Picks the 15th of next month through the calendar and returns it as YYYY-MM-DD. The calendar works in
// Vietnam time, so "next month" is computed from that date, not from the machine's clock (CI runs in UTC).
async function pickDeadline(user: User): Promise<string> {
  const [year, month] = toDeadlineDate(Date.now()).split("-").map(Number);
  const next = new Date(Date.UTC(year!, month!, 15));
  const iso = next.toISOString().slice(0, 10);
  await user.click(screen.getByRole("button", { name: /expiry date/i }));
  await user.click(screen.getByRole("button", { name: /next month/i }));
  await user.click(
    screen.getByRole("button", {
      name: `15/${iso.slice(5, 7)}/${iso.slice(0, 4)}`,
    }),
  );
  return iso;
}

function renderForm(
  props: Partial<React.ComponentProps<typeof JobPostingForm>> = {},
) {
  const onCreate = vi.fn();
  const onUpdate = vi.fn();
  render(
    <MemoryRouter>
      <JobPostingForm
        isSaving={false}
        onCreate={onCreate}
        onUpdate={onUpdate}
        {...props}
      />
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
    await choose(user, /level/i, "Not specified");
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
    expect(payload).not.toHaveProperty("publication_status");
  });

  it("saves an incomplete job as a draft with only the title required", async () => {
    const { onCreate, user } = renderForm();
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/^title/i), "Platform draft");
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate.mock.calls[0]?.[0]).toEqual({
      currency: "VND",
      publication_status: "draft",
      title: "Platform draft",
    });
  });

  it("clears and disables the salary range when salary is negotiable", async () => {
    const { onCreate } = renderForm();
    const minimum = screen.getByLabelText(/minimum salary/i);
    const maximum = screen.getByLabelText(/maximum salary/i);

    fireEvent.change(screen.getByLabelText(/^title/i), {
      target: { value: "Negotiable role" },
    });
    fireEvent.change(minimum, { target: { value: "1000" } });
    fireEvent.change(maximum, { target: { value: "2000" } });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /salary is negotiable/i }),
    );

    expect(minimum).toBeDisabled();
    expect(maximum).toBeDisabled();
    expect(minimum).toHaveValue(null);
    expect(maximum).toHaveValue(null);

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate.mock.calls[0]?.[0]).toEqual({
      currency: "VND",
      publication_status: "draft",
      salary_negotiable: true,
      title: "Negotiable role",
    });
  });

  it(
    "requires every published field before creating and explicitly publishes",
    async () => {
      const { onCreate, user } = renderForm();

      await user.click(screen.getByRole("button", { name: /publish job/i }));
      expect(onCreate).not.toHaveBeenCalled();
      expect(await screen.findAllByText(/characters/i)).not.toHaveLength(0);
      expect(screen.getByText(/choose a job type/i)).toBeInTheDocument();
      expect(screen.getByText(/choose a deadline/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^title/i), {
        target: { value: "Platform engineer" },
      });
      fireEvent.change(screen.getByLabelText(/^location/i), {
        target: { value: "Ha Noi" },
      });
      await choose(user, /employment type/i, "Remote");
      fireEvent.change(screen.getByLabelText(/^description/i), {
        target: { value: "Own the platform that runs our services." },
      });
      fireEvent.change(screen.getByLabelText(/^requirements/i), {
        target: { value: "Five years of backend experience." },
      });
      fireEvent.change(screen.getByLabelText(/^benefits/i), {
        target: { value: "Health cover and flexible hours." },
      });
      const deadline = await pickDeadline(user);
      await user.click(screen.getByRole("button", { name: /publish job/i }));

      await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
      expect(onCreate.mock.calls[0]?.[0]).toEqual({
        title: "Platform engineer",
        publication_status: "published",
        location: "Ha Noi",
        employment_type: "Remote",
        currency: "VND",
        description: "Own the platform that runs our services.",
        requirements: "Five years of backend experience.",
        benefits: "Health cover and flexible hours.",
        expires_at: deadline,
      });
    },
    INTERACTIVE_TEST_TIMEOUT,
  );
});
