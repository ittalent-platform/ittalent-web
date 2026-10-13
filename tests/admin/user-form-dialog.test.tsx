import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserDto } from "@/api/generated/types.gen";
import { ToastProvider } from "@/components/toast/toast-provider";
import { UserFormDialog } from "@/features/admin/users/user-form-dialog";
import { normalizeMobile, userShortName } from "@/features/admin/users/user-display";
import { PHONE_PATTERN } from "@/features/admin/users/users.constants";
import * as queries from "@/features/admin/users/users.queries";

const LONG = "v".repeat(120);
const existing: UserDto = { createdAt: "2026-01-01T00:00:00.000Z", email: "a@x.vn", emailVerified: true, enterpriseId: null, fullName: "Ann Lee", id: "6a4a5424c8097df77a6ed9be", phone: "0901234567", role: "user", status: "active", username: "ann", version: 1 };
const mutation = (mutateAsync = vi.fn(), isPending = false) => ({ isPending, mutateAsync }) as never;

function setup(props: Partial<Parameters<typeof UserFormDialog>[0]> = {}, create = vi.fn(), resend = vi.fn()) {
  vi.spyOn(queries, "useCreateUserMutation").mockReturnValue(mutation(create));
  vi.spyOn(queries, "useUpdateUserMutation").mockReturnValue(mutation());
  vi.spyOn(queries, "useResendInvitationMutation").mockReturnValue(mutation(resend));
  vi.spyOn(queries, "useActiveEnterprisesQuery").mockReturnValue({ data: { items: [], totalPages: 0 }, isError: false, isLoading: false } as never);
  const onOpenChange = vi.fn();
  function Host() {
    const [open, setOpen] = useState(true);
    return <UserFormDialog onOpenChange={(next) => { onOpenChange(next); setOpen(next); }} open={open} {...props} />;
  }
  render(<MemoryRouter><ToastProvider><Host /></ToastProvider></MemoryRouter>);
  return { events: userEvent.setup(), onOpenChange };
}

afterEach(() => vi.restoreAllMocks());

describe("mobile number rules", () => {
  it("keeps digits only, turns +84 / 84 into 0 and stops at 10 digits", () => {
    expect(normalizeMobile("090.123-4567")).toBe("0901234567");
    expect(normalizeMobile("+84 901 234 567")).toBe("0901234567");
    expect(normalizeMobile("84901234567")).toBe("0901234567");
    expect(normalizeMobile("(090) 123 45678 9")).toBe("0901234567");
    expect(normalizeMobile("abc+")).toBe("");
  });

  it("accepts only 0[35789] followed by 8 digits", () => {
    expect(PHONE_PATTERN.test("0901234567")).toBe(true);
    for (const bad of ["0201234567", "090123456", "09012345678", "+84901234567"]) expect(PHONE_PATTERN.test(bad)).toBe(false);
  });

  it("strips typed and pasted noise in the field", async () => {
    const { events } = setup();
    const field = screen.getByLabelText(/mobile number/i);
    await events.type(field, "09a0-1 2");
    expect(field).toHaveValue("09012");
    await events.clear(field);
    await events.click(field);
    await events.paste("+84 901 234 567");
    expect(field).toHaveValue("0901234567");
  });

  it("shows the Vietnamese-format hint and placeholder", () => {
    setup();
    expect(screen.getByText("Optional · 10 digits starting with 0, e.g. 0901234567")).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toHaveAttribute("placeholder", "0901234567");
  });
});

describe("create dialog", () => {
  it("has no side panel", () => {
    setup();
    for (const text of ["Required to create", "The invitee sets their own password", "Set by the system"]) expect(screen.queryByText(text)).not.toBeInTheDocument();
  });

  it("shows the work-email hint only for HR and Enterprise admin", async () => {
    const { events } = setup();
    expect(screen.getByText("Max 254 characters · must be unique")).toBeInTheDocument();
    expect(screen.queryByText(/work email address/)).not.toBeInTheDocument();

    await events.click(screen.getByLabelText("HR"));
    expect(screen.getByText(/Use the work email address that should receive this invitation/)).toBeInTheDocument();
    await events.click(screen.getByLabelText("Enterprise admin"));
    expect(screen.getByText(/work email address/)).toBeInTheDocument();
    await events.click(screen.getByLabelText("Applicant"));
    expect(screen.queryByText(/work email address/)).not.toBeInTheDocument();
  });

  it("closes the form and opens a separate Invitation not delivered dialog", async () => {
    const create = vi.fn().mockResolvedValue({ invitation: { deliveryStatus: "failed" }, user: { email: LONG + "@x.vn", id: "u9" } });
    const resend = vi.fn().mockResolvedValue({ deliveryStatus: "sent" });
    const onCreated = vi.fn();
    const { events, onOpenChange } = setup({ onCreated }, create, resend);
    await events.type(screen.getByLabelText(/full name/i), "Ann Lee");
    await events.type(screen.getByLabelText(/^email/i), "ann@x.vn");
    await events.type(screen.getByLabelText(/username/i), "ann_lee");
    const submit = screen.getByRole("button", { name: "Create and send invitation" });
    await events.tab();
    await waitFor(() => expect(submit).toBeEnabled());
    await events.click(submit);

    await waitFor(() => expect(create).toHaveBeenCalled());
    const dialog = await screen.findByRole("alertdialog", { name: "Invitation not delivered" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog).not.toContainElement(document.getElementById("user-form"));
    expect(within(dialog).getByText(LONG + "@x.vn")).toHaveClass("wrap-anywhere");
    expect(within(dialog).getByText(/stays Invited/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Open account" })).toHaveAttribute("href", "/admin/users/u9");
    expect(within(dialog).getByRole("link", { name: "Open account" })).toHaveClass("h-10");
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    const resendButton = within(dialog).getByRole("button", { name: "Send invitation again" });
    expect(resendButton).toHaveClass("h-10", "px-4");
    await events.click(resendButton);
    await waitFor(() => expect(resend).toHaveBeenCalledWith("u9"));
    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Invitation not delivered" })).not.toBeInTheDocument());
  });
});

describe("edit dialog", () => {
  it("locks the email with a tooltip instead of helper text", async () => {
    setup({ onChangeEmail: vi.fn(), user: existing });
    const email = screen.getByLabelText(/^email/i);
    expect(email).toHaveAttribute("readonly");
    expect(email).toHaveClass("bg-muted");
    expect(screen.queryByText("Not editable here")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change email" })).toBeInTheDocument();
    act(() => email.focus());
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Email is the sign-in identity. Use Change email to change it.");
    expect(document.querySelector("#user-email")?.closest("div")?.querySelector("p")).toBeNull();
  });
});

describe("long text", () => {
  it("shortens names for titles", () => {
    expect(userShortName({ fullName: LONG, username: "x" })).toBe(`${"v".repeat(30)}…`);
    expect(userShortName({ fullName: "Ann", username: "x" })).toBe("Ann");
  });
});
