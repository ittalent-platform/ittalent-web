import { MemoryRouter } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EmployeesPage } from "@/features/recruiter/employees/employees-page";
import * as empQueries from "@/features/recruiter/employees/employees.queries";
import { ToastProvider } from "@/components/toast/toast-provider";

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

const mockEmployees = [
  {
    id: "emp-1",
    email: "sarah.jenkins@acme.inc",
    fullName: "Sarah Jenkins",
    role: "recruiter" as const,
    status: "active" as const,
    title: "Senior Technical Recruiter",
    department: "Talent Acquisition",
    phone: "+1 (555) 234-5678",
    emailVerified: true,
    lastLoginAt: "2026-10-10T14:30:00.000Z",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "emp-2",
    email: "alex.rivera@acme.inc",
    fullName: "Alex Rivera",
    role: "recruiter" as const,
    status: "pending" as const,
    title: "Talent Sourcer",
    department: "Talent Acquisition",
    phone: null,
    emailVerified: false,
    lastLoginAt: null,
    createdAt: "2026-10-08T11:00:00.000Z",
  },
  {
    id: "emp-3",
    email: "marcus.vance@acme.inc",
    fullName: "Marcus Vance",
    role: "recruiter" as const,
    status: "suspended" as const,
    title: "Lead Recruiter",
    department: "People Ops",
    phone: "+1 (555) 876-5432",
    emailVerified: true,
    lastLoginAt: "2026-09-01T10:00:00.000Z",
    createdAt: "2025-05-12T08:00:00.000Z",
  },
];

describe("Recruiter Employees Page Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders employee list, header, search input, and add employee button", () => {
    vi.spyOn(empQueries, "useEmployeesListQuery").mockReturnValue({
      data: {
        items: mockEmployees,
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    } as never);

    renderWithClient(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Employees" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search employee or email/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Invite HR employee/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("Marcus Vance")).toBeInTheDocument();
  });

  it("filters employees when searching in input", () => {
    vi.spyOn(empQueries, "useEmployeesListQuery").mockReturnValue({
      data: {
        items: mockEmployees,
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    } as never);

    renderWithClient(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search employee or email/i,
    );
    fireEvent.change(searchInput, { target: { value: "Sarah" } });

    expect(empQueries.useEmployeesListQuery).toHaveBeenCalledWith(
      expect.objectContaining({ search: "Sarah" }),
    );
  });

  it("opens invite dialog and submits new employee", async () => {
    vi.spyOn(empQueries, "useEmployeesListQuery").mockReturnValue({
      data: {
        items: mockEmployees,
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({
      id: "emp-new",
      email: "new.recruit@acme.inc",
      fullName: "New Recruit",
      status: "pending",
    });

    vi.spyOn(empQueries, "useCreateEmployeeMutation").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>,
    );

    const addBtn = screen.getByRole("button", { name: /Invite HR employee/i });
    fireEvent.click(addBtn);

    expect(
      screen.getByRole("heading", { name: "Invite HR employee" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: "new.recruit@acme.inc" },
    });
    fireEvent.change(screen.getByLabelText(/Display name/i), {
      target: { value: "New Recruit" },
    });
    fireEvent.change(screen.getByLabelText(/Job title/i), {
      target: { value: "Recruiting Coordinator" },
    });

    const submitBtn = screen.getByRole("button", { name: /Send invitation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "new.recruit@acme.inc",
        fullName: "New Recruit",
        role: "recruiter",
        phone: undefined,
      });
    });

    // Invitation Sent confirmation screen appears
    await waitFor(() => {
      expect(screen.getByText("Invitation sent")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Copy invitation link/i }),
      ).toBeInTheDocument();
    });
  });
});
