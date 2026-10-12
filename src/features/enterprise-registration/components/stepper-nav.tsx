import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { WIZARD_STEPS } from "@/features/enterprise-registration/enterprise-registration.constants";
import type { WizardStepKey } from "@/features/enterprise-registration/enterprise-registration.types";
import { cn } from "@/lib/utils";

/** Inline progress of the wizard (Registration design): done steps go green, the current one is Ember. */
export function StepperNav({ currentStep, onStepClick }: { currentStep: WizardStepKey; onStepClick?: (step: WizardStepKey) => void }) {
  const { t } = useTranslation();
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);

  return (
    <nav aria-label={t("enterpriseRegistration.shell.progressAria")} className="flex items-center gap-2 pt-2 sm:gap-4">
      {WIZARD_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isClickable = Boolean(onStepClick) && isCompleted;

        return (
          <div className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3" key={step}>
            <button
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2.5 text-[13.5px] transition-colors",
                isCurrent && "font-bold text-foreground",
                isCompleted && "font-medium text-foreground",
                !isCurrent && !isCompleted && "font-normal text-muted-foreground",
                isClickable ? "cursor-pointer hover:text-primary" : "cursor-default",
              )}
              disabled={!isClickable}
              onClick={() => onStepClick?.(step)}
              type="button"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && "bg-(--status-success-fg) text-white",
                  !isCurrent && !isCompleted && "border border-border bg-card text-muted-foreground",
                )}
              >
                {isCompleted ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : idx + 1}
              </span>
              <span className="hidden sm:inline">{t(`enterpriseRegistration.steps.${step}`)}</span>
            </button>

            {idx < WIZARD_STEPS.length - 1 ? (
              <div aria-hidden="true" className={cn("h-0.5 min-w-4 flex-1 transition-colors", isCompleted ? "bg-(--status-success-fg)" : "bg-border")} />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
