import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcceptInvitationPage } from "@/features/auth/accept-invitation-page";
import { acceptAccountInvitation, previewAccountInvitation } from "@/features/auth/invitation.queries";

vi.mock("@/features/auth/invitation.queries", () => ({ acceptAccountInvitation: vi.fn(), previewAccountInvitation: vi.fn() }));
const preview = vi.mocked(previewAccountInvitation);
const accept = vi.mocked(acceptAccountInvitation);

const PASSWORD = "Str0ng!Passw0rd";
const apiError = (status: number, message = "failed") => Object.assign(new Error(message), { status });

function renderPage(route = "/accept-invitation?token=abc") {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[route]}><AcceptInvitationPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillAndSubmit(confirm = PASSWORD) {
  const events = userEvent.setup();
  await events.type(await screen.findByLabelText(/^new password/i), PASSWORD);
  await events.type(screen.getByLabelText(/^confirm password/i), confirm);
  return events;
}

describe("AcceptInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preview.mockResolvedValue({ email: "hr@acme.vn", enterpriseName: "Acme", expiresAt: "2030-01-01T00:00:00Z", role: "recruiter" });
  });

  it("shows the invited email, role and company and keeps activation off until the passwords are valid and match", async () => {
    renderPage();
    const events = await fillAndSubmit("different");

    expect(screen.getByText("hr@acme.vn")).toBeInTheDocument();
    expect(screen.getByText("HR")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("8–64 characters")).toBeInTheDocument();
    expect(screen.getByText("Acme invited you to join ITTalent. Choose a password to activate your account.")).toBeInTheDocument();
    expect(screen.getByText("Passwords don’t match.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set password and activate" })).toBeDisabled();

    await events.clear(screen.getByLabelText(/^confirm password/i));
    await events.type(screen.getByLabelText(/^confirm password/i), PASSWORD);
    await waitFor(() => expect(screen.getByRole("button", { name: "Set password and activate" })).toBeEnabled());
  });

  it("activates the account and offers sign in", async () => {
    accept.mockResolvedValue({ email: "hr@acme.vn", id: "1", role: "recruiter", status: "active" });
    renderPage();
    const events = await fillAndSubmit();
    await waitFor(() => expect(screen.getByRole("button", { name: "Set password and activate" })).toBeEnabled());
    await events.click(screen.getByRole("button", { name: "Set password and activate" }));

    expect(accept).toHaveBeenCalledWith({ password: PASSWORD, token: "abc" });
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("Your account is active")).toBeInTheDocument();
    expect(screen.getByText(/set up as HR at Acme\. Sign in with hr@acme\.vn/)).toBeInTheDocument();
  });

  it("shows the loading state while the invitation is checked", () => {
    preview.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("explains an invalid, expired or used link (410) and a missing token", async () => {
    preview.mockRejectedValue(apiError(410));
    renderPage();
    expect(await screen.findByText("Invitation link isn’t valid")).toBeInTheDocument();
    expect(screen.getByText(/ask your administrator to send a new one/i)).toBeInTheDocument();
  });

  it("treats a missing token as an invalid link without calling the API", () => {
    renderPage("/accept-invitation");
    expect(screen.getByText("Invitation link isn’t valid")).toBeInTheDocument();
    expect(preview).not.toHaveBeenCalled();
  });

  it("says the company is unavailable on 409", async () => {
    preview.mockRejectedValue(apiError(409));
    renderPage();
    expect(await screen.findByText("The company isn’t available")).toBeInTheDocument();
  });

  it("shows the server's password rule error and keeps the form", async () => {
    accept.mockRejectedValue(apiError(400, "Password is too common"));
    renderPage();
    const events = await fillAndSubmit();
    await waitFor(() => expect(screen.getByRole("button", { name: "Set password and activate" })).toBeEnabled());
    await events.click(screen.getByRole("button", { name: "Set password and activate" }));

    expect(await screen.findByText("Password is too common")).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
  });
});
