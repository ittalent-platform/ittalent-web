import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimelineList } from "@/components/common/timeline";

describe("TimelineList", () => {
  it("draws one coloured dot per entry, joined by a line, with title and 'date · by actor'", () => {
    render(
      <TimelineList
        entries={[
          { atIso: "2026-10-08T03:30:00Z", by: "Administrator", label: "Account suspended", tone: "error" },
          { atIso: "2026-10-07T02:12:00Z", by: "This user", label: "Account created", tone: "success" },
          { atIso: "2026-10-06T02:12:00Z", label: "Profile updated", tone: "info" },
        ]}
        formatDate={(iso) => iso.slice(0, 10)}
      />,
    );

    const items = within(screen.getByTestId("timeline")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.querySelector("[data-tone]")?.getAttribute("data-tone"))).toEqual(["error", "success", "info"]);
    expect(screen.getAllByTestId("timeline-line")).toHaveLength(2); // between dots, none after the last
    expect(screen.getByText("Account suspended")).toHaveClass("font-semibold");
    expect(screen.getByText("2026-10-08 · by Administrator")).toBeInTheDocument();
    expect(screen.getByText("2026-10-06")).toBeInTheDocument();
  });
});
