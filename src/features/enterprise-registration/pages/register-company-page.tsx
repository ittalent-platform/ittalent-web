import { useState } from "react";
import { useSearchParams } from "react-router";
import { LoadingScreen } from "@/components/common/loading-screen";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { WizardLayout } from "@/features/enterprise-registration/components/wizard-layout";
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
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";

export function RegisterCompanyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const resumeId = searchParams.get("id") || "";

  const [view, setView] = useState<"start" | "check-email" | "resume-draft" | "wizard">("start");
  const [contactEmail, setContactEmail] = useState("");
  const [submissionReceipt, setSubmissionReceipt] = useState<SubmissionReceiptResponse | null>(null);

  const verifyEmailQuery = useVerifyRegistrationEmailQuery(token, {
    enabled: Boolean(token),
  });

  const resolvedRegistrationId =
    (token ? verifyEmailQuery.data?.registration_id : null) ||
    (resumeId || null);

  const detailQuery = useEnterpriseRegistrationDetailQuery(
    resolvedRegistrationId || "",
    { enabled: Boolean(resolvedRegistrationId) },
  );

  const startMutation = useStartRegistrationMutation();

  const isWizardActive =
    (Boolean(token) && Boolean(verifyEmailQuery.data)) ||
    (Boolean(resumeId) && Boolean(detailQuery.data)) ||
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
        <RegistrationSubmittedReceipt receipt={submissionReceipt} />
      </div>
    );
  }

  if (!isWizardActive) {
    if (view === "start") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
          <StartRegistrationForm
            onSuccess={(email) => {
              setContactEmail(email);
              setView("check-email");
            }}
            onContinueLaterClick={() => setView("resume-draft")}
          />
        </div>
      );
    }

    if (view === "check-email") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
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
        </div>
      );
    }

    if (view === "resume-draft") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
          <ResumeDraftForm onBack={() => setView("start")} />
        </div>
      );
    }
  }

  return (
    <RegistrationWizardProvider
      initialRegistrationId={resolvedRegistrationId}
      initialDraft={detailQuery.data || null}
      initialStep="step1"
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
