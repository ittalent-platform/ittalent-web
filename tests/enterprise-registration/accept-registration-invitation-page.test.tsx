import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcceptRegistrationInvitationPage } from "@/features/enterprise-registration/pages/accept-registration-invitation-page";
import * as queries from "@/features/enterprise-registration/enterprise-registration.queries";

const mockMutateAsync = vi.fn();

vi.spyOn(queries, "useAcceptRegistrationInvitationMutation").mockReturnValue({
  mutateAsync: mockMutateAsync,
  isPending: false,
} as unknown as ReturnType<typeof queries.useAcceptRegistrationInvitationMutation>);

const PASSWORD = "Str0ng!Passw0rd";

function renderPage(route = "/enterprise-registration/invitation?token=valid-token-123") {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[route]}>
        <AcceptRegistrationInvitationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AcceptRegistrationInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays missing token warning when token query param is absent", () => {
    renderPage("/enterprise-registration/invitation");
    expect(
      screen.getByText(/Invitation link isn’t valid/i),
    ).toBeInTheDocument();
  });

  it("renders activation form with password fields and terms checkbox", () => {
    renderPage();
    expect(screen.getByLabelText(/^New password/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm password/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Terms of Service/i)).toBeInTheDocument();
  });

  it("submits activation successfully and shows success state", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      message: "Invitation accepted",
      user: { id: "user-1", email: "admin@corp.vn", role: "enterprise_admin" },
    });

    renderPage();
    const events = userEvent.setup();

    await events.type(screen.getByLabelText(/^New password/i, { selector: "input" }), PASSWORD);
    await events.type(screen.getByLabelText(/^Confirm password/i, { selector: "input" }), PASSWORD);
    await events.click(screen.getByLabelText(/Terms of Service/i));

    const submitBtn = screen.getByRole("button", {
      name: "Set password and activate",
    });
    await waitFor(() => expect(submitBtn).toBeEnabled());

    await events.click(submitBtn);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      token: "valid-token-123",
      password: PASSWORD,
    });

    await waitFor(() => {
      expect(screen.getByText(/Your Enterprise Administrator account is now active/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /^Sign in$/i })).toBeInTheDocument();
    });
  });
});
