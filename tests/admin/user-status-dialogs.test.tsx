import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserDto } from "@/api/generated/types.gen";
import { ToastProvider } from "@/components/toast/toast-provider";
import { ChangeUserRoleDialog } from "@/features/admin/users/change-user-role-dialog";
import { SuspendUserDialog } from "@/features/admin/users/suspend-user-dialog";
import * as queries from "@/features/admin/users/users.queries";

const user: UserDto = { email: "a@x.vn", emailVerified: true, enterpriseId: "e1", enterpriseName: "Acme", fullName: "Ann Lee", id: "u1", phone: null, role: "recruiter", status: "active", username: "ann", version: 3 };
const LONG_REASON = "Repeated policy violations";
const apiError = (status: number, message: string) => Object.assign(new Error(message), { status });

function mutation(mutateAsync = vi.fn()) {
  return { isPending: false, mutateAsync } as never;
}

function mockHistory(items: unknown[] = []) {
  vi.spyOn(queries, "useUserHistoryQuery").mockReturnValue({ data: { items } } as never);
}

function renderSuspend(target: UserDto, extra: Partial<Parameters<typeof SuspendUserDialog>[0]> = {}) {
  const onOpenChange = vi.fn();
  render(<ToastProvider><SuspendUserDialog onOpenChange={onOpenChange} open user={target} {...extra} /></ToastProvider>);
  return { onOpenChange, events: userEvent.setup() };
}

afterEach(() => vi.restoreAllMocks());

describe("SuspendUserDialog", () => {
  it("keeps Suspend off until the reason has 10 characters", async () => {
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation());
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory();
    const { events } = renderSuspend(user);
    const confirm = screen.getByRole("button", { name: "Suspend account" });

    expect(confirm).toBeDisabled();
    await events.type(screen.getByLabelText(/reason/i), "too short");
    expect(screen.getByText("Enter a reason of at least 10 characters.")).toBeInTheDocument();
    expect(confirm).toBeDisabled();

    await events.type(screen.getByLabelText(/reason/i), "!");
    expect(confirm).toBeEnabled();
  });

  it("sends the version and trimmed reason", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(user);
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation(mutateAsync));
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory();
    const { events, onOpenChange } = renderSuspend(user);

    await events.type(screen.getByLabelText(/reason/i), `  ${LONG_REASON}  `);
    await events.click(screen.getByRole("button", { name: "Suspend account" }));

    expect(mutateAsync).toHaveBeenCalledWith({ body: { expectedVersion: 3, reason: LONG_REASON, status: "suspended" }, id: "u1" });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("on a stale version (409) says the status changed and Show latest refetches", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(apiError(409, "The account changed. Reload and try again."));
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation(mutateAsync));
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory();
    const onReload = vi.fn();
    const { events } = renderSuspend(user, { onReload });

    await events.type(screen.getByLabelText(/reason/i), LONG_REASON);
    await events.click(screen.getByRole("button", { name: "Suspend account" }));

    expect(await screen.findByText("Status already changed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend account" })).toBeDisabled();
    await events.click(screen.getByRole("button", { name: "Show latest" }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["The final active System Administrator cannot be suspended", "This is the last active system admin"],
    ["Activate another Enterprise Administrator before changing this account", "This is the last active Enterprise admin"],
  ])("blocks the change when the API says: %s", async (message, title) => {
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation(vi.fn().mockRejectedValue(apiError(409, message))));
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory();
    const { events } = renderSuspend(user);

    await events.type(screen.getByLabelText(/reason/i), LONG_REASON);
    await events.click(screen.getByRole("button", { name: "Suspend account" }));

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend account" })).toBeDisabled();
  });

  it("offers a retry after a persistence failure (5xx)", async () => {
    const mutateAsync = vi.fn().mockRejectedValueOnce(apiError(503, "down")).mockResolvedValue(user);
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation(mutateAsync));
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory();
    const { events } = renderSuspend(user);

    await events.type(screen.getByLabelText(/reason/i), LONG_REASON);
    await events.click(screen.getByRole("button", { name: "Suspend account" }));
    await events.click(await screen.findByRole("button", { name: "Retry" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
  });

  it("tells an unverified account it signs in again once the email is verified", () => {
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation());
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory([{ actorId: "admin-1", occurredAt: "2026-03-01T03:00:00Z", reason: "Fraud review", action: "status_suspended", id: "h1" }]);
    renderSuspend({ ...user, emailVerified: false, status: "suspended" });

    expect(screen.getByRole("alertdialog", { name: /^Reactivate/ })).toBeInTheDocument();
    expect(screen.getByText(/They can sign in again once the email is verified/)).toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument(); // no Now -> After summary row
    expect(screen.queryByText("Now:")).not.toBeInTheDocument();
  });

  it("blocks a status the account is not in a position to change", () => {
    vi.spyOn(queries, "useUpdateUserStatusMutation").mockReturnValue(mutation());
    vi.spyOn(queries, "useEmergencySuspendUserMutation").mockReturnValue(mutation());
    mockHistory();
    renderSuspend({ ...user, status: "invited" });

    expect(screen.getByText("Already in that status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend account" })).toBeDisabled();
  });
});

describe("ChangeUserRoleDialog", () => {
  function renderRole(mutateAsync: ReturnType<typeof vi.fn>, onReload = vi.fn()) {
    vi.spyOn(queries, "useUpdateUserRoleMutation").mockReturnValue(mutation(mutateAsync));
    render(<ToastProvider><ChangeUserRoleDialog onOpenChange={vi.fn()} onReload={onReload} open user={user} /></ToastProvider>);
    return { events: userEvent.setup(), onReload };
  }

  it("requires a reason of 10 characters and shows current and new role", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(user);
    const { events } = renderRole(mutateAsync);
    const confirm = screen.getByRole("button", { name: "Change role" });

    expect(screen.getByText("Current role").nextElementSibling).toHaveTextContent("HR");
    expect(screen.getByText("New role").nextElementSibling).toHaveTextContent("Enterprise admin");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await events.type(screen.getByLabelText(/reason/i), "short");
    expect(confirm).toBeDisabled();
    await events.type(screen.getByLabelText(/reason/i), " but long enough");
    await events.click(confirm);

    expect(mutateAsync).toHaveBeenCalledWith({ body: { expectedVersion: 3, reason: "short but long enough", role: "enterprise_admin" }, id: "u1" });
  });

  it("blocks on the last Enterprise admin and reloads on a stale version", async () => {
    const mutateAsync = vi.fn()
      .mockRejectedValueOnce(apiError(409, "Activate another Enterprise Administrator before changing this account"))
      .mockRejectedValueOnce(apiError(409, "The account changed. Reload and try again."));
    const { events, onReload } = renderRole(mutateAsync);

    await events.type(screen.getByLabelText(/reason/i), LONG_REASON);
    await events.click(screen.getByRole("button", { name: "Change role" }));
    expect(await screen.findByText("This is the last active Enterprise admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change role" })).toBeDisabled();
    expect(onReload).not.toHaveBeenCalled();
  });
});
