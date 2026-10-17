import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ApplicationStatusDialog,
  type ApplicationStatusDialogProps,
} from "@/features/recruiter/applications/application-status-dialog";
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
  nextInterview: null,
  notesCount: 0,
  submittedAt: "2026-10-07T08:30:00.000Z",
  latestStatusAt: "2026-10-08T09:00:00.000Z",
};

function renderDialog(props: Partial<ApplicationStatusDialogProps> = {}) {
  const defaultProps: ApplicationStatusDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    item: mockItem,
    targetStatus: "interviewing",
    onConfirm: vi.fn(),
    isPending: false,
    error: null,
    ...props,
  };
  return {
    ...render(<ApplicationStatusDialog {...defaultProps} />),
    props: defaultProps,
  };
}

describe("ApplicationStatusDialog", () => {
  it("renders title, candidate subtitle, and status transition badges", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: /Move to Interviewing/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alex Rivera · Senior Fullstack Engineer"),
    ).toBeInTheDocument();
    expect(screen.getByText("The candidate is notified")).toBeInTheDocument();
  });

  it("pre-fills candidate offer message when moving to offered", () => {
    const offerItem: ApplicationItem = {
      ...mockItem,
      status: "interviewing",
    };
    renderDialog({ item: offerItem, targetStatus: "offered" });

    const messageInput = screen.getByLabelText(
      /Message to the candidate/i,
    ) as HTMLTextAreaElement;
    expect(messageInput.value).toContain(
      "We’re happy to offer you the Senior Fullstack Engineer role",
    );
  });

  it("requires a reason when target status is rejected", () => {
    const onConfirm = vi.fn();
    renderDialog({ targetStatus: "rejected", onConfirm });

    expect(
      screen.getByRole("heading", { name: "Reject application" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();

    // Click submit without entering a reason
    const submitButton = screen.getByRole("button", {
      name: "Reject application",
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText("Write the reason (5–500 characters)."),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    // Fill valid reason and submit
    const reasonInput = screen.getByPlaceholderText(
      "Why is this application rejected?",
    );
    fireEvent.change(reasonInput, {
      target: { value: "Candidate lacks required system design experience." },
    });
    fireEvent.click(submitButton);

    expect(onConfirm).toHaveBeenCalledWith({
      status: "rejected",
      rejectionReason: "Candidate lacks required system design experience.",
      messageToCandidate: undefined,
      note: undefined,
    });
  });

  it("submits optional candidate message and internal note for standard stage transitions", () => {
    const onConfirm = vi.fn();
    renderDialog({
      targetStatus: "interviewing",
      onConfirm,
    });

    const messageInput = screen.getByLabelText(/Message to the candidate/i);
    const noteInput = screen.getByLabelText(/Internal note/i);

    fireEvent.change(messageInput, {
      target: { value: "We look forward to meeting you on Thursday." },
    });
    fireEvent.change(noteInput, {
      target: { value: "Passed technical screening with flying colors." },
    });

    const submitButton = screen.getByRole("button", { name: /Move to/i });
    fireEvent.click(submitButton);

    expect(onConfirm).toHaveBeenCalledWith({
      status: "interviewing",
      messageToCandidate: "We look forward to meeting you on Thursday.",
      note: "Passed technical screening with flying colors.",
      rejectionReason: undefined,
    });
  });

  it("renders conflict and prerequisite error callouts", () => {
    renderDialog({
      error: new Error("409 Conflict: Application was updated concurrently"),
    });

    expect(
      screen.getByText(
        "Another team member updated this application or the opening was already filled.",
      ),
    ).toBeInTheDocument();
  });

  it("triggers onOpenChange(false) when cancel button is clicked", () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
