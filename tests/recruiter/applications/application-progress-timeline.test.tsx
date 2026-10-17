import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApplicationProgressTimeline } from "@/features/recruiter/applications/detail/application-progress-timeline";

describe("ApplicationProgressTimeline", () => {
  it("renders all 5 core stages for an active application", () => {
    render(
      <ApplicationProgressTimeline
        currentStatus="interviewing"
        statusHistory={[
          {
            status: "submitted",
            occurredAt: "2026-10-07T08:30:00.000Z",
          },
          {
            status: "under_review",
            occurredAt: "2026-10-08T09:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.getByText("Interviewing")).toBeInTheDocument();
    expect(screen.getByText("Offered")).toBeInTheDocument();
    expect(screen.getByText("Hired")).toBeInTheDocument();
  });

  it("renders terminal rejected badge when status is rejected", () => {
    render(
      <ApplicationProgressTimeline
        currentStatus="rejected"
        statusHistory={[
          {
            status: "submitted",
            occurredAt: "2026-10-07T08:30:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("renders terminal withdrawn badge when status is withdrawn", () => {
    render(
      <ApplicationProgressTimeline
        currentStatus="withdrawn"
        statusHistory={[
          {
            status: "submitted",
            occurredAt: "2026-10-07T08:30:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Withdrawn")).toBeInTheDocument();
  });

  it("displays formatted submission date on the first stage", () => {
    render(
      <ApplicationProgressTimeline
        currentStatus="under_review"
        statusHistory={[
          {
            status: "submitted",
            occurredAt: "2026-10-07T08:30:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText(/Oct 7, 2026/)).toBeInTheDocument();
  });
});
