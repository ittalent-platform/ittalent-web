import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RegisterPage } from "@/features/auth/register-page";

describe("RegisterPage", () => {
  it("renders email, username, password and confirm password fields", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in instead/i })).toHaveAttribute("href", "/login");
  });

  it("updates password requirement rules as the user types", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, "Secret123!");

    expect(screen.getByText(/8–64 chars ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/lowercase ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/number ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/!@#\$%\^&\* ✓/i)).toBeInTheDocument();
  });
});
