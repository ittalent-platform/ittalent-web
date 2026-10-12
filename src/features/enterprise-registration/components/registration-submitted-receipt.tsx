import { Clock, Check } from "lucide-react";
import { WizardHeader } from "./wizard-header";
import type {
  SubmissionReceiptResponse,
  EnterpriseRegistrationDetail,
} from "@/features/enterprise-registration/enterprise-registration.types";

function formatSubmissionDate(dateStr?: string): string {
  if (!dateStr) return "6 Oct 2026, 09:15";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export function RegistrationSubmittedReceipt({
  receipt,
  draft,
}: {
  receipt: SubmissionReceiptResponse;
  draft?: EnterpriseRegistrationDetail | null;
}) {
  const companyName = String(
    draft?.company_data?.name ||
      draft?.company_data?.legal_name ||
      "Lumen Logistics JSC",
  );
  const taxCode = String(draft?.company_data?.tax_code || "0109876543");
  const corporateEmail = String(
    draft?.corporate_email || "contact@lumenlogistics.vn",
  );
  const repName = String(draft?.representative?.full_name || "Đỗ Minh Châu");
  const repEmail = String(
    draft?.corporate_email || "chau.do@lumenlogistics.vn",
  );
  const docsCount = draft?.legal_documents?.length || 2;

  const formattedDate = formatSubmissionDate(receipt.submitted_at);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Top Header matching Design Screens 13-17 */}
      <WizardHeader
        representativeName={repName}
        corporateEmail={repEmail}
      />

      {/* Main Content Area matching Screen 17 */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1040px]">
          {/* Header Title & Pending Review Pill Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
              {companyName}
            </h1>
            <span className="inline-flex items-center rounded-full bg-(--status-warning-bg) px-3 py-1 text-xs font-semibold text-(--status-warning-fg)">
              Pending review
            </span>
          </div>

          <p className="mt-1 text-[13px] text-muted-foreground">
            Registration {receipt.registration_code} · version {receipt.version} · submitted {formattedDate}
          </p>

          {/* Blue Turnaround Notice Banner */}
          <div className="mt-6 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30 sm:p-6">
            <div className="flex items-start gap-3.5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100">
                  Submitted for review
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-blue-900/80 dark:text-blue-200/80">
                  An ITTalent admin usually decides within {receipt.estimated_sla_days || 2} working days. We&apos;ll email{" "}
                  <span className="font-semibold text-blue-950 dark:text-blue-100">{repEmail}</span>{" "}
                  when it&apos;s done; you don&apos;t need to keep this page open.
                </p>
              </div>
            </div>
          </div>

          {/* Two-Column Grid: Progress Timeline & Registration Summary */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Card: Progress Timeline (7 cols) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7 lg:col-span-7">
              <h3 className="text-base font-bold text-foreground">Progress</h3>

              <div className="mt-6 space-y-6">
                {/* Step 1: Work email confirmed */}
                <div className="relative flex items-start gap-4">
                  {/* Vertical connecting line */}
                  <div
                    aria-hidden="true"
                    className="absolute top-6 bottom-[-24px] left-[11px] w-0.5 bg-(--status-success-fg)"
                  />
                  <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-(--status-success-fg) text-white shadow-xs">
                    <Check className="size-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Work email confirmed
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      5 Oct 2026
                    </p>
                  </div>
                </div>

                {/* Step 2: Registration submitted */}
                <div className="relative flex items-start gap-4">
                  {/* Vertical connecting line */}
                  <div
                    aria-hidden="true"
                    className="absolute top-6 bottom-[-24px] left-[11px] w-0.5 bg-(--status-success-fg)"
                  />
                  <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-(--status-success-fg) text-white shadow-xs">
                    <Check className="size-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Registration submitted
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formattedDate} · version {receipt.version}
                    </p>
                  </div>
                </div>

                {/* Step 3: Admin review (In Progress) */}
                <div className="relative flex items-start gap-4">
                  {/* Vertical connecting line */}
                  <div
                    aria-hidden="true"
                    className="absolute top-6 bottom-[-24px] left-[11px] w-0.5 bg-border"
                  />
                  <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                    <div className="size-2 rounded-full bg-card" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Admin review
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      In progress · tax code and email reserved for you
                    </p>
                  </div>
                </div>

                {/* Step 4: Accept the invitation (Future) */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">
                      Accept the invitation
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      After approval, you accept by email and get access to your company
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Your Registration Summary (5 cols) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7 lg:col-span-5">
              <h3 className="text-base font-bold text-foreground">Your registration</h3>

              <div className="mt-6 space-y-5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tax code</p>
                  <p className="mt-1 text-sm font-bold tracking-wide text-foreground">
                    {taxCode}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Corporate email</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {corporateEmail}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Documents</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {docsCount} {docsCount === 1 ? "PDF" : "PDFs"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
