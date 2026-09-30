import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "@/components/ui/date-picker";

function Harness({
  initial = "",
  ...props
}: { initial?: string } & Partial<React.ComponentProps<typeof DatePicker>>) {
  const [value, setValue] = useState(initial);
  props.onChange?.(value);
  return (
    <DatePicker
      {...props}
      id="when"
      onChange={setValue}
      today="2026-10-15"
      value={value}
    />
  );
}

describe("DatePicker", () => {
  it("shows the chosen date as dd/mm/yyyy and a placeholder when empty", () => {
    const { rerender } = render(
      <DatePicker onChange={vi.fn()} today="2026-10-15" value="" />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("dd/mm/yyyy");
    rerender(
      <DatePicker onChange={vi.fn()} today="2026-10-15" value="2026-12-31" />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("31/12/2026");
  });

  it("opens on the selected month, picks a day and closes", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-12-31" />);
    await user.click(screen.getByRole("button", { name: /31\/12\/2026/ }));
    expect(screen.getByText(/december 2026/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "10/12/2026" }));
    expect(
      screen.getByRole("button", { name: /10\/12\/2026/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/december 2026/i)).not.toBeInTheDocument();
  });

  it("moves between months", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-12-31" />);
    await user.click(screen.getByRole("button", { name: /31\/12\/2026/ }));
    await user.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByText(/january 2027/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /previous month/i }));
    await user.click(screen.getByRole("button", { name: /previous month/i }));
    expect(screen.getByText(/november 2026/i)).toBeInTheDocument();
  });

  it("disables days outside min and max", async () => {
    const user = userEvent.setup();
    render(<Harness max="2026-10-20" min="2026-10-10" />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "09/10/2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "10/10/2026" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "20/10/2026" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "21/10/2026" })).toBeDisabled();
  });

  it("has a Today shortcut that respects min, and Clear when clearable", async () => {
    const user = userEvent.setup();
    render(<Harness clearable initial="2026-10-20" />);
    await user.click(screen.getByRole("button", { name: /20\/10\/2026/ }));
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(
      screen.getByRole("button", { name: /15\/10\/2026/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /15\/10\/2026/ }));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      screen.getByRole("button", { name: /dd\/mm\/yyyy/ }),
    ).toBeInTheDocument();
  });

  it("disables Today when today is before min", async () => {
    const user = userEvent.setup();
    render(<Harness min="2026-10-16" />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "Today" })).toBeDisabled();
  });
});
