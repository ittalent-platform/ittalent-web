import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Stepper } from "@/components/common/stepper";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { WIZARD_STEPS } from "@/features/enterprise-registration/enterprise-registration.constants";

export function WizardLayout({
  children,
  onExit,
}: {
  children: ReactNode;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const { currentStep, draft, isSaving } = useRegistrationWizard();

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-foreground">
      <header className="flex h-[68px] items-center justify-between border-b border-line-muted bg-card px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <BrandLogo />
          <div aria-hidden="true" className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">{t("enterpriseRegistration.shell.title")}</h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {isSaving ? <span className="animate-pulse text-muted-foreground">{t("enterpriseRegistration.shell.saving")}</span> : null}
          <Button onClick={onExit} size="sm" type="button" variant="ghost">
            {t("enterpriseRegistration.shell.saveExit")}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-[800px] flex-col gap-3">
          {draft?.registration_code ? (
            <p className="m-0 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">{draft.registration_code}</span>
              <span>v{draft.version}</span>
            </p>
          ) : null}
          <div className="surface-card px-5 pb-4">
            <Stepper
              ariaLabel={t("enterpriseRegistration.shell.progressAria")}
              currentIndex={WIZARD_STEPS.indexOf(currentStep)}
              steps={WIZARD_STEPS.map((step) => t(`enterpriseRegistration.steps.${step}`))}
            />
          </div>
        </div>
        <div className="w-full max-w-[800px]">{children}</div>
      </main>
    </div>
  );
}
