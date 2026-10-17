import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ApplicationsBoard } from "@/features/recruiter/applications/applications-board";
import type { ApplicationItem } from "@/features/recruiter/applications/applications.constants";

const mockItem1: ApplicationItem = {
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

const mockItem2: ApplicationItem = {
  id: "607f1f77bcf86cd799439022",
  job: {
    id: "507f1f77bcf86cd799439012",
    title: "Senior Fullstack Engineer",
  },
  applicant: {
    id: "407f1f77bcf86cd799439023",
    fullName: "Bao Nguyen",
    email: "bao.nguyen@example.com",
    phone: "+84909876543",
  },
  status: "hired",
  reviewStage: "hired",
  submittedDocuments: ["cv"],
  nextInterview: null,
  notesCount: 0,
  submittedAt: "2026-10-05T08:30:00.000Z",
  latestStatusAt: "2026-10-10T09:00:00.000Z",
};

describe("ApplicationsBoard", () => {
  it("renders all 7 lifecycle columns with proper headings and counts", () => {
    const statusCounts = {
      submitted: 10,
      under_review: 4,
      interviewing: 3,
      offered: 2,
      hired: 1,
      rejected: 5,
      withdrawn: 1,
      position_filled: 0,
    };

    render(
      <MemoryRouter>
        <ApplicationsBoard
          items={[mockItem1, mockItem2]}
          locale="en"
          statusCounts={statusCounts}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: /Submitted/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Under review/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Interviewing/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Offered/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Hired/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Rejected/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Withdrawn/i })).toBeInTheDocument();

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders candidate card content including avatar, job title, email, and document badges", () => {
    render(
      <MemoryRouter>
        <ApplicationsBoard items={[mockItem1]} locale="en" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("alex.rivera@example.com")).toBeInTheDocument();
    expect(screen.getByText("Senior Fullstack Engineer")).toBeInTheDocument();
    expect(screen.getByText(/CV/)).toBeInTheDocument();
    expect(screen.getByText(/Letter/)).toBeInTheDocument();
    expect(screen.getByText(/Interview Tue/i)).toBeInTheDocument();
  });

  it("sets draggable attribute true for active candidates and false for terminal candidates", () => {
    render(
      <MemoryRouter>
        <ApplicationsBoard items={[mockItem1, mockItem2]} locale="en" />
      </MemoryRouter>,
    );

    const activeCard = screen.getByRole("button", { name: /Alex Rivera/i });
    expect(activeCard).toHaveAttribute("draggable", "true");

    const terminalCard = screen.getByRole("button", { name: /Bao Nguyen/i });
    expect(terminalCard).toHaveAttribute("draggable", "false");
  });

  it("permits valid transitions and invokes onStatusChange upon dropping", () => {
    const onStatusChange = vi.fn();
    render(
      <MemoryRouter>
        <ApplicationsBoard
          items={[mockItem1]}
          locale="en"
          onStatusChange={onStatusChange}
        />
      </MemoryRouter>,
    );

    const activeCard = screen.getByRole("button", { name: /Alex Rivera/i });
    const interviewingColumn = screen.getByRole("region", { name: /Interviewing/i });

    // Mock dataTransfer
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(format: string, val: string) {
        this.data[format] = val;
      },
      getData(format: string) {
        return this.data[format] || "";
      },
      effectAllowed: "",
      dropEffect: "",
    };

    // Start drag
    fireEvent.dragStart(activeCard, { dataTransfer });

    // Drag over permitted target (under_review -> interviewing is allowed per BR-17)
    fireEvent.dragOver(interviewingColumn, { dataTransfer });

    // Drop onto target
    fireEvent.drop(interviewingColumn, { dataTransfer });

    expect(onStatusChange).toHaveBeenCalledWith(mockItem1, "interviewing");
  });

  it("disallows invalid transitions according to BR-17", () => {
    const onStatusChange = vi.fn();
    render(
      <MemoryRouter>
        <ApplicationsBoard
          items={[mockItem1]}
          locale="en"
          onStatusChange={onStatusChange}
        />
      </MemoryRouter>,
    );

    const activeCard = screen.getByRole("button", { name: /Alex Rivera/i });
    const submittedColumn = screen.getByRole("region", { name: /Submitted/i });

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(format: string, val: string) {
        this.data[format] = val;
      },
      getData(format: string) {
        return this.data[format] || "";
      },
      effectAllowed: "",
      dropEffect: "",
    };

    fireEvent.dragStart(activeCard, { dataTransfer });

    // Drag over forbidden backward target (under_review -> submitted is NOT allowed)
    fireEvent.dragOver(submittedColumn, { dataTransfer });

    fireEvent.drop(submittedColumn, { dataTransfer });

    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
