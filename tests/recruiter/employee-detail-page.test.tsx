import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EmployeeDetailPage } from "@/features/recruiter/employees/employee-detail-page";
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

const mockEmployee = {
  id: "emp-101",
  email: "marcus.vance@acme.inc",
  fullName: "Marcus Vance",
  role: "recruiter" as const,
  status: "active" as const,
  title: "Senior Recruiter",
  department: "Talent Acquisition",
  phone: "+1 (555) 019-2834",
  emailVerified: true,
  lastLoginAt: "2026-10-11T09:30:00.000Z",
  createdAt: "2025-06-20T10:00:00.000Z",
  statusUpdatedAt: "2026-01-01T08:00:00.000Z",
  statusReason: "Initial activation",
};

const mockHistory = {
  items: [
    {
      id: "hist-1",
      action: "STATUS_CHANGE",
      description: "Status changed to active",
      actorName: "Admin User",
      timestamp: "2026-01-01T08:00:00.000Z",
    },
    {
      id: "hist-2",
      action: "ACCOUNT_CREATED",
      description: "Employee account created via invitation",
      actorName: "Admin User",
      timestamp: "2025-06-20T10:00:00.000Z",
    },
  ],
  total: 2,
};

describe("Recruiter Employee Detail Page Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders employee details cards and audit timeline", () => {
    vi.spyOn(empQueries, "useEmployeeDetailQuery").mockReturnValue({
      data: mockEmployee,
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(empQueries, "useEmployeeHistoryQuery").mockReturnValue({
      data: mockHistory,
      isLoading: false,
      isError: false,
    } as never);

    renderWithClient(
      <MemoryRouter initialEntries={["/recruiter/employees/emp-101"]}>
        <Routes>
          <Route
            path="/recruiter/employees/:employeeId"
            element={<EmployeeDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Marcus Vance" }),
    ).toBeInTheDocument();
    expect(screen.getByText("marcus.vance@acme.inc")).toBeInTheDocument();
    expect(screen.getByText(/Employee information/i)).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Membership")).toBeInTheDocument();
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getByText(/Status changed to active/i)).toBeInTheDocument();
  });

  it("opens change status dialog and submits reason", async () => {
    vi.spyOn(empQueries, "useEmployeeDetailQuery").mockReturnValue({
      data: mockEmployee,
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(empQueries, "useEmployeeHistoryQuery").mockReturnValue({
      data: mockHistory,
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({
      id: "emp-101",
      status: "suspended",
    });

    vi.spyOn(empQueries, "useUpdateEmployeeStatusMutation").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(
      <MemoryRouter initialEntries={["/recruiter/employees/emp-101"]}>
        <Routes>
          <Route
            path="/recruiter/employees/:employeeId"
            element={<EmployeeDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const changeStatusBtn = screen.getByRole("button", {
      name: /Change status/i,
    });
    fireEvent.click(changeStatusBtn);

    expect(
      screen.getByRole("heading", { name: /Suspend membership/i }),
    ).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Reason for status change/i);
    fireEvent.change(reasonInput, {
      target: { value: "Employee temporary sabbatical leave" },
    });

    const confirmBtn = screen.getByRole("button", {
      name: /Suspend membership/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        status: "suspended",
        reason: "Employee temporary sabbatical leave",
      });
    });
  });

  it("opens audit history modal and displays all history records", () => {
    vi.spyOn(empQueries, "useEmployeeDetailQuery").mockReturnValue({
      data: mockEmployee,
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(empQueries, "useEmployeeHistoryQuery").mockReturnValue({
      data: mockHistory,
      isLoading: false,
      isError: false,
    } as never);

    renderWithClient(
      <MemoryRouter initialEntries={["/recruiter/employees/emp-101"]}>
        <Routes>
          <Route
            path="/recruiter/employees/:employeeId"
            element={<EmployeeDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const viewFullAuditBtn = screen.getByRole("button", { name: /View all/i });
    fireEvent.click(viewFullAuditBtn);

    expect(
      screen.getByRole("heading", { name: "Employee account history" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Employee account created via invitation"),
    ).toBeInTheDocument();
  });

  it("opens edit employee dialog, modifies display name and phone, and saves", async () => {
    vi.spyOn(empQueries, "useEmployeeDetailQuery").mockReturnValue({
      data: mockEmployee,
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(empQueries, "useEmployeeHistoryQuery").mockReturnValue({
      data: mockHistory,
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({
      ...mockEmployee,
      fullName: "Marcus Vance Jr",
      phone: "+1 (555) 999-0000",
    });

    vi.spyOn(empQueries, "useUpdateEmployeeMutation").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(
      <MemoryRouter initialEntries={["/recruiter/employees/emp-101"]}>
        <Routes>
          <Route
            path="/recruiter/employees/:employeeId"
            element={<EmployeeDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const editBtn = screen.getByRole("button", { name: /Edit information/i });
    fireEvent.click(editBtn);

    expect(
      screen.getByRole("heading", { name: "Edit employee" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Display name/i);
    fireEvent.change(nameInput, { target: { value: "Marcus Vance Jr" } });

    const phoneInput = screen.getByLabelText(/Work phone/i);
    fireEvent.change(phoneInput, { target: { value: "+1 (555) 999-0000" } });

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        fullName: "Marcus Vance Jr",
        phone: "+1 (555) 999-0000",
      });
    });
  });
});
