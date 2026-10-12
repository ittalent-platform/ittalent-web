import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  postApiV1EnterpriseRegistrationsStart,
  patchApiV1EnterpriseRegistrationsByIdDraft,
  postApiV1EnterpriseRegistrationsByIdSubmit,
} from "@/api/generated";
import { StartRegistrationForm } from "@/features/enterprise-registration/components/start-registration-form";
import { RegistrationCheckEmail } from "@/features/enterprise-registration/components/registration-check-email";
import { Step1CompanyForm } from "@/features/enterprise-registration/components/step1-company-form";
import { Step2RepresentativeForm } from "@/features/enterprise-registration/components/step2-representative-form";
import { Step3DocumentsForm } from "@/features/enterprise-registration/components/step3-documents-form";
import { Step4ReviewForm } from "@/features/enterprise-registration/components/step4-review-form";
import { RegistrationSubmittedReceipt } from "@/features/enterprise-registration/components/registration-submitted-receipt";
import { RegistrationWizardProvider } from "@/features/enterprise-registration/context/registration-wizard-context";
import type { EnterpriseRegistrationDetail } from "@/features/enterprise-registration";

vi.mock("@/api/generated", () => ({
  postApiV1EnterpriseRegistrationsStart: vi.fn(),
  patchApiV1EnterpriseRegistrationsByIdDraft: vi.fn(),
  postApiV1EnterpriseRegistrationsByIdDocuments: vi.fn(),
  postApiV1EnterpriseRegistrationsByIdSubmit: vi.fn(),
  getApiV1EnterpriseRegistrationsById: vi.fn(),
  getApiV1EnterpriseRegistrationsVerifyEmail: vi.fn(),
}));

const mockedStart = vi.mocked(postApiV1EnterpriseRegistrationsStart);
const mockedSaveDraft = vi.mocked(patchApiV1EnterpriseRegistrationsByIdDraft);
const mockedSubmit = vi.mocked(postApiV1EnterpriseRegistrationsByIdSubmit);

function renderWithClient(ui: ReactElement): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
  return queryClient;
}

