import type { ReactNode } from "react";
import { Link } from "react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
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

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="flex h-[68px] items-center justify-between border-b border-line-muted bg-card px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="ITTalent home" className="flex items-center">
            <BrandLogo />
          </Link>
          <div aria-hidden="true" className="h-4 w-[1px] bg-border" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Register your company
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {isSaving && (
            <span className="text-muted-foreground animate-pulse">Saving draft...</span>
          )}
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="font-medium text-primary hover:underline"
            >
              Save draft & exit
            </button>
          ) : (
            <Link
              to="/"
              className="font-medium text-primary hover:underline"
            >
              Save draft & exit
            </Link>
          )}
        </div>
      </header>

      <StepperNav
        currentStep={currentStep}
        caseCode={draft?.registration_code}
        version={draft?.version}
        onStepClick={setCurrentStep}
      />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">{children}</div>
      </main>
    </div>
  );
}
