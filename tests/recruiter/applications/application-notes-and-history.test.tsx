import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationInternalNotes } from "@/features/recruiter/applications/detail/application-internal-notes";
import { CompanyHistoryDialog } from "@/features/recruiter/applications/detail/company-history-dialog";
import type { RecruiterApplicantCompanyHistoryResponse } from "@/api/generated/types.gen";

const mockShowToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: vi.fn() }),
}));

const mockCreateNoteMutateAsync = vi.fn();
let mockNotesData: { items: Array<{ authorId: string; authorName: string; content: string; createdAt: string }>; total: number } | undefined = undefined;
let mockCompanyHistoryData: RecruiterApplicantCompanyHistoryResponse | undefined = undefined;
let mockCompanyHistoryLoading = false;
let mockCompanyHistoryError = false;

vi.mock("@/features/recruiter/applications/applications.queries", () => ({
  useRecruiterApplicationNotes: () => ({
    data: mockNotesData,
    isPending: false,
  }),
  useCreateRecruiterNote: () => ({
    mutateAsync: mockCreateNoteMutateAsync,
    isPending: false,
  }),
  useRecruiterCompanyHistory: () => ({
    data: mockCompanyHistoryData,
    isLoading: mockCompanyHistoryLoading,
    isError: mockCompanyHistoryError,
  }),
}));

describe("ApplicationInternalNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotesData = undefined;
  });

  it("renders empty state when there are no notes", () => {
    mockNotesData = { items: [], total: 0 };
    render(<ApplicationInternalNotes applicationId="app-1" />);

    expect(screen.getByRole("heading", { name: /INTERNAL NOTES/i })).toBeInTheDocument();
    expect(screen.getByText(/No internal notes yet/i)).toBeInTheDocument();
  });

  it("renders list of notes with author avatar, name, timestamp, and content", () => {
    mockNotesData = {
      items: [
        {
          authorId: "user-1",
          authorName: "Đỗ Hà",
          content: "Strong Go and Kafka background. Ask about on-call experience.",
          createdAt: "2026-10-07T16:02:00.000Z",
        },
      ],
      total: 1,
    };

    render(<ApplicationInternalNotes applicationId="app-1" />);

    expect(screen.getByText("Đỗ Hà")).toBeInTheDocument();
    expect(
      screen.getByText("Strong Go and Kafka background. Ask about on-call experience."),
    ).toBeInTheDocument();
  });

  it("prevents submitting empty notes and warns the user", async () => {
    render(<ApplicationInternalNotes applicationId="app-1" />);

    const submitBtn = screen.getByRole("button", { name: /Add/i });
    expect(submitBtn).toBeDisabled();

    const input = screen.getByPlaceholderText(/Add a note for your team/i);
    fireEvent.change(input, { target: { value: "   " } });
    expect(submitBtn).toBeDisabled();
  });

  it("successfully calls mutation and resets input when valid note is submitted", async () => {
    mockCreateNoteMutateAsync.mockResolvedValueOnce({ id: "note-1" });

    render(<ApplicationInternalNotes applicationId="app-1" />);

    const input = screen.getByPlaceholderText(/Add a note for your team/i);
    fireEvent.change(input, { target: { value: "Follow up on references." } });

    const submitBtn = screen.getByRole("button", { name: /Add/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateNoteMutateAsync).toHaveBeenCalledWith({
        content: "Follow up on references.",
      });
    });

    expect(input).toHaveValue("");
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success" }),
    );
  });
});

