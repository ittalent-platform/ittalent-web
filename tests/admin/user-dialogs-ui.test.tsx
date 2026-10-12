import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Ban } from "lucide-react";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserDto } from "@/api/generated/types.gen";
import { authKeys } from "@/auth/use-session";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { StatusPanel } from "@/components/common/status-panel";
import { ToastProvider } from "@/components/toast/toast-provider";
import { ChangeUserEmailDialog } from "@/features/admin/users/change-user-email-dialog";
import { AdminUserDetailPage } from "@/features/admin/users/user-detail-page";
import { UserFormDialog } from "@/features/admin/users/user-form-dialog";
import { UsersTable } from "@/features/admin/users/users-table";
import * as queries from "@/features/admin/users/users.queries";

const user: UserDto = { createdAt: "2026-01-01T00:00:00.000Z", email: "a@x.vn", emailVerified: true, enterpriseId: null, fullName: "Ann Lee", id: "6a4a5424c8097df77a6ed9be", phone: "0901234567", role: "user", status: "active", username: "ann", version: 1 };
const mutation = (mutateAsync = vi.fn(), isPending = false) => ({ isPending, mutateAsync }) as never;

afterEach(() => vi.restoreAllMocks());

describe("ActionConfirmDialog closing", () => {
  function setup(props: { dirty?: boolean; disabled?: boolean }) {
    const onOpenChange = vi.fn();
    function Host() {
      const [open, setOpen] = useState(true);
      return <ActionConfirmDialog action="Suspend account" description="Why?" icon={Ban} onConfirm={vi.fn()} onOpenChange={(next) => { onOpenChange(next); setOpen(next); }} open={open} title="Suspend Ann?" variant="destructive-solid" {...props} />;
    }
    render(<Host />);
    return { events: userEvent.setup(), onOpenChange };
  }
  const overlay = () => document.querySelector("[data-slot=alert-dialog-overlay]") as HTMLElement;

  it("closes on an outside click and on Escape when nothing was typed", async () => {
    const { events, onOpenChange } = setup({});
    await events.click(overlay());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes on Escape when pristine", async () => {
    const { events, onOpenChange } = setup({});
    await events.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("asks before discarding typed input, on outside click and Escape, and keeps it open on 'Keep editing'", async () => {
    const { events, onOpenChange } = setup({ dirty: true });
    await events.click(overlay());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(await screen.findByRole("alertdialog", { name: "Discard what you entered?" })).toBeInTheDocument();
    await events.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("alertdialog", { name: "Discard what you entered?" })).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Suspend Ann?" })).toBeInTheDocument();

    await events.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
    await events.click(await screen.findByRole("button", { name: "Discard" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("does not close while a request is pending", async () => {
    const { events, onOpenChange } = setup({ disabled: true });
    await events.click(overlay());
    await events.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("is 560px wide", () => {
    setup({});
    expect(screen.getByRole("alertdialog")).toHaveClass("max-w-[560px]");
  });
});

describe("Edit information dialog", () => {
  function setup() {
    vi.spyOn(queries, "useCreateUserMutation").mockReturnValue(mutation());
    vi.spyOn(queries, "useUpdateUserMutation").mockReturnValue(mutation());
    vi.spyOn(queries, "useActiveEnterprisesQuery").mockReturnValue({ data: { items: [], totalPages: 0 }, isError: false, isLoading: false } as never);
    render(<MemoryRouter><ToastProvider><UserFormDialog onChangeEmail={vi.fn()} onOpenChange={vi.fn()} open user={user} /></ToastProvider></MemoryRouter>);
    return { dialog: screen.getByRole("dialog", { name: "Edit information" }), events: userEvent.setup() };
  }

  it("has an avatar header with the name, one column of three rows and no change counter", () => {
    const { dialog } = setup();
    expect(dialog).toHaveClass("max-w-[540px]");
    expect(within(dialog).getByText("Ann Lee")).toBeInTheDocument();
    expect(within(dialog).getByText("AL")).toBeInTheDocument();
    const grid = dialog.querySelector("form > div > div") as HTMLElement;
    expect(grid).toHaveClass("grid");
    expect(grid.className).not.toContain("sm:grid-cols-2");
    expect(within(dialog).getByLabelText(/full name/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^email/i)).toHaveAttribute("readonly");
    expect(within(dialog).getByRole("button", { name: "Change email" })).toBeInTheDocument();
    expect(within(dialog).queryByText(/\d changes?$/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("shows a Changed pill next to the label only while the value differs from the saved one", async () => {
    const { dialog, events } = setup();
    expect(within(dialog).queryByText("Changed")).not.toBeInTheDocument();
    await events.type(within(dialog).getByLabelText(/full name/i), "x");
    expect(within(dialog).getAllByText("Changed")).toHaveLength(1);
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeEnabled();
    await events.type(within(dialog).getByLabelText(/mobile number/i), "{Backspace}");
    expect(within(dialog).getAllByText("Changed")).toHaveLength(2);
  });
});

describe("Change email dialog", () => {
  function setup() {
    vi.spyOn(queries, "useRequestEmailChangeMutation").mockReturnValue(mutation());
    const onOpenChange = vi.fn();
    render(<ToastProvider><ChangeUserEmailDialog onOpenChange={onOpenChange} open user={user} /></ToastProvider>);
    return { dialog: screen.getByRole("dialog", { name: "Change email" }), events: userEvent.setup(), onOpenChange };
  }

  it("matches the design: name header, read-only current email, new email with hint, no explanatory box, Send button", () => {
    const { dialog } = setup();
    expect(dialog).toHaveClass("max-w-[560px]");
    expect(within(dialog).getByText("Ann Lee")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Current email")).toHaveAttribute("readonly");
    expect(within(dialog).getByLabelText("Current email")).toHaveValue("a@x.vn");
    expect(within(dialog).getByLabelText(/new email/i)).toBeInTheDocument();
    expect(within(dialog).getByText("We'll send a verification link here. It works for 24 hours.")).toBeInTheDocument();
    expect(within(dialog).queryByText(/until the link is opened/i)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Send verification link" })).toBeDisabled();
  });

  it("closes on Escape when pristine and asks before discarding a typed address", async () => {
    const first = setup();
    await first.events.keyboard("{Escape}");
    expect(first.onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("does not drop a typed address silently", async () => {
    const { dialog, events, onOpenChange } = setup();
    await events.type(within(dialog).getByLabelText(/new email/i), "b@x.vn");
    await events.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(await screen.findByRole("alertdialog", { name: "Discard your changes?" })).toBeInTheDocument();
  });
});

describe("Users table row menu by status", () => {
  async function menuFor(status: UserDto["status"], id = user.id) {
    localStorage.setItem("ittalent_access_token", "token");
    localStorage.setItem("ittalent_refresh_token", "refresh");
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me(), { id: "me", role: "admin" });
    const onSuspend = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><UsersTable isLoading={false} items={[{ ...user, id, status }]} onEdit={vi.fn()} onSort={vi.fn()} onSuspend={onSuspend} onView={vi.fn()} sortBy="createdAt" sortOrder="desc" /></MemoryRouter>
      </QueryClientProvider>,
    );
    const events = userEvent.setup();
    await events.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
    return { events, onSuspend };
  }

  it("offers Suspend for an active account", async () => {
    await menuFor("active");
    expect(await screen.findByRole("menuitem", { name: "Suspend" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Reactivate (and opens the dialog flow) for suspended and blocked accounts", async () => {
    const { events, onSuspend } = await menuFor("suspended");
    await events.click(await screen.findByRole("menuitem", { name: "Reactivate" }));
    expect(onSuspend).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menuitem", { name: "Suspend" })).not.toBeInTheDocument();
  });

  it.each(["blocked"] as const)("offers Reactivate for %s", async (status) => {
    await menuFor(status);
    expect(await screen.findByRole("menuitem", { name: "Reactivate" })).toBeInTheDocument();
  });

  it.each(["invited", "inactive"] as const)("has no status action for %s", async (status) => {
    await menuFor(status);
    expect(await screen.findByRole("menuitem", { name: /view details/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /suspend|reactivate/i })).not.toBeInTheDocument();
  });

  it("hides Suspend on the signed-in administrator's own row", async () => {
    await menuFor("active", "me");
    expect(await screen.findByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Suspend" })).not.toBeInTheDocument();
  });
});

describe("Detail page: suspended banner and history rail", () => {
  function renderDetail(status: UserDto["status"]) {
    vi.spyOn(queries, "useUserDetailQuery").mockReturnValue({ data: { ...user, status }, error: null, isLoading: false } as never);
    vi.spyOn(queries, "useUserHistoryQuery").mockImplementation(((_id: string, _enabled: boolean, options?: { action?: string }) => ({
      data: options?.action
        ? { items: [{ action: "status_suspended", actorId: "admin-1", id: "s1", occurredAt: "2026-10-08T03:30:00Z", reason: "Policy breach" }], total: 1 }
        : { items: [{ action: "status_suspended", actorId: "admin-1", id: "1", occurredAt: "2026-10-08T03:30:00Z" }, { action: "account_invited", actorId: "admin-1", id: "2", occurredAt: "2026-10-01T03:30:00Z" }], total: 7 },
    })) as never);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider><MemoryRouter initialEntries={[`/admin/users/${user.id}`]}><Routes><Route element={<AdminUserDetailPage />} path="/admin/users/:userId" /></Routes></MemoryRouter></ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("has no Reactivate action in the banner (the header already has one)", () => {
    renderDetail("suspended");
    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent("Policy breach");
    expect(within(banner).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Reactivate" })).toHaveLength(1);
  });

  it("renders the recent history as a dotted timeline with a full-history link", () => {
    renderDetail("active");
    const rail = screen.getByRole("heading", { name: "Recent history" }).closest("section") as HTMLElement;
    expect(within(rail).getAllByTestId("timeline-line")).toHaveLength(1);
    expect(rail.querySelector("[data-tone=error]")).not.toBeNull(); // suspended = red
    expect(rail.querySelector("[data-tone=success]")).not.toBeNull(); // created = green
    expect(within(rail).getByText("Account suspended")).toBeInTheDocument();
    expect(within(rail).getByText("8 Oct 2026, 10:30 ICT · by Administrator")).toBeInTheDocument();
    expect(within(rail).getByRole("link", { name: "View full history (7)" })).toBeInTheDocument();
  });
});

describe("StatusPanel", () => {
  it("centres the icon, title and description above a full-width action", () => {
    render(<StatusPanel actions={<button type="button">Sign in</button>} description="Sign in with your new password." icon={Ban} title="Your account is ready" />);
    const icon = document.querySelector("svg")!.parentElement as HTMLElement;
    expect(icon).toHaveClass("self-center");
    expect(screen.getByRole("heading", { name: "Your account is ready" }).parentElement).toHaveClass("text-center");
    expect(screen.getByRole("button", { name: "Sign in" }).parentElement).toHaveClass("[&>*]:w-full");
  });
});
