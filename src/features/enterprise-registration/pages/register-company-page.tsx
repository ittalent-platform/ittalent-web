import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import { LoadingScreen } from "@/components/common/loading-screen";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { AuthCardPage, AuthStatusCard } from "@/features/auth/auth-status-card";
import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
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
import type { StartRegistrationFormData } from "@/features/enterprise-registration/enterprise-registration.schemas";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";

type View = "start" | "check-email" | "resume-draft" | "wizard";

export function RegisterCompanyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const resumeId = searchParams.get("id") || "";

  const [view, setView] = useState<View>("start");
  const [contact, setContact] = useState<StartRegistrationFormData | null>(null);
  const [submissionReceipt, setSubmissionReceipt] = useState<SubmissionReceiptResponse | null>(null);

  const verifyEmailQuery = useVerifyRegistrationEmailQuery(token, {
    enabled: Boolean(token),
  });

  const resolvedRegistrationId =
    (token ? verifyEmailQuery.data?.registration_id : null) || resumeId || null;

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
      <AuthCardPage tone="employer">
        <AuthStatusCard>
          <StatusPanel
            actions={
              <Button className={AUTH_ACTION_CLASS} onClick={() => navigate("/register-company", { replace: true })} shape="xl" type="button">
                {t("enterpriseRegistration.verify.restart")}
              </Button>
            }
            description={t("enterpriseRegistration.verify.invalid")}
            icon={TriangleAlert}
            title={t("enterpriseRegistration.shell.title")}
            tone="danger"
          />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  if (submissionReceipt) {
    return (
      <AuthCardPage tone="employer">
        <RegistrationSubmittedReceipt receipt={submissionReceipt} />
      </AuthCardPage>
    );
  }

  if (!isWizardActive) {
    if (view === "check-email" && contact) {
      return (
        <AuthCardPage tone="employer">
          <RegistrationCheckEmail
            email={contact.corporate_email}
            onChangeEmail={() => setView("start")}
            onResend={async () => {
              await startMutation.mutateAsync({
                corporate_email: contact.corporate_email,
                representative_name: contact.representative_name,
                representative_phone: contact.representative_phone,
                representative_position: contact.representative_position || undefined,
              });
            }}
          />
        </AuthCardPage>
      );
    }

    if (view === "resume-draft") {
      return (
        <AuthCardPage tone="employer">
          <ResumeDraftForm onBack={() => setView("start")} />
        </AuthCardPage>
      );
    }

    return (
      <AuthCardPage tone="employer">
        <StartRegistrationForm
          onContinueLaterClick={() => setView("resume-draft")}
          onSuccess={(values) => {
            setContact(values);
            setView("check-email");
          }}
        />
      </AuthCardPage>
    );
  }

  return (
    <RegistrationWizardProvider
      initialDraft={detailQuery.data || null}
      initialRegistrationId={resolvedRegistrationId}
    >
      <WizardInner
        onComplete={(receipt) => setSubmissionReceipt(receipt)}
        onExitToHome={() => navigate("/")}
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
