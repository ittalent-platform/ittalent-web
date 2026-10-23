import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/auth/protected-route";
import { JOB_POSTING_MANAGER_ROLES, JOB_POSTING_WRITER_ROLES } from "@/auth/roles";
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

  it("redirects recruiters away from admin routes to their dashboard", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "r1",
          email: "recruiter@example.com",
          username: "recruiter",
          role: "recruiter",
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
          <Route path="/recruiter/job-postings" element={<div>Recruiter Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Recruiter Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it.each([
    ["recruiter", "recruiter@example.com"],
    ["enterprise_admin", "enterprise-admin@example.com"],
  ])("allows %s to reuse job posting management routes", (role, email) => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "manager-1",
          email,
          username: role,
          role,
          status: "active",
        },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/recruiter/job-postings"]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute allowedRoles={JOB_POSTING_MANAGER_ROLES} />
            }
          >
            <Route
              path="/recruiter/job-postings"
              element={<div>Job Posting Management</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Job Posting Management")).toBeInTheDocument();
  });

  it("redirects an enterprise admin away from admin-only routes to job postings", () => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: {
          id: "enterprise-admin-1",
          email: "enterprise-admin@example.com",
          username: "enterprise-admin",
          role: "enterprise_admin",
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
          <Route
            path="/recruiter/job-postings"
            element={<div>Job Posting Management</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Job Posting Management")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it.each([
    ["recruiter", "Job Posting Form", "Job Posting Management"],
    ["enterprise_admin", "Job Posting Management", "Job Posting Form"],
  ])("lets %s see %s on a write-only job posting route", (role, shown, hidden) => {
    vi.spyOn(useSessionModule, "useSession").mockReturnValue({
      data: {
        user: { id: "m1", email: "m@example.com", username: role, role, status: "active" },
      },
      isPending: false,
      logout: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/recruiter/job-postings/create"]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRoles={JOB_POSTING_WRITER_ROLES} />}>
            <Route path="/recruiter/job-postings/create" element={<div>Job Posting Form</div>} />
          </Route>
          <Route path="/recruiter/job-postings" element={<div>Job Posting Management</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(shown)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
  });
});
