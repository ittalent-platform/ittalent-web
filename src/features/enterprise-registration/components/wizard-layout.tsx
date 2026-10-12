import type { ReactNode } from "react";
import { WizardHeader } from "./wizard-header";
import { StepperNav } from "./stepper-nav";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

export function WizardLayout({
  children,
  onExit,
}: {
  children: ReactNode;
  onExit?: () => void;
}) {
  const { currentStep, draft, setCurrentStep, isSaving } = useRegistrationWizard();

  const representativeName = draft?.representative?.full_name || "Đỗ Minh Châu";
  const corporateEmail = draft?.corporate_email || "chau.do@lumenlogistics.vn";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <WizardHeader
        representativeName={representativeName}
        corporateEmail={corporateEmail}
        isSaving={isSaving}
        onExit={onExit}
      />

      {/* Main wizard body */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[860px]">
          <StepperNav
            currentStep={currentStep}
            draft={draft}
            onStepClick={setCurrentStep}
          />
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
