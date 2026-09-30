import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { postApiV1AuthForgotPassword } from "@/api/generated";
import { ForgotPasswordPage } from "@/features/auth/forgot-password-page";

vi.mock("@/api/generated", () => ({
  postApiV1AuthForgotPassword: vi.fn(),
}));

const mockedForgotPassword = vi.mocked(postApiV1AuthForgotPassword);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title, instructions, email input, submit button, and back link", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to sign in/i }),
    ).toHaveAttribute("href", "/login");
  });

  it("validates required and invalid email input", async () => {
    const user = userEvent.setup();
    renderPage();

    const submitButton = screen.getByRole("button", {
      name: /send reset link/i,
    });
    await user.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();

    const input = screen.getByLabelText(/^email$/i);
    await user.type(input, "not-an-email");
    await user.click(submitButton);

    expect(
      await screen.findByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it("submits email and displays success notification on 200", async () => {
    mockedForgotPassword.mockResolvedValue({
      data: {
        success: true,
        message: "Reset email dispatched.",
        data: {},
      },
      response: new Response(null, { status: 200 }),
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^email$/i), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: /send reset link/i }),
    );

    expect(mockedForgotPassword).toHaveBeenCalledWith({
      body: {
        email: "user@example.com",
      },
    });

    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute("href", "/login");
    expect(screen.getByText(/works once and expires in 24 hours/i)).toBeInTheDocument();

    // "Wrong email?" returns to the form so another address can be tried.
    await user.click(screen.getByRole("button", { name: /use a different email/i }));
    expect(screen.getByRole("heading", { name: /reset your password/i })).toBeInTheDocument();
  });

  it("handles rate limit 429 response gracefully", async () => {
    mockedForgotPassword.mockResolvedValue({
      error: {
        message: "Too many reset requests for this email. Please try again later.",
      },
      response: new Response(null, { status: 429 }),
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText(/^email$/i),
      "rate-limited@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: /send reset link/i }),
    );

    expect(
      await screen.findByText(
        /too many reset requests for this email\. please try again later\./i,
      ),
    ).toBeInTheDocument();
  });

  it("handles 503 service unavailable response gracefully", async () => {
    mockedForgotPassword.mockResolvedValue({
      error: {
        message: "We couldn't send the email right now. Please try again later.",
      },
      response: new Response(null, { status: 503 }),
    } as never);

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^email$/i), "fail@example.com");
    await user.click(
      screen.getByRole("button", { name: /send reset link/i }),
    );

    expect(
      await screen.findByText(
        /we couldn't send the email right now\. please try again later\./i,
      ),
    ).toBeInTheDocument();
  });
});
