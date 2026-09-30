import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { postApiV1AuthLogin } from "@/api/generated";
import { authClient } from "@/auth/auth-client";
import { LoginPage } from "@/features/auth/login-page";

vi.mock("@/api/generated", () => ({
  postApiV1AuthLogin: vi.fn(),
}));

vi.mock("@/auth/auth-client", () => ({
  authClient: {
    login: vi.fn(),
  },
}));

const mockedLogin = vi.mocked(postApiV1AuthLogin);
const mockedAuthClientLogin = vi.mocked(authClient.login);

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email or username input and password field", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forgot password\?/i })).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: /create a candidate account/i })).toHaveAttribute("href", "/register");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();
  });

  it("displays session expired alert banner when query reason=session_expired", () => {
    render(
      <MemoryRouter initialEntries={["/login?reason=session_expired"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/your session has expired\. sign in again to continue\./i),
    ).toBeInTheDocument();
  });

  it("displays signed out alert banner when query reason=logged_out", () => {
    render(
      <MemoryRouter initialEntries={["/login?reason=logged_out"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/you've been signed out\./i)).toBeInTheDocument();
  });

  it("submits valid credentials and calls authClient.login", async () => {
    const user = userEvent.setup();

    mockedLogin.mockResolvedValueOnce({
      data: {
        tokens: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
        },
        user: {
          id: "user-1",
          email: "candidate@example.com",
          username: "candidate1",
          fullName: "Candidate User",
          role: "candidate",
          status: "active",
        },
      },
      error: undefined,
    } as unknown as Awaited<ReturnType<typeof postApiV1AuthLogin>>);

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email or username/i), "candidate1");
    await user.type(screen.getByLabelText(/^password$/i), "Secret123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockedLogin).toHaveBeenCalledWith({
      body: {
        identifier: "candidate1",
        password: "Secret123!",
      },
    });
    expect(mockedAuthClientLogin).toHaveBeenCalled();
  });

  it("displays error alert banner on invalid credentials", async () => {
    const user = userEvent.setup();

    mockedLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email or username/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "WrongPassword!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/email or password is incorrect\./i),
    ).toBeInTheDocument();
  });

  it("displays rate limit alert banner on too many attempts", async () => {
    const user = userEvent.setup();

    mockedLogin.mockRejectedValueOnce(new Error("Too many requests"));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email or username/i), "candidate@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Secret123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/too many sign-in attempts\. please try again in 15 minutes\./i),
    ).toBeInTheDocument();
  });

  it("displays warning banner with resend email action when account is unverified", async () => {
    const user = userEvent.setup();

    mockedLogin.mockRejectedValueOnce(new Error("Email verification required"));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email or username/i), "unverified@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Secret123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/verify your email to continue\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resend email/i })).toHaveAttribute("href", "/verify-email");
  });
});
