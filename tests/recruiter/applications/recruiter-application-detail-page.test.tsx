import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecruiterApplicationDetailPage } from "@/features/recruiter/applications/detail/recruiter-application-detail-page";
import type { RecruiterApplicationDetailDto } from "@/api/generated/types.gen";

const mockMutateAsync = vi.fn();

vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ showToast: vi.fn(), dismissToast: vi.fn() }),
}));

const mockApplication: RecruiterApplicationDetailDto = {
  id: "607f1f77bcf86cd799439011",
  job: {
    id: "507f1f77bcf86cd799439012",
    title: "Senior Fullstack Engineer",
    location: "Ho Chi Minh City",
    employmentType: "full_time",
    department: "Engineering",
    status: "published",
    expiresAt: null,
  },
  applicant: {
    id: "407f1f77bcf86cd799439013",
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+84901234567",
    role: "applicant",
    status: "active",
  },
  status: "under_review",
  reviewStage: "screening",
  message: "I am passionate about fullstack development and building robust platforms.",
  withdrawalReason: null,
  attachments: [
    {
      documentId: "doc-1",
      type: "cv",
      fileName: "Alex_Rivera_CV.pdf",
      mimeType: "application/pdf",
      size: 1024 * 1024 * 2.5,
      submittedAt: "2026-10-07T08:30:00.000Z",
    },
    {
      documentId: "doc-2",
      type: "cover_letter",
      fileName: "Cover_Letter.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 512 * 1024,
      submittedAt: "2026-10-07T08:30:00.000Z",
    },
  ],
  interviews: [
    {
      id: "int-1",
      scheduledAt: "2026-10-20T10:00:00.000Z",
      endsAt: "2026-10-20T11:00:00.000Z",
      durationMinutes: 60,
      mode: "online",
      meetingLink: "https://meet.google.com/abc-def-ghi",
      location: null,
      status: "scheduled",
      notes: "First technical round",
    },
  ],
  notes: [
    {
      authorId: "recruiter-1",
      authorName: "Sarah Recruiter",
      content: "Strong candidate with 5 years experience.",
      createdAt: "2026-10-08T09:00:00.000Z",
    },
  ],
  statusHistory: [
    {
      status: "under_review",
      reviewStage: "screening",
      actorRole: "recruiter",
      note: "Moved to screening",
      messageToCandidate: null,
      rejectionReason: null,
      occurredAt: "2026-10-08T09:00:00.000Z",
    },
  ],
  version: 1,
  submittedAt: "2026-10-07T08:30:00.000Z",
  latestStatusAt: "2026-10-08T09:00:00.000Z",
  createdAt: "2026-10-07T08:30:00.000Z",
  updatedAt: "2026-10-08T09:00:00.000Z",
};

let mockQueryState = {
  data: mockApplication as RecruiterApplicationDetailDto | undefined,
  isPending: false,
  isError: false,
};

vi.mock("@/features/recruiter/applications/applications.queries", () => ({
  useRecruiterApplication: () => mockQueryState,
  useUpdateApplicationStatus: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

function renderDetailPage(applicationId = "607f1f77bcf86cd799439011") {
  return render(
    <MemoryRouter
      initialEntries={[`/recruiter/applications/${applicationId}`]}
    >
      <Routes>
        <Route
          element={<RecruiterApplicationDetailPage />}
          path="/recruiter/applications/:applicationId"
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RecruiterApplicationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryState = {
      data: mockApplication,
      isPending: false,
      isError: false,
    };
  });

  it("renders candidate header, job title, status badge, and timeline", () => {
    renderDetailPage();

    expect(screen.getByRole("heading", { name: "Alex Rivera" })).toBeInTheDocument();
    expect(screen.getByText(/Senior Fullstack Engineer/)).toBeInTheDocument();
    expect(screen.getAllByText(/Under Review/)[0]).toBeInTheDocument();
  });

  it("renders candidate message and contact information", () => {
    renderDetailPage();

    expect(
      screen.getByText(
        "I am passionate about fullstack development and building robust platforms.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("alex.rivera@example.com")).toBeInTheDocument();
    expect(screen.getByText("+84901234567")).toBeInTheDocument();
  });

  it("renders submitted documents list with file names", () => {
    renderDetailPage();

    expect(screen.getByText(/Alex_Rivera_CV\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/Cover_Letter\.docx/)).toBeInTheDocument();
  });

  it("renders interview card when an interview is scheduled", () => {
    renderDetailPage();

    expect(
      screen.getByRole("heading", { name: /Interview/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("🎥 Online")).toBeInTheDocument();
  });

  it("renders status history entries", () => {
    renderDetailPage();

    expect(
      screen.getByRole("heading", { name: /Status history/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('"Moved to screening"')).toBeInTheDocument();
  });

  it("opens status dialog when an action is selected from dropdown menu", async () => {
    renderDetailPage();

    const changeStatusBtn = screen.getByRole("button", {
      name: /Change status/i,
    });
    fireEvent.pointerDown(changeStatusBtn);
    fireEvent.keyDown(changeStatusBtn, { key: "ArrowDown" });

    const interviewOption = await screen.findByRole("menuitem", {
      name: /Interviewing/i,
    });
    fireEvent.click(interviewOption);

    expect(
      await screen.findByRole("heading", { name: /Move to Interviewing/i }),
    ).toBeInTheDocument();
  });

  it("renders loading skeleton state when query is pending", () => {
    mockQueryState = {
      data: undefined,
      isPending: true,
      isError: false,
    };

    renderDetailPage();
    expect(screen.getByText("Loading application details...")).toBeInTheDocument();
  });

  it("renders not found state when query fails or data is absent", () => {
    mockQueryState = {
      data: undefined,
      isPending: false,
      isError: true,
    };

    renderDetailPage();
    expect(screen.getByText(/Application not found/i)).toBeInTheDocument();
  });
});
