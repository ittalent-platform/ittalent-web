import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { WIZARD_STEPS } from "@/features/enterprise-registration/enterprise-registration.constants";
import type { WizardStepKey } from "@/features/enterprise-registration/enterprise-registration.types";
import { cn } from "@/lib/utils";

/** Inline progress of the wizard (Registration design): done steps go green, the current one is Ember. */
export function StepperNav({
  currentStep,
  onStepClick,
}: {
  currentStep: WizardStepKey;
  onStepClick?: (step: WizardStepKey) => void;
}) {
  const { t } = useTranslation();
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);

  return (
    <nav aria-label={t("enterpriseRegistration.shell.progressAria")} className="flex items-center gap-2 sm:gap-3">
      {WIZARD_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isClickable = Boolean(onStepClick) && isCompleted;

        return (
          <div className="flex items-center gap-2 sm:gap-3" key={step}>
            <button
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-[13px] font-medium transition-colors",
                isCurrent && "font-bold text-foreground",
                isCompleted && "text-foreground",
                !isCurrent && !isCompleted && "text-muted-foreground",
                isClickable ? "cursor-pointer" : "cursor-default",
              )}
              disabled={!isClickable}
              onClick={() => onStepClick?.(step)}
              type="button"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && "bg-(--status-success-fg) text-white",
                  !isCurrent && !isCompleted && "border border-border bg-card text-muted-foreground",
                )}
              >
                {isCompleted ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : idx + 1}
              </span>
              <span className="hidden md:inline">{t(`enterpriseRegistration.steps.${step}`)}</span>
            </button>

            {idx < WIZARD_STEPS.length - 1 ? (
              <span aria-hidden className={cn("h-0.5 w-4 rounded-full sm:w-10", isCompleted ? "bg-(--status-success-fg)" : "bg-border")} />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
