import { Check } from "lucide-react";
import type {
  EnterpriseRegistrationDetail,
  WizardStepKey,
} from "@/features/enterprise-registration/enterprise-registration.types";
import { cn } from "@/lib/utils";

interface StepItem {
  key: WizardStepKey;
  stepNumber: number;
  label: string;
}

const STEPS: StepItem[] = [
  { key: "step1", stepNumber: 1, label: "Company" },
  { key: "step2", stepNumber: 2, label: "Representative" },
  { key: "step3", stepNumber: 3, label: "Documents" },
  { key: "step4", stepNumber: 4, label: "Review and submit" },
];

export function StepperNav({
  currentStep,
  draft,
  onStepClick,
}: {
  currentStep: WizardStepKey;
  draft?: EnterpriseRegistrationDetail | null;
  onStepClick?: (step: WizardStepKey) => void;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  const rawCompany = (draft?.company_data || {}) as Record<string, unknown>;
  const companyName =
    (rawCompany.name as string) ||
    (rawCompany.legal_name as string) ||
    "Lumen Logistics JSC";
  const verifiedEmail =
    draft?.corporate_email || "chau.do@lumenlogistics.vn";

  return (
    <div className="flex flex-col gap-5">
      {/* Dynamic Page Header & Status Badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Register {companyName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft · saved 2 minutes ago
          </p>
        </div>
        <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          Draft
        </span>
      </div>

      {/* Step 1 Work Email Confirmed Banner */}
      {currentStep === "step1" && (
        <div className="flex items-start gap-3 rounded-xl border border-(--status-success-border) bg-(--status-success-bg) p-4 text-(--status-success-fg)">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--status-success-fg) text-white">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
          <div className="text-[13.5px] leading-relaxed">
            <p className="font-semibold">Work email confirmed</p>
            <p className="text-foreground/80">
              <span className="font-medium text-foreground">{verifiedEmail}</span> is verified.
              Your progress saves as a draft, so you can come back any time.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <nav aria-label="Registration progress" className="flex items-center gap-2 sm:gap-4 pt-2">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isClickable = Boolean(onStepClick && idx <= currentIdx);

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.key)}
                className={cn(
                  "flex items-center gap-2.5 text-[13.5px] transition-colors",
                  isCurrent && "font-bold text-foreground",
                  isCompleted && "font-medium text-foreground hover:text-primary",
                  !isCurrent && !isCompleted && "font-normal text-muted-foreground cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isCurrent && "bg-primary text-white shadow-xs",
                    isCompleted && "bg-(--status-success-bg) text-(--status-success-fg) border border-(--status-success-border)",
                    !isCurrent && !isCompleted && "border border-border bg-card text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.stepNumber}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-[2px] flex-1 min-w-4 transition-colors",
                    idx < currentIdx ? "bg-(--status-success-fg)" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
