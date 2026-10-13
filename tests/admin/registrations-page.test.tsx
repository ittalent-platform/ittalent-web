import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RegistrationsPage } from "@/features/admin/registrations/registrations-page";
import * as regQueries from "@/features/enterprise-registration/enterprise-registration.queries";
import type { EnterpriseRegistrationSummary } from "@/features/enterprise-registration/enterprise-registration.types";

function renderWithClient(ui: React.ReactElement, initialEntries = ["/admin/registrations"]) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/admin/registrations" element={ui} />
          <Route path="/admin/registrations/:id" element={<div data-testid="detail-page">Detail Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockRegistrationItems: EnterpriseRegistrationSummary[] = [
  {
    id: "reg-1",
    registration_code: "REG-2026-0001",
    company_name: "FinTech Solutions VN",
    corporate_email: "contact@fintechvn.io",
    tax_code: "0109988776",
    status: "pending_review",
    representative_name: "Nguyen Van A",
    version: 1,
    submitted_at: "2026-10-10T08:00:00Z",
    created_at: "2026-10-10T08:00:00Z",
    updated_at: "2026-10-10T08:00:00Z",
  },
  {
    id: "reg-2",
    registration_code: "REG-2026-0002",
    company_name: "CloudScale Vietnam",
    corporate_email: "hr@cloudscale.vn",
    tax_code: "0312345678",
    status: "pending_review",
    representative_name: "Tran Thi B",
    version: 2,
    submitted_at: "2026-10-01T10:00:00Z",
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z",
  },
];

describe("Enterprise Registrations Queue Feature Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders RegistrationsPage with header, tabs, and queue items", () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationsListQuery").mockImplementation((params) => {
      if (params.status === "pending_review") {
        return {
          data: {
            items: mockRegistrationItems,
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
          isLoading: false,
        } as never;
      }
      return {
        data: { items: [], total: 0, page: 1, limit: 1, totalPages: 0 },
        isLoading: false,
      } as never;
    });

    renderWithClient(<RegistrationsPage />);

    expect(screen.getByText("Enterprise registrations")).toBeInTheDocument();
    expect(screen.getByText("FinTech Solutions VN")).toBeInTheDocument();
    expect(screen.getByText("CloudScale Vietnam")).toBeInTheDocument();
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
  });

  it("navigates to case detail when a table row is clicked", () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationsListQuery").mockReturnValue({
      data: {
        items: mockRegistrationItems,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
      isLoading: false,
    } as never);

    renderWithClient(<RegistrationsPage />);

    const row = screen.getByText("FinTech Solutions VN").closest("tr");
    expect(row).toBeInTheDocument();
    if (row) {
      fireEvent.click(row);
    }

    expect(screen.getByTestId("detail-page")).toBeInTheDocument();
  });

  it("shows empty state when no registrations match", () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationsListQuery").mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
      isLoading: false,
    } as never);

    renderWithClient(<RegistrationsPage />);

    expect(screen.getByText("No registrations found")).toBeInTheDocument();
  });
});
