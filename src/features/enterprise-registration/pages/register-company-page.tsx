import { useState } from "react";
import { useSearchParams } from "react-router";
import { LoadingScreen } from "@/components/common/loading-screen";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { WizardLayout } from "@/features/enterprise-registration/components/wizard-layout";
import { IntakeSplitLayout } from "@/features/enterprise-registration/components/intake-split-layout";
import { StartRegistrationForm } from "@/features/enterprise-registration/components/start-registration-form";
import { RegistrationCheckEmail } from "@/features/enterprise-registration/components/registration-check-email";
import { ResumeDraftForm } from "@/features/enterprise-registration/components/resume-draft-form";
import { Step1CompanyForm } from "@/features/enterprise-registration/components/step1-company-form";
import { Step2RepresentativeForm } from "@/features/enterprise-registration/components/step2-representative-form";
import { Step3DocumentsForm } from "@/features/enterprise-registration/components/step3-documents-form";
import { Step4ReviewForm } from "@/features/enterprise-registration/components/step4-review-form";
import { RegistrationSubmittedReceipt } from "@/features/enterprise-registration/components/registration-submitted-receipt";
import {
  RegistrationWizardProvider,
  useRegistrationWizard,
} from "@/features/enterprise-registration/context/registration-wizard-context";
import {
  useVerifyRegistrationEmailQuery,
  useEnterpriseRegistrationDetailQuery,
  useStartRegistrationMutation,
} from "@/features/enterprise-registration/enterprise-registration.queries";
import type {
  EnterpriseRegistrationDetail,
  SubmissionReceiptResponse,
  WizardStepKey,
} from "@/features/enterprise-registration/enterprise-registration.types";

const MOCK_PREVIEW_DRAFT: EnterpriseRegistrationDetail = {
  registration_code: "REG-2026-0491",
  version: 1,
  corporate_email: "recruitment@acme-robotics.io",
  status: "draft",
  representative: {
    full_name: "Nguyen Van An",
    phone: "0912345678",
    position: "Chief Executive Officer",
  },
  company_data: {
    name: "Acme Robotics Vietnam",
    legal_name: "Acme Robotics Vietnam Joint Stock Company",
    tax_code: "0108923412",
    registration_number: "0108923412",
    website: "https://acmerobotics.io",
    industry: "Software & IT Services",
    company_size: "51-200",
    description: "Leading enterprise robotics and AI automation software platform in Southeast Asia.",
    address: {
      street: "Floor 14, Keangnam Landmark 72, Pham Hung",
      city: "Hanoi",
      district: "Nam Tu Liem",
      country: "Vietnam",
      postal_code: "100000",
    },
  },
  legal_documents: [
    {
      document_type: "business_license",
      file_name: "enterprise_registration_certificate_acme.pdf",
      file_url: "https://s3.amazonaws.com/ittalent/acme_license.pdf",
      file_size: 2450000,
      uploaded_at: "2026-10-12T08:30:00Z",
    },
    {
      document_type: "tax_registration",
      file_name: "tax_registration_certificate_2026.pdf",
      file_url: "https://s3.amazonaws.com/ittalent/acme_tax.pdf",
      file_size: 1120000,
      uploaded_at: "2026-10-12T08:31:00Z",
    },
  ],
};

const MOCK_SUBMISSION_RECEIPT: SubmissionReceiptResponse = {
  registration_code: "REG-0042",
  status: "pending_review",
  version: 3,
  submitted_at: "2026-10-06T09:15:00Z",
  estimated_sla_days: 2,
};