describe("Employer Registration Flow Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("StartRegistrationForm", () => {
    it("renders required contact fields and rejects personal email domains per BR-39", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onContinueLater = vi.fn();

      renderWithClient(
        <StartRegistrationForm
          onSuccess={onSuccess}
          onContinueLaterClick={onContinueLater}
        />,
      );

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();

      // Enter a personal email
      await user.type(screen.getByLabelText(/full name/i), "Hoàng Nam");
      await user.type(screen.getByLabelText(/work email/i), "test@gmail.com");

      await user.click(screen.getByRole("button", { name: /send confirmation link/i }));

      // Error message for personal email
      await waitFor(() => {
        expect(
          screen.getByText(/use your company domain, not a personal email/i),
        ).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("submits valid corporate email and triggers onSuccess", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onContinueLater = vi.fn();

      mockedStart.mockResolvedValueOnce({
        data: {
          message: "Verification email sent",
          registration_id: "reg-123",
          corporate_email: "hr@corp.vn",
          expires_at: new Date().toISOString(),
        },
        error: undefined,
        response: new Response(),
      });

      renderWithClient(
        <StartRegistrationForm
          onSuccess={onSuccess}
          onContinueLaterClick={onContinueLater}
        />,
      );

      await user.type(screen.getByLabelText(/full name/i), "Hoàng Nam");
      await user.type(screen.getByLabelText(/work email/i), "hr@corp.vn");

      await user.click(screen.getByRole("button", { name: /send confirmation link/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith("hr@corp.vn");
      });
    });
  });

  describe("RegistrationCheckEmail", () => {
    it("displays instructions and triggers change email callback", async () => {
      const user = userEvent.setup();
      const onResend = vi.fn().mockResolvedValue(undefined);
      const onChangeEmail = vi.fn();

      render(
        <RegistrationCheckEmail
          email="hr@corp.vn"
          onResend={onResend}
          onChangeEmail={onChangeEmail}
        />,
      );

      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText("hr@corp.vn")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /change email/i }),
      );
      expect(onChangeEmail).toHaveBeenCalled();
    });
  });

  describe("Step1CompanyForm", () => {
    const mockDraft: EnterpriseRegistrationDetail = {
      _id: "reg-123",
      registration_code: "REG-20261012-ABC12",
      corporate_email: "hr@corp.vn",
      version: 1,
      status: "draft",
      representative: {
        full_name: "Hoàng Nam",
        phone: "0912345678",
      },
      company_data: {},
    };

    it("renders company form and saves draft on submit", async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      mockedSaveDraft.mockResolvedValueOnce({
        data: {
          ...mockDraft,
          version: 2,
        },
        error: undefined,
        response: new Response(),
      });

      renderWithClient(
        <RegistrationWizardProvider
          initialRegistrationId="reg-123"
          initialDraft={mockDraft}
        >
          <Step1CompanyForm onNext={onNext} />
        </RegistrationWizardProvider>,
      );

      expect(screen.getByLabelText(/company display \/ trading name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax identification number/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/company display \/ trading name/i), "Acme Corp");
      await user.type(screen.getByLabelText(/tax identification number/i), "0303886515");
      await user.type(screen.getByLabelText(/street address/i), "123 Main St");
      await user.type(screen.getByLabelText(/province \/ city/i), "Ho Chi Minh City");

      // Select industry
      await user.click(screen.getByRole("combobox", { name: /primary industry/i }));
      await user.click(screen.getByRole("option", { name: /software & it services/i }));

      await user.click(screen.getByRole("button", { name: /save & continue/i }));

      await waitFor(() => {
        expect(mockedSaveDraft).toHaveBeenCalled();
        expect(onNext).toHaveBeenCalled();
      });
    });
  });

  describe("Step2RepresentativeForm", () => {
    const mockDraft: EnterpriseRegistrationDetail = {
      _id: "reg-123",
      registration_code: "REG-20261012-ABC12",
      corporate_email: "hr@corp.vn",
      version: 2,
      status: "draft",
      representative: {
        full_name: "Hoàng Nam",
        phone: "0912345678",
      },
    };

    it("toggles legal representative notice when unchecked", async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      const onBack = vi.fn();

      renderWithClient(
        <RegistrationWizardProvider
          initialRegistrationId="reg-123"
          initialDraft={mockDraft}
        >
          <Step2RepresentativeForm onNext={onNext} onBack={onBack} />
        </RegistrationWizardProvider>,
      );

      const checkbox = screen.getByRole("checkbox", {
        name: /i am the legal representative/i,
      });
      expect(checkbox).toBeChecked();

      // Uncheck it
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();

      // Authorization notice shows up
      expect(
        screen.getByText(/authorization requirement:/i),
      ).toBeInTheDocument();
    });
  });

  describe("Step3DocumentsForm", () => {
    it("blocks proceeding when Business Registration Certificate is missing", async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      const onBack = vi.fn();

      const mockDraftWithoutDocs: EnterpriseRegistrationDetail = {
        _id: "reg-123",
        registration_code: "REG-20261012-ABC12",
        corporate_email: "hr@corp.vn",
        version: 2,
        status: "draft",
        representative: { full_name: "Hoàng Nam", phone: "0912345678" },
        legal_documents: [],
      };

      renderWithClient(
        <RegistrationWizardProvider
          initialRegistrationId="reg-123"
          initialDraft={mockDraftWithoutDocs}
        >
          <Step3DocumentsForm onNext={onNext} onBack={onBack} />
        </RegistrationWizardProvider>,
      );

      await user.click(screen.getByRole("button", { name: /review & submit/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/business registration certificate \(pdf\) is required for submission/i),
        ).toBeInTheDocument();
      });
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe("Step4ReviewForm and SubmissionReceipt", () => {
    const mockDraftWithDocs: EnterpriseRegistrationDetail = {
      _id: "reg-123",
      registration_code: "REG-20261012-ABC12",
      corporate_email: "hr@corp.vn",
      version: 2,
      status: "draft",
      representative: { full_name: "Hoàng Nam", phone: "0912345678", position: "HR Lead" },
      company_data: {
        name: "Acme Corp",
        legal_name: "Acme Vietnam JSC",
        tax_code: "0303886515",
        industry: "Software & IT Services",
        company_size: "11-50",
        address: { street: "123 Main St", city: "Ho Chi Minh City", country: "Vietnam" },
      },
      legal_documents: [
        {
          document_type: "business_license",
          file_name: "business_license.pdf",
          file_url: "https://example.com/docs/license.pdf",
          file_size: 1024 * 1024,
        },
      ],
    };

    it("requires terms agreement before submission", async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      const onSubmitSuccess = vi.fn();

      renderWithClient(
        <RegistrationWizardProvider
          initialRegistrationId="reg-123"
          initialDraft={mockDraftWithDocs}
        >
          <Step4ReviewForm onBack={onBack} onSubmitSuccess={onSubmitSuccess} />
        </RegistrationWizardProvider>,
      );

      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("0303886515")).toBeInTheDocument();
      expect(screen.getByText("business_license.pdf")).toBeInTheDocument();

      // Click submit without checking agreement checkbox
      await user.click(screen.getByRole("button", { name: /submit registration/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/you must certify authorization and agree to terms/i),
        ).toBeInTheDocument();
      });
      expect(onSubmitSuccess).not.toHaveBeenCalled();

      // Check agreement and submit
      mockedSubmit.mockResolvedValueOnce({
        data: {
          registration_code: "REG-20261012-ABC12",
          status: "pending_review",
          version: 3,
          submitted_at: new Date().toISOString(),
          estimated_sla_days: 2,
        },
        error: undefined,
        response: new Response(),
      });

      await user.click(screen.getByRole("checkbox", { name: /i certify that all provided information/i }));
      await user.click(screen.getByRole("button", { name: /submit registration/i }));

      await waitFor(() => {
        expect(mockedSubmit).toHaveBeenCalled();
        expect(onSubmitSuccess).toHaveBeenCalled();
      });
    });

    it("renders receipt after submission", () => {
      render(
        <MemoryRouter>
          <RegistrationSubmittedReceipt
            receipt={{
              registration_code: "REG-20261012-ABC12",
              status: "pending_review",
              version: 3,
              submitted_at: "2026-10-12T10:00:00Z",
              estimated_sla_days: 2,
            }}
          />
        </MemoryRouter>,
      );

      expect(screen.getByText(/registration case submitted/i)).toBeInTheDocument();
      expect(screen.getByText("REG-20261012-ABC12")).toBeInTheDocument();
      expect(screen.getByText(/intake status:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/under review/i).length).toBeGreaterThan(0);
      expect(screen.getByRole("link", { name: /return to homepage/i })).toHaveAttribute("href", "/");
    });
  });
});
