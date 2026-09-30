import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EnterprisesPage } from "@/features/admin/enterprises/enterprises-page";
import { AdminEnterpriseDetailPage } from "@/features/admin/enterprises/enterprise-detail-page";
import { EnterpriseFormPage } from "@/features/admin/enterprises/enterprise-form-page";
import { SuspendEnterpriseDialog } from "@/features/admin/enterprises/enterprise-dialogs";
import * as entQueries from "@/features/admin/enterprises/enterprises.queries";
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

describe("Enterprise Profiles Feature Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders EnterprisesPage with header, items, and filters", () => {
    vi.spyOn(entQueries, "useEnterprisesListQuery").mockReturnValue({
      data: {
        items: [
          {
            id: "67900124c8097df77a6e0012",
            name: "Nova Fintech",
            industry: "Fintech",
            companySize: "201-500",
            location: "Ho Chi Minh, Vietnam",
            status: "active",
            shortDescription: "Payments and digital banking solutions",
            logoUrl: null,
            email: "contact@novafintech.vn",
            phone: "+84 28 3822 1100",
            createdAt: "2026-09-28T08:55:00.000Z",
            creatorAccountId: "admin_1",
          },
          {
            id: "67900124c8097df77a6e0011",
            name: "CloudBridge",
            industry: "Cloud & DevOps",
            companySize: "51-200",
            location: "Da Nang, Vietnam",
            status: "suspended",
            shortDescription: "Cloud migration and DevOps automation",
            logoUrl: null,
            email: "ops@cloudbridge.io",
            phone: "+84 236 123 4567",
            createdAt: "2026-09-20T10:00:00.000Z",
            creatorAccountId: "recruiter_2",
          },
        ],
        limit: 10,
        page: 1,
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof entQueries.useEnterprisesListQuery>);

    renderWithClient(
      <MemoryRouter initialEntries={["/admin/enterprises"]}>
        <EnterprisesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Enterprise Profiles" })).toBeInTheDocument();
    expect(screen.getByText("Nova Fintech")).toBeInTheDocument();
    expect(screen.getByText("CloudBridge")).toBeInTheDocument();
    expect(screen.getByText("Ho Chi Minh, Vietnam")).toBeInTheDocument();
    expect(screen.getByText("contact@novafintech.vn")).toBeInTheDocument();
    expect(screen.getByText("+84 28 3822 1100")).toBeInTheDocument();
    expect(screen.getByText(/28 Sept 2026/)).toBeInTheDocument();
    expect(screen.getByText(/by admin_1/)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Corporate email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Company/i })).toBeInTheDocument();
    expect(screen.getByText("Create enterprise")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by ID, name, or email...")).toBeInTheDocument();
  });

  it("renders empty state when there are no enterprise profiles", () => {
    vi.spyOn(entQueries, "useEnterprisesListQuery").mockReturnValue({
      data: {
        items: [],
        limit: 10,
        page: 1,
        total: 0,
        totalPages: 0,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof entQueries.useEnterprisesListQuery>);

    renderWithClient(
      <MemoryRouter initialEntries={["/admin/enterprises"]}>
        <EnterprisesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("No enterprise profiles yet")).toBeInTheDocument();
  });

  it("renders AdminEnterpriseDetailPage with full company information", () => {
    vi.spyOn(entQueries, "useEnterpriseDetailQuery").mockReturnValue({
      data: {
        id: "67900124c8097df77a6e0012",
        name: "Nova Fintech",
        legalName: "Công ty Cổ phần Nova Fintech",
        taxCode: "0312345678",
        registrationNumber: "REG-2016-01",
        email: "hr@novafintech.vn",
        phone: "028 3822 1100",
        website: "https://novafintech.vn",
        industry: "Fintech",
        companySize: "201-500",
        companyType: "Product",
        foundedYear: 2016,
        status: "active",
        statusReason: null,
        creatorAccountId: "user_12345",
        activeJobsCount: 4,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        address: {
          street: "12 Ton Dan",
          district: "District 4",
          city: "Ho Chi Minh",
          country: "Vietnam",
          postal_code: "700000",
        },
        branches: [],
        benefits: ["13th-month salary", "Hybrid work"],
        techStack: ["React", "Go", "PostgreSQL"],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof entQueries.useEnterpriseDetailQuery>);

    renderWithClient(
      <MemoryRouter initialEntries={["/admin/enterprises/67900124c8097df77a6e0012"]}>
        <Routes>
          <Route path="/admin/enterprises/:enterpriseId" element={<AdminEnterpriseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Nova Fintech" })).toBeInTheDocument();
    expect(screen.getByText("Công ty Cổ phần Nova Fintech")).toBeInTheDocument();
    expect(screen.getByText("0312 345 678")).toBeInTheDocument();
    expect(screen.getAllByText("hr@novafintech.vn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("028 3822 1100")).toBeInTheDocument();
    expect(screen.getByText(/12 Ton Dan/i)).toBeInTheDocument();
    expect(screen.getByText("Suspend")).toBeInTheDocument();
  });

  it("renders Create Enterprise form with its system rail", () => {
    renderWithClient(
      <MemoryRouter initialEntries={["/admin/enterprises/new"]}>
        <Routes>
          <Route path="/admin/enterprises/new" element={<EnterpriseFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Create enterprise profile" })).toBeInTheDocument();
    expect(screen.queryByText("REQUIRED TO CREATE")).not.toBeInTheDocument();
    expect(screen.getByText("SET BY THE SYSTEM")).toBeInTheDocument();
    expect(screen.getByText(/I confirm the legal and tax vetting was completed offline/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("10–13 numeric digits")).toBeInTheDocument();
  });

  it("renders Edit Enterprise form with locked tax code", () => {
    vi.spyOn(entQueries, "useEnterpriseDetailQuery").mockReturnValue({
      data: {
        id: "67900124c8097df77a6e0012",
        name: "Nova Fintech",
        taxCode: "0312345678",
        email: "hr@novafintech.vn",
        phone: "028 3822 1100",
        industry: "Fintech",
        companySize: "201-500",
        status: "active",
        address: {
          street: "12 Ton Dan",
          city: "Ho Chi Minh",
          country: "Vietnam",
        },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof entQueries.useEnterpriseDetailQuery>);

    renderWithClient(
      <MemoryRouter initialEntries={["/admin/enterprises/67900124c8097df77a6e0012/edit"]}>
        <Routes>
          <Route path="/admin/enterprises/:enterpriseId/edit" element={<EnterpriseFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Edit enterprise profile" })).toBeInTheDocument();
    expect(screen.getByText("NOT EDITABLE HERE")).toBeInTheDocument();

    const taxInput = screen.getByDisplayValue("0312345678");
    expect(taxInput).toBeDisabled();
    expect(screen.getByText("Locked after creation · 10–13 digits")).toBeInTheDocument();
  });

  it("displays validation error banner and field errors on invalid submission", async () => {
    renderWithClient(
      <MemoryRouter initialEntries={["/admin/enterprises/new"]}>
        <Routes>
          <Route path="/admin/enterprises/new" element={<EnterpriseFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole("button", { name: /create enterprise/i });
    fireEvent.click(submitBtn);

    const errorMessages = await screen.findAllByText(/Please resolve the highlighted validation errors/i);
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Company name must be at least 2 characters/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Tax code must be 10 to 13 numeric digits/i)).toBeInTheDocument();
    expect(screen.getByText(/Street address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/You must confirm offline legal and tax vetting before creating/i)).toBeInTheDocument();
  });

  it("validates suspend dialog requires at least 10 characters and shows feedback", () => {
    const handleConfirm = vi.fn();
    renderWithClient(
      <SuspendEnterpriseDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        enterpriseName="Nova Fintech"
      />,
    );

    const textarea = screen.getByPlaceholderText(/Why is this enterprise suspended/i);
    const submitBtn = screen.getByRole("button", { name: /Suspend enterprise/i });

    // Initially empty -> button disabled
    expect(submitBtn).toBeDisabled();

    // Type short reason (< 10 chars)
    fireEvent.change(textarea, { target: { value: "Short" } });
    expect(screen.getByText(/Reason must be at least 10 characters \(5 more needed\)/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Type >= 10 chars
    fireEvent.change(textarea, { target: { value: "Valid suspension reason for testing" } });
    expect(screen.queryByText(/Reason must be at least 10 characters/i)).not.toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });
});
