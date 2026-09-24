import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/auth/protected-route";
import * as useSessionModule from "@/auth/use-session";

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to /login", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: null,
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/users" element={<div>Admin Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("redirects non-admin users to / when admin role is required", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "u1",
          email: "user@example.com",
          username: "normaluser",
          role: "user",
          status: "active",
        },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/users" element={<div>Admin Content</div>} />
          </Route>
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("allows admin users when admin role is required", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "a1",
          email: "admin@example.com",
          username: "adminuser",
          role: "admin",
          status: "active",
        },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/users" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });
});
