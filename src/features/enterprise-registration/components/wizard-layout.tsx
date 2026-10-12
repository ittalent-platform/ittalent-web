import type { ReactNode } from "react";

import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

import { StepperNav } from "./stepper-nav";
import { WizardHeader } from "./wizard-header";
import { WizardTitle } from "./wizard-title";

export function WizardLayout({ children, onExit }: { children: ReactNode; onExit?: () => void }) {
  const { currentStep, draft, setCurrentStep, isSaving } = useRegistrationWizard();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <WizardHeader corporateEmail={draft?.corporate_email} isSaving={isSaving} onExit={onExit} representativeName={draft?.representative?.full_name} />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[860px] flex-col gap-5">
          <WizardTitle currentStep={currentStep} draft={draft} />
          <StepperNav currentStep={currentStep} onStepClick={setCurrentStep} />
          <div className="mt-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
