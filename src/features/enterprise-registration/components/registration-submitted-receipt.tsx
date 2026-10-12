import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { SubmissionReceiptResponse } from "../enterprise-registration.types";

export function RegistrationSubmittedReceipt({
  receipt,
}: {
  receipt: SubmissionReceiptResponse;
}) {
  const formattedDate = receipt.submitted_at
    ? new Date(receipt.submitted_at).toLocaleString()
    : "Just now";

  return (
    <div className="w-full max-w-[560px] rounded-2xl border border-[#e6e4df] bg-[#ffffff] p-6 shadow-xs sm:p-10 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ee] text-[#12764a]">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-[#19191c]">
        Registration Case Submitted
      </h2>
      <p className="mt-2 text-sm text-[#64646b]">
        Your employer verification intake dossier has been securely recorded and queued for administrative review.
      </p>

      {/* Case Details Box */}
      <div className="my-6 rounded-xl border border-[#e6e4df] bg-[#faf9f5] p-5 text-left space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#737379]">Registration Case Code:</span>
          <span className="font-mono font-bold text-sm text-[#19191c] bg-[#efede8] px-2.5 py-1 rounded-md">
            {receipt.registration_code}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#737379]">Intake Status:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fde8e0] px-2.5 py-0.5 font-semibold text-[#f2470c]">
            <Clock className="h-3 w-3" /> Under Review
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#737379]">Submitted At:</span>
          <span className="font-medium text-[#19191c]">{formattedDate}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#737379]">Estimated Turnaround:</span>
          <span className="font-medium text-[#19191c]">
            {receipt.estimated_sla_days || 2} business days
          </span>
        </div>
      </div>

      {/* Review Workflow Timeline Card */}
      <div className="rounded-xl border border-[#efede8] bg-[#ffffff] p-5 text-left space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#737379]">
          What happens next?
        </h3>

        <div className="space-y-3 text-[13px]">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f5ee] text-xs font-bold text-[#12764a]">
              ✓
            </div>
            <div>
              <p className="font-semibold text-[#19191c]">Corporate Domain & Tax Code Locked</p>
              <p className="text-xs text-[#64646b]">Claim locks prevent duplicates while under review.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fde8e0] text-xs font-bold text-[#f2470c]">
              2
            </div>
            <div>
              <p className="font-semibold text-[#19191c]">Compliance Document Verification</p>
              <p className="text-xs text-[#64646b]">
                ITTalent staff inspects your Business Registration Certificate against national registers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4f2ec] text-xs font-bold text-[#737379]">
              3
            </div>
            <div>
              <p className="font-semibold text-[#19191c]">Workspace Invitation Sent</p>
              <p className="text-xs text-[#64646b]">
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
