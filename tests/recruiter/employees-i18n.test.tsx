import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { EmployeesPage } from "@/features/recruiter/employees/employees-page";
import * as empQueries from "@/features/recruiter/employees/employees.queries";
import { useSession } from "@/auth/use-session";

vi.mock("@/auth/use-session", () => ({ useSession: vi.fn() }));

describe("Recruiter employees page language", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("vi");
    vi.mocked(useSession).mockReturnValue({ data: { user: { id: "admin-1", role: "enterprise_admin" } }, isPending: false, refetch: vi.fn(), logout: vi.fn() } as never);
    vi.spyOn(empQueries, "useEmployeesListQuery").mockReturnValue({
      data: { items: [{ id: "emp-1", email: "a@acme.inc", fullName: "Sarah Jenkins", role: "recruiter", status: "active", createdAt: "2026-01-15T09:00:00.000Z" }], total: 1, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as never);
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("shows Vietnamese text instead of the former hardcoded English", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <EmployeesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Mời nhân viên HR/ })).toBeInTheDocument();
    expect(screen.getByText("Nhà tuyển dụng")).toBeInTheDocument();
    expect(screen.queryByText("Invite HR employee")).not.toBeInTheDocument();
    expect(screen.queryByText("Recruiter")).not.toBeInTheDocument();
    expect(screen.queryByText("Employee")).not.toBeInTheDocument();
  });
});