export function RegisterCompanyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const resumeId = searchParams.get("id") || "";
  const previewParam =
    searchParams.get("preview") ||
    searchParams.get("step") ||
    searchParams.get("view") ||
    "";

  const isPreviewReceipt =
    previewParam === "receipt" ||
    previewParam === "status" ||
    previewParam === "status-pending" ||
    previewParam === "pending";
  const isPreviewWizard =
    previewParam === "step1" ||
    previewParam === "step2" ||
    previewParam === "step3" ||
    previewParam === "step4";

  const [view, setView] = useState<"start" | "check-email" | "resume-draft" | "wizard">(
    previewParam === "check-email"
      ? "check-email"
      : previewParam === "resume-draft"
        ? "resume-draft"
        : isPreviewWizard
          ? "wizard"
          : "start",
  );
  const [contactEmail, setContactEmail] = useState(
    previewParam === "check-email" ? "recruitment@acme-robotics.io" : "",
  );
  const [submissionReceipt, setSubmissionReceipt] = useState<SubmissionReceiptResponse | null>(
    isPreviewReceipt ? MOCK_SUBMISSION_RECEIPT : null,
  );

  const verifyEmailQuery = useVerifyRegistrationEmailQuery(token, {
    enabled: Boolean(token),
  });

  const resolvedRegistrationId =
    (token ? verifyEmailQuery.data?.registration_id : null) ||
    (resumeId || (isPreviewWizard ? "preview-reg-id" : null));

  const detailQuery = useEnterpriseRegistrationDetailQuery(
    resolvedRegistrationId || "",
    { enabled: Boolean(resolvedRegistrationId) && !isPreviewWizard },
  );

  const startMutation = useStartRegistrationMutation();

  const isWizardActive =
    (Boolean(token) && Boolean(verifyEmailQuery.data)) ||
    (Boolean(resumeId) && Boolean(detailQuery.data)) ||
    isPreviewWizard ||
    view === "wizard";

  if (token && verifyEmailQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (token && verifyEmailQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
          <div className="mb-4">
            <InlineBanner tone="error">
              Verification link has expired or is invalid. Please start registration again.
            </InlineBanner>
          </div>
          <Button
            type="button"
            onClick={() => {
              window.location.href = "/register-company";
            }}
            className="w-full"
          >
            Start New Registration
          </Button>
        </div>
      </div>
    );
  }

  if (submissionReceipt) {
    return (
      <RegistrationSubmittedReceipt
        receipt={submissionReceipt}
        draft={detailQuery.data || (isPreviewReceipt ? MOCK_PREVIEW_DRAFT : null)}
      />
    );
  }

  if (!isWizardActive) {
    if (view === "start") {
      return (
        <IntakeSplitLayout>
          <StartRegistrationForm
            onSuccess={(email) => {
              setContactEmail(email);
              setView("check-email");
            }}
            onContinueLaterClick={() => setView("resume-draft")}
          />
        </IntakeSplitLayout>
      );
    }

    if (view === "check-email") {
      return (
        <IntakeSplitLayout>
          <RegistrationCheckEmail
            email={contactEmail}
            onResend={async () => {
              if (!contactEmail) return;
              await startMutation.mutateAsync({
                corporate_email: contactEmail,
                representative_name: "Representative",
                representative_phone: "0900000000",
              });
            }}
            onChangeEmail={() => setView("start")}
          />
        </IntakeSplitLayout>
      );
    }

    if (view === "resume-draft") {
      return (
        <IntakeSplitLayout>
          <ResumeDraftForm onBack={() => setView("start")} />
        </IntakeSplitLayout>
      );
    }
  }

  return (
    <RegistrationWizardProvider
      initialRegistrationId={resolvedRegistrationId}
      initialDraft={detailQuery.data || (isPreviewWizard ? MOCK_PREVIEW_DRAFT : null)}
      initialStep={isPreviewWizard ? (previewParam as WizardStepKey) : "step1"}
    >
      <WizardInner
        onComplete={(receipt) => setSubmissionReceipt(receipt)}
        onExitToHome={() => {
          window.location.href = "/";
        }}
      />
    </RegistrationWizardProvider>
  );
}

function WizardInner({
  onComplete,
  onExitToHome,
}: {
  onComplete: (receipt: SubmissionReceiptResponse) => void;
  onExitToHome: () => void;
}) {
  const { currentStep, setCurrentStep } = useRegistrationWizard();

  return (
    <WizardLayout onExit={onExitToHome}>
      {currentStep === "step1" && (
        <Step1CompanyForm onNext={() => setCurrentStep("step2")} />
      )}
      {currentStep === "step2" && (
        <Step2RepresentativeForm
          onNext={() => setCurrentStep("step3")}
          onBack={() => setCurrentStep("step1")}
        />
      )}
      {currentStep === "step3" && (
        <Step3DocumentsForm
          onNext={() => setCurrentStep("step4")}
          onBack={() => setCurrentStep("step2")}
        />
      )}
      {currentStep === "step4" && (
        <Step4ReviewForm
          onBack={() => setCurrentStep("step3")}
          onSubmitSuccess={onComplete}
        />
      )}
    </WizardLayout>
  );
}
