import { CheckCircle2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminChecklistState,
  EnterpriseRegistrationDetail,
} from "@/features/enterprise-registration/enterprise-registration.types";

interface RegistrationAuditRailProps {
  registration: EnterpriseRegistrationDetail;
  checklist: AdminChecklistState;
  onChecklistChange: (next: AdminChecklistState) => void;
  evidenceNote: string;
  onEvidenceNoteChange: (note: string) => void;
  canApprove: boolean;
  onApproveClick: () => void;
  onRejectClick: () => void;
}

export function RegistrationAuditRail({
  registration,
  checklist,
  onChecklistChange,
  evidenceNote,
  onEvidenceNoteChange,
  canApprove,
  onApproveClick,
  onRejectClick,
}: RegistrationAuditRailProps) {
  const { t } = useTranslation();

  const status = registration.status;
  const isPending = status === "pending_review" || status === "under_review";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const company = registration.company_data as Record<string, unknown> | undefined;
  const taxCode =
    (company?.tax_code as string) || registration.claim_locks?.tax_code || "—";

  return (
    <div className="flex flex-col gap-6">
      {/* PENDING REVIEW AUDIT FLOW */}
      {isPending ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-6">
          {/* Section A: Automated System Checks */}
          <div>
            <span className="block font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("admin.registrations.audit.automatedChecksTitle", "CHECKS · RUN AGAIN WHEN YOU APPROVE")}
            </span>

            <ul className="mt-4 flex flex-col gap-3 text-[13px]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  {t("admin.registrations.audit.checkVersion", {
                    defaultValue: "Case is Pending review at version {{version}}",
                    version: registration.version,
                  })}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  {t("admin.registrations.audit.checkEmailVerified", "Requester email matches and is verified")}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  {t("admin.registrations.audit.checkAccountEligible", "Requester account is active and eligible")}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-foreground">
                    {t("admin.registrations.audit.checkTaxHeld", "Tax code is held by this case")}
                  </span>
                  <div className="font-mono text-[11.5px] text-muted-foreground mt-0.5">
                    {taxCode} · v{registration.version}
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-foreground">
                    {t("admin.registrations.audit.checkEmailHeld", "Corporate email is held by this case")}
                  </span>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">
                    {registration.corporate_email} · v{registration.version}
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="border-t border-border pt-6">
            {/* Section B: Manual Admin Review Checklist */}
            <span className="block font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("admin.registrations.audit.manualReviewTitle", {
                defaultValue: "YOUR REVIEW OF VERSION {{version}}",
                version: registration.version,
              })}
            </span>

            <div className="mt-4 flex flex-col gap-3.5">
              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.tax_code_verified}
                  onChange={(e) =>
                    onChecklistChange({
                      ...checklist,
                      tax_code_verified: e.target.checked,
                    })
                  }
                  className="size-4.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer mt-0.5"
                />
                <span className="text-[13.5px] font-medium text-foreground leading-snug">
                  {t("admin.registrations.audit.checkLegalTax", "Legal and tax details verified offline")}
                </span>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.legal_representative_verified}
                  onChange={(e) =>
                    onChecklistChange({
                      ...checklist,
                      legal_representative_verified: e.target.checked,
                    })
                  }
                  className="size-4.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer mt-0.5"
                />
                <span className="text-[13.5px] font-medium text-foreground leading-snug">
                  {t("admin.registrations.audit.checkRepAuthority", "Representative's authority confirmed")}
                </span>
              </label>

              {/* Checkbox 3 */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.documents_verified}
                  onChange={(e) =>
                    onChecklistChange({
                      ...checklist,
                      documents_verified: e.target.checked,
                    })
                  }
                  className="size-4.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer mt-0.5"
                />
                <span className="text-[13.5px] font-medium text-foreground leading-snug">
                  {t("admin.registrations.audit.checkDocsAuthentic", "Legal documentation authentic and valid")}
                </span>
              </label>
            </div>

            {/* Evidence summary textarea */}
            <div className="mt-5">
              <label className="block text-[12.5px] font-medium text-foreground">
                <span>{t("admin.registrations.audit.evidenceSummaryLabel", "Evidence summary")}</span>
                <span className="text-primary ml-1">*</span>
              </label>
              <Textarea
                value={evidenceNote}
                onChange={(e) => onEvidenceNoteChange(e.target.value)}
                placeholder={t(
                  "admin.registrations.audit.evidenceSummaryPlaceholder",
                  "Checked tax code and registration certificate on the national portal...",
                )}
                className="mt-2 min-h-[90px] text-[13px] rounded-xl"
              />
              <span className="mt-1.5 block text-[11.5px] text-muted-foreground">
                {t("admin.registrations.audit.evidenceNoteHelper", "Required · saved with the approval record")}
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                disabled={!canApprove}
                onClick={onApproveClick}
                className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[14px] gap-2 shadow-xs"
              >
                <Check className="size-4" />
                <span>{t("admin.registrations.detail.approveBtn", "Approve registration")}</span>
              </Button>

              <Button
                variant="outline"
                onClick={onRejectClick}
                className="h-10 w-full rounded-xl border-border text-foreground hover:bg-muted font-medium text-[13.5px]"
              >
                <span>{t("admin.registrations.detail.rejectBtn", "Reject...")}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* APPROVED CASE DECISION RECORD */}
      {isApproved ? (
        <div className="flex flex-col gap-6">
          {/* Invitation status card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <span className="block font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("admin.registrations.audit.invitationTitle", "INVITATION")}
            </span>

            <div className="mt-4 flex flex-col gap-4 text-[13px]">
              <div>
                <span className="block text-[12px] text-muted-foreground">
                  {t("admin.registrations.audit.inviteStatus", "Status")}
                </span>
                <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {t("admin.registrations.audit.pendingAcceptance", "Pending acceptance")}
                </span>
              </div>

              <div>
                <span className="block text-[12px] text-muted-foreground">
                  {t("admin.registrations.audit.sentTo", "Sent to")}
                </span>
                <span className="mt-0.5 block font-medium text-foreground">
                  {registration.corporate_email}
                </span>
              </div>

              <div>
                <span className="block text-[12px] text-muted-foreground">
                  {t("admin.registrations.audit.accessNow", "Access now")}
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  {t("admin.registrations.audit.noneUntilAccepted", "None until accepted")}
                </span>
              </div>
            </div>
          </div>

          {/* Decision record card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <span className="block font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("admin.registrations.audit.decisionRecordTitle", "DECISION RECORD")}
            </span>

            <div className="mt-4 flex flex-col gap-4 text-[13px]">
              <div>
                <span className="block text-[12px] text-muted-foreground">
                  {t("admin.registrations.audit.approvedVersion", "Approved version")}
                </span>
                <span className="mt-0.5 block font-mono font-bold text-foreground">
                  {registration.version}
                </span>
              </div>

              <div>
                <span className="block text-[12px] text-muted-foreground">
                  {t("admin.registrations.audit.reviewedBy", "Reviewed by")}
                </span>
                <span className="mt-0.5 block text-foreground font-medium">
                  {t("admin.registrations.audit.systemAdmin", "System Admin")}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* REJECTED CASE DECISION RECORD */}
      {isRejected ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <span className="block font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {t("admin.registrations.audit.decisionRecordTitle", "DECISION RECORD")}
          </span>

          <div className="mt-4 flex flex-col gap-4 text-[13px]">
            <div>
              <span className="block text-[12px] text-muted-foreground">
                {t("admin.registrations.audit.decision", "Decision")}
              </span>
              <span className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {t("admin.registrations.audit.rejectedStatus", "Rejected")}
              </span>
            </div>

            <div>
              <span className="block text-[12px] text-muted-foreground">
                {t("admin.registrations.audit.caseVersion", "Version")}
              </span>
              <span className="mt-0.5 block font-mono font-bold text-foreground">
                {registration.version}
              </span>
            </div>

            <div>
              <span className="block text-[12px] text-muted-foreground">
                {t("admin.registrations.audit.taxAndEmailStatus", "Tax code and email")}
              </span>
              <span className="mt-0.5 block text-muted-foreground font-medium">
                {t("admin.registrations.audit.freedNotice", "Freed for a new registration")}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
