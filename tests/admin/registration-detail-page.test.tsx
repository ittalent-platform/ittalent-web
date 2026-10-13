import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RegistrationDetailPage } from "@/features/admin/registrations/registration-detail-page";
import * as regQueries from "@/features/enterprise-registration/enterprise-registration.queries";
import { ToastProvider } from "@/components/toast/toast-provider";
import type { EnterpriseRegistrationDetail } from "@/features/enterprise-registration/enterprise-registration.types";

function renderWithClient(ui: React.ReactElement, initialPath = "/admin/registrations/reg-1") {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/admin/registrations/:registrationId" element={ui} />
            <Route path="/admin/registrations" element={<div>Queue</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const mockDetailItem: EnterpriseRegistrationDetail = {
  id: "reg-1",
  registration_code: "REG-20261002-001A",
  corporate_email: "hoang.nam@blueorbit.vn",
  status: "pending_review",
  version: 1,
  createdAt: "2026-10-02T16:20:00Z",
  updatedAt: "2026-10-02T16:20:00Z",
  claim_locks: {
    tax_code: "0108889990",
    corporate_email: "hoang.nam@blueorbit.vn",
    locked_at: new Date("2026-10-02T16:20:00Z"),
  },
  company_data: {
    name: "BlueOrbit Studio",
    legal_name: "BlueOrbit Technology Studio JSC",
    tax_code: "0108889990",
    industry: "Software & IT services",
    company_size: "11-50",
    founded_year: 2021,
    address: { street: "123 Le Loi, D1", city: "Ho Chi Minh City", country: "Vietnam" },
    website: "https://blueorbit.vn",
  },
  representative: {
    full_name: "Hoàng Nam",
    phone: "+84901234567",
    position: "Managing Director",
  },
  legal_documents: [
    {
      document_type: "business_license",
      file_name: "business_registration_cert.pdf",
      file_url: "https://storage.example.com/docs/cert.pdf",
      uploaded_at: "2026-10-02T16:15:00Z",
    },
  ],
};

describe("Admin Registration Case Detail Feature Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders dossier details with company, representative, and document evidence", () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationDetailQuery").mockReturnValue({
      data: mockDetailItem,
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(regQueries, "useAdminRegistrationDecisionMutation").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);

    renderWithClient(<RegistrationDetailPage />);

    expect(screen.getByText("BlueOrbit Technology Studio JSC")).toBeInTheDocument();
    expect(screen.getByText("0108889990")).toBeInTheDocument();
    expect(screen.getByText("Hoàng Nam")).toBeInTheDocument();
    expect(screen.getAllByText("hoang.nam@blueorbit.vn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("business_registration_cert.pdf")).toBeInTheDocument();
    expect(screen.getByText("REG-20261002-001A")).toBeInTheDocument();
  });

  it("gates approval until checklist items and evidence note are completed", async () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationDetailQuery").mockReturnValue({
      data: mockDetailItem,
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({});
    vi.spyOn(regQueries, "useAdminRegistrationDecisionMutation").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(<RegistrationDetailPage />);

    const approveButtons = screen.getAllByRole("button", { name: /approve registration/i });
    expect(approveButtons[0]).toBeDisabled();

    // Check all 3 verification checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    // Still disabled without evidence summary note
    expect(approveButtons[0]).toBeDisabled();

    // Fill evidence note
    const textarea = screen.getByPlaceholderText(/checked tax code and registration certificate/i);
    fireEvent.change(textarea, {
      target: { value: "Verified against national registry portal. Everything authentic." },
    });

    // Now enabled!
    expect(approveButtons[0]).toBeEnabled();

    // Open confirmation modal
    fireEvent.click(approveButtons[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/this happens once and can't be undone/i)).toBeInTheDocument();

    // Confirm decision
    const confirmBtn = screen.getByRole("button", { name: /approve and send invitation/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: "reg-1",
        body: {
          decision: "approved",
          version: 1,
          checklist: {
            tax_code_verified: true,
            legal_representative_verified: true,
            documents_verified: true,
          },
        },
      });
    });
  });

  it("allows rejecting with reason and explanation message", async () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationDetailQuery").mockReturnValue({
      data: mockDetailItem,
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({});
    vi.spyOn(regQueries, "useAdminRegistrationDecisionMutation").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(<RegistrationDetailPage />);

    const rejectButtons = screen.getAllByRole("button", { name: /reject\.\.\./i });
    fireEvent.click(rejectButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/the requester is told why/i)).toBeInTheDocument();

    // Confirm rejection
    const confirmRejectBtn = screen.getByRole("button", { name: /reject registration/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "reg-1",
          body: expect.objectContaining({
            decision: "rejected",
            version: 1,
          }),
        }),
      );
    });
  });

  it("renders approved outcome banner when case is already approved", () => {
    vi.spyOn(regQueries, "useEnterpriseRegistrationDetailQuery").mockReturnValue({
      data: {
        ...mockDetailItem,
        status: "approved",
        created_enterprise_id: "ent-123",
      },
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(regQueries, "useAdminRegistrationDecisionMutation").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);

    renderWithClient(<RegistrationDetailPage />);

    expect(screen.getByText(/is active/i)).toBeInTheDocument();
    expect(screen.getByText(/open company/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve registration/i })).not.toBeInTheDocument();
  });
});
