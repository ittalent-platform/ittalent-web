import type { ReactNode } from "react";
import { Link } from "react-router";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { StepperNav } from "./stepper-nav";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

function getInitials(name?: string): string {
  if (!name) return "MC";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  const initials = getInitials(representativeName);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Top Header matching Design Screens 13-17 */}
      <header className="flex h-[72px] items-center justify-between border-b border-border bg-card px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="ITTalent home" className="flex items-center">
            <BrandLogo />
          </Link>
          <div aria-hidden="true" className="h-5 w-[1px] bg-border" />
          <span className="text-[14px] font-medium text-foreground">
            Company registration
          </span>
        </div>

        {/* User Identity Cluster on Right */}
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="hidden text-xs text-muted-foreground animate-pulse sm:inline">
              Saving draft...
            </span>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700 text-sm">
              {initials}
            </div>
            <div className="hidden flex-col text-left sm:flex">
              <span className="text-[13px] font-semibold leading-tight text-foreground">
                {representativeName}
              </span>
              <span className="text-[11.5px] text-muted-foreground">
                {corporateEmail}
              </span>
            </div>
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                title="Exit registration"
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to="/"
                title="Exit registration"
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

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
