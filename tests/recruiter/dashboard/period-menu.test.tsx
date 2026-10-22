import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PeriodMenu } from "@/features/recruiter/dashboard/period-menu";

const TODAY = "2026-10-11";

type Current = Parameters<typeof PeriodMenu>[0]["current"];

function renderMenu(current: Current = { from: "2026-09-11", range: "last_30_days", to: "2026-10-10" }) {
  const onCustom = vi.fn();
  const onPreset = vi.fn();
  render(<PeriodMenu current={current} onCustom={onCustom} onPreset={onPreset} today={TODAY} />);
  return { onCustom, onPreset };
}

async function openCustom(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Time period" }));
  await user.click(screen.getByRole("button", { name: /Custom range…/ }));
}

async function pickDay(user: ReturnType<typeof userEvent.setup>, field: "From" | "To", day: string) {
  const form = screen.getByRole("heading", { name: "Custom range" }).parentElement as HTMLElement;
  await user.click(within(form).getByLabelText(new RegExp(`^${field}`)));
  await user.click(screen.getByRole("button", { name: day }));
}

describe("PeriodMenu", () => {
  it("shows the current period on the button, years included", () => {
    renderMenu();
    expect(screen.getByRole("button", { name: "Time period" })).toHaveTextContent(/Last 30 days.*2026/);
  });

  it("opens with the four presets and the custom option", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "Time period" }));

    const menu = screen.getByRole("group", { name: "Time period" });
    expect(within(menu).getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringMatching(/^Last 7 days/),
      expect.stringMatching(/^Last 30 days/),
      expect.stringMatching(/^Last 90 days/),
      expect.stringMatching(/^This month/),
      "Custom range…",
    ]);
  });

  it("reports a preset and closes", async () => {
    const user = userEvent.setup();
    const { onPreset } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Time period" }));
    await user.click(screen.getByRole("button", { name: /Last 90 days/ }));

    expect(onPreset).toHaveBeenCalledWith("last_90_days");
    expect(screen.queryByRole("group", { name: "Time period" })).not.toBeInTheDocument();
  });

  it("starts the custom form from the period on screen and counts its days", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openCustom(user);

    expect(screen.getByRole("heading", { name: "Custom range" })).toBeInTheDocument();
    expect(screen.getByText(/Whole days in Ho Chi Minh City time/)).toHaveTextContent("That is 30 days.");
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("applies a custom range", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderMenu({ from: "2026-10-04", range: "last_7_days", to: "2026-10-10" });
    await openCustom(user);
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onCustom).toHaveBeenCalledWith("2026-10-04", "2026-10-10");
  });

  it("refuses an end before the start and does not apply it", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderMenu({ from: "2026-10-04", range: "last_7_days", to: "2026-10-10" });
    await openCustom(user);
    await pickDay(user, "To", "03/10/2026");

    expect(screen.getByRole("alert")).toHaveTextContent("“To” must be on or after “From”.");
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(onCustom).not.toHaveBeenCalled();
  });

  it("refuses a period longer than 366 days and does not apply it", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderMenu({ from: "2025-01-01", range: "custom", to: "2026-10-10" });
    await openCustom(user);

    expect(screen.getByRole("alert")).toHaveTextContent("A period can cover at most 366 days.");
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(onCustom).not.toHaveBeenCalled();
  });

  it("goes back to the presets on Cancel without applying anything", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderMenu();
    await openCustom(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("group", { name: "Time period" })).toBeInTheDocument();
    expect(onCustom).not.toHaveBeenCalled();
  });

  it("marks the custom option when a custom range is showing", async () => {
    const user = userEvent.setup();
    renderMenu({ from: "2026-10-04", range: "custom" as const, to: "2026-10-10" });
    await user.click(screen.getByRole("button", { name: "Time period" }));

    expect(screen.getByRole("button", { name: "Custom range…" })).toHaveAttribute("aria-pressed", "true");
  });
});
