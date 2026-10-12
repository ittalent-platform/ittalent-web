import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClampedText } from "@/components/common/clamped-text";

/** jsdom has no layout: report the measured sizes the clamp would produce. */
function mockSizes(scrollHeight: number, clientHeight: number) {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
}

afterEach(() => vi.restoreAllMocks());

describe("ClampedText", () => {
  it("offers Show more only when the clamp really hides text, then Show less", async () => {
    mockSizes(120, 60);
    render(<ClampedText text={"r".repeat(300)} />);
    const events = userEvent.setup();
    const text = screen.getByText("r".repeat(300));
    expect(text).toHaveClass("line-clamp-3");
    await events.click(screen.getByRole("button", { name: "Show more" }));
    expect(text).not.toHaveClass("line-clamp-3");
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
    await events.click(screen.getByRole("button", { name: "Show less" }));
    expect(text).toHaveClass("line-clamp-3");
  });

  it("has no toggle when nothing is hidden, however long the text is", () => {
    mockSizes(60, 60);
    render(<ClampedText text={"r".repeat(300)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no toggle for short text", () => {
    mockSizes(20, 20);
    render(<ClampedText text="Short reason" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
