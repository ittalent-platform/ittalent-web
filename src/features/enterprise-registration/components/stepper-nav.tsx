import { Check } from "lucide-react";
import type { WizardStepKey } from "@/features/enterprise-registration/enterprise-registration.types";
import { cn } from "@/lib/utils";

interface StepItem {
  key: WizardStepKey;
  stepNumber: number;
  label: string;
}

const STEPS: StepItem[] = [
  { key: "step1", stepNumber: 1, label: "Company details" },
  { key: "step2", stepNumber: 2, label: "Representative" },
  { key: "step3", stepNumber: 3, label: "Documents" },
  { key: "step4", stepNumber: 4, label: "Review and submit" },
];

export function StepperNav({
  currentStep,
  caseCode,
  version = 1,
  onStepClick,
}: {
  currentStep: WizardStepKey;
  caseCode?: string | null;
  version?: number;
  onStepClick?: (step: WizardStepKey) => void;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full border-b border-line-muted bg-card px-6 py-4 lg:px-10">
      <div className="mx-auto flex max-w-[800px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Registration progress" className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isClickable = Boolean(onStepClick && idx <= currentIdx);

            return (
              <div key={step.key} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.key)}
                  className={cn(
                    "flex items-center gap-2 text-[13px] font-medium transition-colors",
                    isCurrent && "font-semibold text-primary",
                    isCompleted && "text-foreground hover:text-primary",
                    !isCurrent && !isCompleted && "text-muted-foreground cursor-not-allowed",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isCurrent && "bg-primary text-primary-foreground shadow-xs",
                      isCompleted && "bg-(--status-success-bg) text-(--status-success-fg)",
                      !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : step.stepNumber}
                  </span>
                  <span className="hidden md:inline">{step.label}</span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-[1px] w-4 sm:w-6",
                      idx < currentIdx ? "bg-(--status-success-fg)" : "bg-line-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {caseCode && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
              {caseCode}
            </span>
            <span>v{version}</span>
          </div>
        )}
      </div>
    </div>
  );
}
