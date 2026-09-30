import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getApiV1AuthResetPassword,
  postApiV1AuthResetPassword,
} from "@/api/generated";
import { ResetPasswordPage } from "@/features/auth/reset-password-page";

vi.mock("@/api/generated", () => ({
  getApiV1AuthResetPassword: vi.fn(),
  postApiV1AuthResetPassword: vi.fn(),
}));

const mockedGetResetPassword = vi.mocked(getApiV1AuthResetPassword);
const mockedPostResetPassword = vi.mocked(postApiV1AuthResetPassword);

function renderPage(route = "/reset-password?token=reset-token") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetResetPassword.mockResolvedValue({
      data: {
        success: true,
        data: { valid: true },
        message: "Token is valid",
      },
      response: new Response(null, { status: 200 }),
    } as never);
  });

  it("resets the password when a valid token is present", async () => {
    mockedPostResetPassword.mockResolvedValue({
      data: {
        data: {},
        message: "Password reset successful.",
        success: true,
      },
      response: new Response(null, { status: 200 }),
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/^new password$/i),
      "Password123!",
    );
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(mockedPostResetPassword).toHaveBeenCalledWith({
      body: {
        newPassword: "Password123!",
        token: "reset-token",
      },
    });

    expect(
      await screen.findByText(/Password reset successful/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the invalid-link state when no token is provided", () => {
    renderPage("/reset-password");

    expect(screen.getByText(/Invalid reset link/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a new link/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("shows the invalid-link state for an unknown token", async () => {
    mockedGetResetPassword.mockResolvedValue({
      error: { code: "INVALID_RESET_TOKEN" },
      response: new Response(null, { status: 404 }),
    } as never);

    renderPage();

    expect(await screen.findByText(/Invalid reset link/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request (a )?new link/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("shows the expired-link state when the token is gone", async () => {
    mockedGetResetPassword.mockResolvedValue({
      error: { code: "RESET_TOKEN_UNAVAILABLE" },
      response: new Response(null, { status: 410 }),
    } as never);

    renderPage();

    expect(await screen.findByText(/Link expired/i)).toBeInTheDocument();
  });

  it("shows expired state when the token becomes unavailable during submit", async () => {
    mockedPostResetPassword.mockResolvedValue({
      error: {
        code: "RESET_TOKEN_UNAVAILABLE",
        message: "Reset link expired or was already used.",
      },
      response: new Response(null, { status: 410 }),
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/^new password$/i),
      "Password123!",
    );
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByText(/Link expired/i)).toBeInTheDocument();
  });

  it("shows retry state for server errors and retries the preflight check", async () => {
    mockedGetResetPassword
      .mockResolvedValueOnce({
        error: { message: "Internal server error" },
        response: new Response(null, { status: 500 }),
      } as never)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { valid: true },
          message: "Token is valid",
        },
        response: new Response(null, { status: 200 }),
      } as never);

    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText(/Unable to check reset link/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Link expired/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^retry$/i }));

    expect(await screen.findByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(mockedGetResetPassword).toHaveBeenCalledTimes(2);
  });

  it("shows retry state when the preflight request fails", async () => {
    mockedGetResetPassword.mockRejectedValue(new TypeError("Failed to fetch"));

    renderPage();

    expect(
      await screen.findByText(/Unable to check reset link/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Link expired/i)).not.toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderPage();

    const passwordInput = await screen.findByLabelText(/^new password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: /show new password/i }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /hide new password/i }),
    ).toHaveClass("-translate-y-1/2");
  });

  it("renders password requirements helper text", async () => {
    renderPage();

    expect(
      await screen.findByText(
        "8–64 characters with upper case, lower case, a number and a special character.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a retry warning when the API rate limits the request", async () => {
    mockedPostResetPassword.mockResolvedValue({
      error: {
        message: "Too many password reset attempts. Please try again later.",
      },
      response: new Response(null, { status: 429 }),
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/^new password$/i),
      "Password123!",
    );
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(
      await screen.findByText(/Too many password reset attempts/i),
    ).toBeInTheDocument();
  });
});