describe("CompanyHistoryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompanyHistoryLoading = false;
    mockCompanyHistoryError = false;
    mockCompanyHistoryData = {
      applicant: {
        id: "cand-1",
        fullName: "Phạm Minh Khoa",
        email: "khoa.pm@example.com",
        phone: "+8490111222",
      },
      isFirstTimeApplicant: false,
      totalSubmissionsToCompany: 2,
      items: [
        {
          id: "app-curr",
          job: {
            id: "job-1",
            title: "Backend Developer (Go)",
            location: "Ho Chi Minh City",
            employmentType: "full_time",
            status: "published",
          },
          status: "interviewing",
          reviewStage: "interview",
          submittedDocuments: ["cv"],
          rejectionReason: null,
          withdrawalReason: null,
          notesCount: 1,
          submittedAt: "2026-10-06T21:03:00.000Z",
          latestStatusAt: "2026-10-08T09:40:00.000Z",
          isCurrentApplication: true,
        },
        {
          id: "app-prev",
          job: {
            id: "job-2",
            title: "Junior Go Developer",
            location: "Ho Chi Minh City",
            employmentType: "full_time",
            status: "closed",
          },
          status: "rejected",
          reviewStage: "screening",
          submittedDocuments: ["cv"],
          rejectionReason: "Lacked required distributed systems experience",
          withdrawalReason: null,
          notesCount: 0,
          submittedAt: "2025-04-12T10:00:00.000Z",
          latestStatusAt: "2025-04-18T14:30:00.000Z",
          isCurrentApplication: false,
        },
      ],
    };
  });

  it("renders header with candidate name, job title, and default tab content", () => {
    const handleOpenChange = vi.fn();
    render(
      <CompanyHistoryDialog
        applicationId="app-curr"
        candidateName="Phạm Minh Khoa"
        companyName="Nova Fintech"
        jobTitle="Backend Developer (Go)"
        onOpenChange={handleOpenChange}
        open={true}
        statusHistory={[
          {
            status: "interviewing",
            reviewStage: "interview",
            actorRole: "Trần Bảo",
            note: null,
            messageToCandidate: "We would like to meet you for a panel interview.",
            rejectionReason: null,
            occurredAt: "2026-10-08T09:40:00.000Z",
          },
          {
            status: "submitted",
            reviewStage: null,
            actorRole: "candidate",
            note: null,
            messageToCandidate: null,
            rejectionReason: null,
            occurredAt: "2026-10-06T21:03:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "History" })).toBeInTheDocument();
    expect(screen.getByText(/Phạm Minh Khoa · Backend Developer \(Go\)/)).toBeInTheDocument();

    // Check timeline items
    expect(screen.getByText(/Moved to Interviewing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We would like to meet you for a panel interview/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Application submitted/i)).toBeInTheDocument();

    // Check footnote
    expect(
      screen.getByText(/Times in ICT \(UTC\+7\)\. History is append-only/i),
    ).toBeInTheDocument();
  });

  it("switches to company history tab and displays past applications and status badges", async () => {
    render(
      <CompanyHistoryDialog
        applicationId="app-curr"
        candidateName="Phạm Minh Khoa"
        companyName="Nova Fintech"
        jobTitle="Backend Developer (Go)"
        onOpenChange={vi.fn()}
        open={true}
      />,
    );

    const companyTab = screen.getByRole("tab", { name: /At Nova Fintech · 2/i });
    expect(companyTab).toBeInTheDocument();
    fireEvent.click(companyTab);

    // Should display both current and previous applications
    expect(screen.getByText("Junior Go Developer")).toBeInTheDocument();
    expect(
      screen.getByText(/Lacked required distributed systems experience/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("displays first-time applicant banner when candidate has no prior records", async () => {
    mockCompanyHistoryData = {
      applicant: {
        id: "cand-2",
        fullName: "New Candidate",
        email: "new@example.com",
        phone: null,
      },
      isFirstTimeApplicant: true,
      totalSubmissionsToCompany: 1,
      items: [
        {
          id: "app-curr",
          job: {
            id: "job-1",
            title: "Backend Developer (Go)",
            location: null,
            employmentType: null,
            status: "published",
          },
          status: "submitted",
          reviewStage: null,
          submittedDocuments: ["cv"],
          rejectionReason: null,
          withdrawalReason: null,
          notesCount: 0,
          submittedAt: "2026-10-10T10:00:00.000Z",
          latestStatusAt: "2026-10-10T10:00:00.000Z",
          isCurrentApplication: true,
        },
      ],
    };

    render(
      <CompanyHistoryDialog
        applicationId="app-curr"
        candidateName="New Candidate"
        companyName="Nova Fintech"
        jobTitle="Backend Developer (Go)"
        onOpenChange={vi.fn()}
        open={true}
      />,
    );

    const companyTab = screen.getByRole("tab", { name: /At Nova Fintech · 1/i });
    fireEvent.click(companyTab);

    expect(
      screen.getByText(/First time applying to Nova Fintech/i),
    ).toBeInTheDocument();
  });
});
