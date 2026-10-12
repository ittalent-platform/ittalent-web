import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { postApiV1UserEmailChangesConfirm } from "@/api/generated";
import { useSession } from "@/auth/use-session";
import { ConfirmEmailChangePage } from "@/features/auth/confirm-email-change-page";

vi.mock("@/api/generated", () => ({ postApiV1UserEmailChangesConfirm: vi.fn() }));
vi.mock("@/auth/use-session", () => ({ useSession: vi.fn() }));
const confirm = vi.mocked(postApiV1UserEmailChangesConfirm);
const session = vi.mocked(useSession);

function signedIn(user: object | null = { user: { email: "jane.doe@example.com" } }) {
  session.mockReturnValue({ data: user, isPending: false } as never);
}

function renderPage(route = "/confirm-email-change?token=tok") {
  render(<MemoryRouter initialEntries={[route]}><ConfirmEmailChangePage /></MemoryRouter>);
}

async function submit(password = "secret") {
  const events = userEvent.setup();
  await events.type(screen.getByLabelText(/current password/i), password);
  await events.click(screen.getByRole("button", { name: "Confirm new email" }));
}

describe("ConfirmEmailChangePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedIn();
  });

  it("shows the signed-in address the change starts from", () => {
    renderPage();
    expect(screen.getByText("jane.doe@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Not now" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Confirm new email" })).toBeDisabled();
  });

  it("confirms with the current password and offers sign in again", async () => {
    confirm.mockResolvedValue({ data: {}, response: { status: 200 } } as never);
    renderPage();
    await submit();

    expect(confirm).toHaveBeenCalledWith({ body: { currentPassword: "secret", token: "tok" } });
    expect(await screen.findByText("Email changed")).toBeInTheDocument();
    expect(screen.getByText(/signed out of other devices/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login");
  });

  it("shows a wrong password under the field and keeps the form", async () => {
    confirm.mockResolvedValue({ data: undefined, error: {}, response: { status: 403 } } as never);
    renderPage();
    await submit();

    expect(await screen.findByText("The password is incorrect. Try again.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/current password/i)).toBeInTheDocument());
  });

  it.each([
    [410, "This link isn’t valid"],
    [429, "Too many attempts"],
  ])("replaces the form with an outcome screen for %i", async (status, title) => {
    confirm.mockResolvedValue({ data: undefined, error: {}, response: { status } } as never);
    renderPage();
    await submit();

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to my account" })).toHaveAttribute("href", "/");
    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
  });

  it("asks for the link's token and for sign in", () => {
    renderPage("/confirm-email-change");
    expect(screen.getByText("This link isn’t valid")).toBeInTheDocument();
  });

  it("asks a signed-out visitor to sign in first", () => {
    signedIn(null);
    renderPage();
    expect(screen.getByText("Sign in to confirm")).toBeInTheDocument();
  });
});
