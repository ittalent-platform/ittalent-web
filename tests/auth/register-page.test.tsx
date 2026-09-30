import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  postApiV1AuthRegister,
  postApiV1AuthResendVerificationEmail,
} from "@/api/generated";
import { authClient } from "@/auth/auth-client";
import { RegisterPage } from "@/features/auth/register-page";

vi.mock("@/api/generated", () => ({
  postApiV1AuthRegister: vi.fn(),
  postApiV1AuthResendVerificationEmail: vi.fn(),
}));

vi.mock("@/auth/auth-client", () => ({
  authClient: {
    login: vi.fn(),
  },
}));

const mockedRegister = vi.mocked(postApiV1AuthRegister);
const mockedResend = vi.mocked(postApiV1AuthResendVerificationEmail);
const mockedAuthLogin = vi.mocked(authClient.login);

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders candidate registration fields and terms checkbox", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password \*$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password \*$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/terms of use/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });

  it("updates password requirement rules as the user types", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText(/^password \*$/i);
    await user.type(passwordInput, "Secret123!");

    expect(screen.getByText(/8–64 chars ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/lowercase ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/number ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/!@#\$%\^&\* ✓/i)).toBeInTheDocument();
  });

  it("submits registration, logs in tokens, and displays Check your email screen", async () => {
    mockedRegister.mockResolvedValue({
      data: {
        tokens: { accessToken: "test-acc-token", refreshToken: "test-ref-token" },
        user: {
          id: "user-123",
          email: "newuser@example.com",
          username: "newuser",
          role: "user",
          status: "inactive",
        },
        verificationEmailSent: true,
      },
      response: new Response(null, { status: 201 }),
    } as never);

    mockedResend.mockResolvedValue({
      data: { message: "Verification email resent successfully" },
      response: new Response(null, { status: 200 }),
    } as never);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/full name/i), "Nguyen Van A");
    await user.type(screen.getByLabelText(/username/i), "newuser");
    await user.type(screen.getByLabelText(/email/i), "newuser@example.com");
    await user.type(screen.getByLabelText(/^password \*$/i), "Secret123!");
    await user.type(screen.getByLabelText(/^confirm password \*$/i, { selector: "input" }), "Secret123!");
    await user.click(screen.getByLabelText(/terms of use/i));

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockedRegister).toHaveBeenCalledWith({
      body: {
        email: "newuser@example.com",
        username: "newuser",
        password: "Secret123!",
      },
    });

    expect(mockedAuthLogin).toHaveBeenCalledWith(
      { accessToken: "test-acc-token", refreshToken: "test-ref-token" },
      expect.objectContaining({ id: "user-123", email: "newuser@example.com" }),
    );

    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText(/newuser@example\.com/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to sign in/i })).toHaveAttribute("href", "/login");

    const resendButton = screen.getByRole("button", { name: /resend email/i });
    expect(resendButton).toBeInTheDocument();
    await user.click(resendButton);

    expect(mockedResend).toHaveBeenCalledWith({
      body: { email: "newuser@example.com" },
    });
    expect(await screen.findByText(/new verification link has been sent/i)).toBeInTheDocument();
  });
});
