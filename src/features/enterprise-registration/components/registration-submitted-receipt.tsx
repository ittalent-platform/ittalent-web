import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";

export function RegistrationSubmittedReceipt({
  receipt,
}: {
  receipt: SubmissionReceiptResponse;
}) {
  const formattedDate = receipt.submitted_at
    ? new Date(receipt.submitted_at).toLocaleString()
    : "Just now";

  return (
    <div className="w-full max-w-[560px] rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-10 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-(--status-success-bg) text-(--status-success-fg)">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Registration Case Submitted
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your employer verification intake dossier has been securely recorded and queued for administrative review.
      </p>

      {/* Case Details Box */}
      <div className="my-6 rounded-xl border border-border bg-muted p-5 text-left space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Registration Case Code:</span>
          <span className="font-mono font-bold text-sm text-foreground bg-card border border-border px-2.5 py-1 rounded-md">
            {receipt.registration_code}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Intake Status:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-(--status-warning-bg) px-2.5 py-0.5 font-semibold text-(--status-warning-fg)">
            <Clock className="h-3 w-3" /> Under Review
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Submitted At:</span>
          <span className="font-medium text-foreground">{formattedDate}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Estimated Turnaround:</span>
          <span className="font-medium text-foreground">
            {receipt.estimated_sla_days || 2} business days
          </span>
        </div>
      </div>

      {/* Review Workflow Timeline Card */}
      <div className="rounded-xl border border-line-muted bg-card p-5 text-left space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          What happens next?
        </h3>

        <div className="space-y-3 text-[13px]">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--status-success-bg) text-xs font-bold text-(--status-success-fg)">
              ✓
            </div>
            <div>
              <p className="font-semibold text-foreground">Corporate Domain & Tax Code Locked</p>
              <p className="text-xs text-muted-foreground">Claim locks prevent duplicates while under review.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--status-warning-bg) text-xs font-bold text-(--status-warning-fg)">
              2
            </div>
            <div>
              <p className="font-semibold text-foreground">Compliance Document Verification</p>
              <p className="text-xs text-muted-foreground">
                ITTalent staff inspects your Business Registration Certificate against national registers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              3
            </div>
            <div>
              <p className="font-semibold text-foreground">Workspace Invitation Sent</p>
              <p className="text-xs text-muted-foreground">
                Upon approval, an email with a secure link to set your enterprise password will be delivered.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button asChild className="w-full">
          <Link to="/">
            Return to Homepage <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
