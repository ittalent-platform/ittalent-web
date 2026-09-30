import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
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


// The pages read and write the session cache, so they need a QueryClient like the real app provides.
function renderWithClient(ui: ReactElement): QueryClient {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return queryClient;
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email or username input and password field", () => {
    renderWithClient(
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

    renderWithClient(
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
    renderWithClient(
      <MemoryRouter initialEntries={["/login?reason=session_expired"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/your session has expired\. sign in again to continue\./i),
    ).toBeInTheDocument();
  });

  it("displays signed out alert banner when query reason=logged_out", () => {
    renderWithClient(
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

    renderWithClient(
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

  it("replaces a stale signed-out session with the signed-in user", async () => {
    const user = userEvent.setup();
    const signedIn = {
      id: "user-1",
      email: "admin@example.com",
      username: "admin",
      role: "admin",
      status: "active",
      enterpriseId: null,
    };

    mockedLogin.mockResolvedValueOnce({
      data: { tokens: { accessToken: "a", refreshToken: "r" }, user: signedIn },
      error: undefined,
    } as unknown as Awaited<ReturnType<typeof postApiV1AuthLogin>>);

    const queryClient = renderWithClient(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );
    // An earlier /auth/me check with an expired token left "signed out" in the cache.
    queryClient.setQueryData(["auth", "me"], null);

    await user.type(screen.getByLabelText(/email or username/i), "admin@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Admin123456!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(queryClient.getQueryData(["auth", "me"])).toEqual(signedIn));
  });

  it("displays error alert banner on invalid credentials", async () => {
    const user = userEvent.setup();

    mockedLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    renderWithClient(
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

    renderWithClient(
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

    renderWithClient(
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
