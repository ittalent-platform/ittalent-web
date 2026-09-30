import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getApiV1AuthVerifyEmail,
  postApiV1AuthResendVerificationEmail,
} from "@/api/generated";
import { EmailVerificationPage } from "@/features/auth/email-verification-page";

vi.mock("@/api/generated", () => ({
  getApiV1AuthVerifyEmail: vi.fn(),
  postApiV1AuthResendVerificationEmail: vi.fn(),
}));

const mockedVerifyEmail = vi.mocked(getApiV1AuthVerifyEmail);
const mockedResendEmail = vi.mocked(postApiV1AuthResendVerificationEmail);

function renderPage(query = "") {
  return render(
    <MemoryRouter initialEntries={[`/verify-email${query ? `?${query}` : ""}`]}>
      <EmailVerificationPage />
    </MemoryRouter>,
  );
}

describe("EmailVerificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["stage=already-verified&code=EMAIL_ALREADY_VERIFIED", /Email already verified/i],
    ["stage=invalid&code=INVALID_VERIFICATION_TOKEN", /This link isn.t valid/i],
    ["stage=retry-later&code=RATE_LIMITED", /Please try again later/i],
    ["stage=expired&email=known@example.com", /This link has expired/i],
    ["stage=expired", /Resend verification email/i],
    ["stage=success", /Email verified/i],
    ["stage=registration&email=user@example.com", /Check your email/i],
    ["status=invalid&code=INVALID_VERIFICATION_TOKEN", /This link isn.t valid/i],
  ])("renders heading for %s", (query, heading) => {
    renderPage(query);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("shows the address, the three steps and the way back on the registration stage", () => {
    renderPage("stage=registration&email=tester@example.com");

    expect(screen.getByText("tester@example.com")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /sign up again/i })).toHaveAttribute("href", "/register");
  });

  it("handles resend verification email for locked email on registration stage", async () => {
    mockedResendEmail.mockResolvedValue({
      data: {
        success: true,
        message: "Verification email resent successfully.",
        data: { verificationEmailSent: true },
      },
      response: new Response(null, { status: 200 }),
    } as never);

    const user = userEvent.setup();
    renderPage("stage=registration&email=tester@example.com");

    const resendButton = screen.getByRole("button", { name: /^resend email$/i });
    await user.click(resendButton);

    expect(mockedResendEmail).toHaveBeenCalledWith({
      body: {
        email: "tester@example.com",
      },
    });

    expect(await screen.findByText(/New link sent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend again in 1:00/i })).toBeDisabled();
  });

  it("handles resend verification email with input field on expired stage", async () => {
    mockedResendEmail.mockResolvedValue({
      data: {
        success: true,
        message: "New verification link sent to your email.",
        data: { verificationEmailSent: true },
      },
      response: new Response(null, { status: 200 }),
    } as never);

    const user = userEvent.setup();
    renderPage("stage=expired");

    const input = screen.getByLabelText(/^email/i);
    await user.type(input, "expired-user@example.com");

    const resendButton = screen.getByRole("button", { name: /send link/i });
    await user.click(resendButton);

    expect(mockedResendEmail).toHaveBeenCalledWith({
      body: {
        email: "expired-user@example.com",
      },
    });

    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText("expired-user@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute("href", "/login");
  });

  it("offers a new link straight away when the expired link comes with an address", async () => {
    mockedResendEmail.mockResolvedValue({
      data: { success: true },
      response: new Response(null, { status: 200 }),
    } as never);

    const user = userEvent.setup();
    renderPage("stage=expired&email=known@example.com");

    await user.click(screen.getByRole("button", { name: /send a new link/i }));

    expect(mockedResendEmail).toHaveBeenCalledWith({ body: { email: "known@example.com" } });
    expect(await screen.findByText(/New link sent/i)).toBeInTheDocument();
  });

  it("shows error feedback when resend verification email fails", async () => {
    mockedResendEmail.mockResolvedValue({
      error: {
        message: "Too many verification attempts. Please wait.",
      },
      response: new Response(null, { status: 429 }),
    } as never);

    const user = userEvent.setup();
    renderPage("stage=registration&email=ratelimited@example.com");

    const resendButton = screen.getByRole("button", { name: /^resend email$/i });
    await user.click(resendButton);

    expect(
      await screen.findByText(/Too many verification attempts/i),
    ).toBeInTheDocument();
  });

  it("triggers verification API when mounted with token parameter", async () => {
    mockedVerifyEmail.mockResolvedValue({
      data: undefined,
      response: new Response(null, {
        status: 200,
        headers: { Location: "/verify-email?stage=success" },
      }),
    } as never);

    renderPage("token=sample-verification-token");

    expect(mockedVerifyEmail).toHaveBeenCalledWith({
      query: { token: "sample-verification-token" },
    });
  });
});
