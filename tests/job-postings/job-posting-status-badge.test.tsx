import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JobPostingStatusBadge } from "@/features/job-postings/job-posting-status-badge";

describe("JobPostingStatusBadge", () => {
  it.each([
    ["published", "open", "Open"],
    ["published", "closed", "Closed"],
    ["draft", "closed", "Draft"],
    ["archived", "closed", "Archived"],
  ] as const)("shows %s / %s as %s", (status, recruitmentStatus, label) => {
    render(<JobPostingStatusBadge posting={{ status, recruitmentStatus }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
