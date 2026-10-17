import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ApplicationsTable } from "@/features/recruiter/applications/applications-table";
import type { ApplicationItem } from "@/features/recruiter/applications/applications.constants";

const mockItem: ApplicationItem = {
  id: "607f1f77bcf86cd799439011",
  job: {
    id: "507f1f77bcf86cd799439012",
    title: "Senior Fullstack Engineer",
  },
  applicant: {
    id: "407f1f77bcf86cd799439013",
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+84901234567",
  },
  status: "under_review",
  reviewStage: "screening",
  submittedDocuments: ["cv", "cover_letter"],
  nextInterview: {
    id: "307f1f77bcf86cd799439014",
    scheduledAt: "2026-10-20T10:00:00.000Z",
    mode: "online",
  },
  notesCount: 2,
  submittedAt: "2026-10-07T08:30:00.000Z",
  latestStatusAt: "2026-10-08T09:00:00.000Z",
};

describe("ApplicationsTable", () => {
  it("renders candidate information, job title, and document links", () => {
    render(
      <MemoryRouter>
        <ApplicationsTable
          items={[mockItem]}
          locale="en"
          onSort={vi.fn()}
          sortBy="submittedAt"
          sortOrder="desc"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("alex.rivera@example.com")).toBeInTheDocument();
    expect(screen.getByText("Senior Fullstack Engineer")).toBeInTheDocument();
    expect(screen.getByText(/CV/)).toBeInTheDocument();
    expect(screen.getByText("Cover letter")).toBeInTheDocument();
    expect(screen.getByText(/Awaiting reply/i)).toBeInTheDocument();
  });

  it("calls onSort when a sortable column header is clicked", () => {
    const onSort = vi.fn();
    render(
      <MemoryRouter>
        <ApplicationsTable
          items={[mockItem]}
          locale="en"
          onSort={onSort}
          sortBy="submittedAt"
          sortOrder="desc"
        />
      </MemoryRouter>,
    );

    const submittedHeader = screen.getByRole("button", { name: /SUBMITTED/i });
    fireEvent.click(submittedHeader);
    expect(onSort).toHaveBeenCalledWith("submittedAt");
  });

  it("displays dash when no interview is scheduled", () => {
    const itemWithoutInterview: ApplicationItem = {
      ...mockItem,
      id: "607f1f77bcf86cd799439099",
      nextInterview: null,
    };

    render(
      <MemoryRouter>
        <ApplicationsTable
          items={[itemWithoutInterview]}
          locale="en"
          onSort={vi.fn()}
          sortBy="submittedAt"
          sortOrder="desc"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
