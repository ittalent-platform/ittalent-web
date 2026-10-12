import type { ReactNode } from "react";
import { Link } from "react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
import { StepperNav } from "./stepper-nav";
import { useRegistrationWizard } from "../context/registration-wizard-context";

export function WizardLayout({
  children,
  onExit,
}: {
  children: ReactNode;
  onExit?: () => void;
}) {
  const { currentStep, draft, setCurrentStep, isSaving } = useRegistrationWizard();

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf8] font-sans text-[#19191c]">
      <header className="flex h-[68px] items-center justify-between border-b border-[#efede8] bg-[#ffffff] px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="ITTalent home" className="flex items-center">
            <BrandLogo />
          </Link>
          <div aria-hidden="true" className="h-4 w-[1px] bg-[#e6e4df]" />
          <h1 className="text-sm font-semibold tracking-tight text-[#19191c]">
            Register your company
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {isSaving && (
            <span className="text-[#64646b] animate-pulse">Saving draft...</span>
          )}
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="font-medium text-[#b33305] hover:text-[#8f2904]"
            >
              Save draft & exit
            </button>
          ) : (
            <Link
              to="/"
              className="font-medium text-[#b33305] hover:text-[#8f2904]"
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
