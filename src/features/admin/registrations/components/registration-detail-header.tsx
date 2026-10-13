import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { EnterpriseRegistrationDetail } from "@/features/enterprise-registration/enterprise-registration.types";
import {
  calculateWaitingDays,
  formatSubmittedDate,
  getInitials,
} from "@/features/admin/registrations/registrations.formatters";

interface RegistrationDetailHeaderProps {
  registration: EnterpriseRegistrationDetail;
}

export function RegistrationDetailHeader({ registration }: RegistrationDetailHeaderProps) {
  const { t } = useTranslation();

  const company = registration.company_data as Record<string, unknown> | undefined;
  const companyName =
    (company?.name as string) ||
    (company?.legal_name as string) ||
    registration.corporate_email;

  const initials = getInitials(companyName);
  const status = registration.status;
  const isPending = status === "pending_review" || status === "under_review";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const submittedAt =
    registration.claim_locks?.locked_at ||
    (registration as { submitted_at?: string }).submitted_at;
  const formattedSubmitted = formatSubmittedDate(submittedAt);
  const waiting = calculateWaitingDays(submittedAt);

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link
          to="/admin/registrations"
          className="hover:text-foreground transition-colors"
        >
          {t("admin.registrations.detail.breadcrumbQueue", "Registrations")}
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground font-medium">
          {registration.registration_code}
        </span>
      </nav>

      {/* Main Header Row */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-sm">
          {initials}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground">
              {companyName}
            </h1>

            {/* Status Badge */}
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
                isPending &&
                  "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
                isApproved &&
                  "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
                isRejected &&
                  "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
              )}
            >
              {isPending && t("admin.registrations.detail.statusPending", "Pending review")}
              {isApproved && t("admin.registrations.detail.statusApproved", "Approved")}
              {isRejected && t("admin.registrations.detail.statusRejected", "Rejected")}
            </span>

            {/* Version Pill */}
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11.5px] font-semibold text-muted-foreground">
              v{registration.version}
            </span>
          </div>

          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("admin.registrations.detail.submittedSubtitle", {
              defaultValue: "Submitted {{date}}, {{time}} by {{name}} · waiting {{waiting}}",
              date: formattedSubmitted.date,
              time: formattedSubmitted.time,
              name: registration.representative.full_name,
              waiting: waiting.text,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
