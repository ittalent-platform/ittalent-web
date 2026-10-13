import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast/toast-provider";
import {
  useEnterpriseRegistrationDetailQuery,
  useAdminRegistrationDecisionMutation,
} from "@/features/enterprise-registration/enterprise-registration.queries";
import type { AdminChecklistState } from "@/features/enterprise-registration/enterprise-registration.types";
import { RegistrationDetailHeader } from "./components/registration-detail-header";
import { RegistrationDossierCards } from "./components/registration-dossier-cards";
import { RegistrationAuditRail } from "./components/registration-audit-rail";
import { ApproveRegistrationDialog } from "./components/approve-registration-dialog";
import { RejectRegistrationDialog } from "./components/reject-registration-dialog";

export function RegistrationDetailPage() {
  const { t } = useTranslation();
  const { registrationId = "" } = useParams<{ registrationId: string }>();
  const { showToast } = useToast();

  const detailQuery = useEnterpriseRegistrationDetailQuery(registrationId, {
    enabled: Boolean(registrationId),
  });

  const decisionMutation = useAdminRegistrationDecisionMutation();

  const [checklist, setChecklist] = useState<AdminChecklistState>({
    tax_code_verified: false,
    legal_representative_verified: false,
    documents_verified: false,
  });

  const [evidenceNote, setEvidenceNote] = useState<string>("");
  const [isApproveOpen, setIsApproveOpen] = useState<boolean>(false);
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);

  const registration = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (detailQuery.isError || !registration) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">
          {t("admin.registrations.detail.notFoundTitle", "Registration not found")}
        </h2>
        <p className="max-w-md text-[14px] text-muted-foreground">
          {t(
            "admin.registrations.detail.notFoundDesc",
            "The registration case you are trying to view does not exist or may have been deleted.",
          )}
        </p>
        <Link
          to="/admin/registrations"
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          {t("admin.registrations.detail.backToQueue", "← Back to registrations")}
        </Link>
      </div>
    );
  }

  const isPending =
    registration.status === "pending_review" || registration.status === "under_review";
  const isApproved = registration.status === "approved";
  const isRejected = registration.status === "rejected";

  const canApprove =
    isPending &&
    checklist.tax_code_verified &&
    checklist.legal_representative_verified &&
    checklist.documents_verified &&
    evidenceNote.trim().length > 0;

  const targetId = registrationId || registration._id || "";

  const handleApproveConfirm = async () => {
    try {
      await decisionMutation.mutateAsync({
        id: targetId,
        body: {
          decision: "approved",
          version: registration.version,
          checklist,
        },
      });

      setIsApproveOpen(false);
      showToast({
        title: t("admin.registrations.toast.approvedTitle", "Registration approved"),
        message: t(
          "admin.registrations.toast.approvedDesc",
          "Enterprise account created and invitation sent to corporate email.",
        ),
        tone: "success",
      });
      void detailQuery.refetch();
    } catch {
      showToast({
        title: t("common.error", "Error"),
        message: t("admin.registrations.toast.decisionFailed", "Failed to process decision. Please try again."),
        tone: "error",
      });
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    try {
      await decisionMutation.mutateAsync({
        id: targetId,
        body: {
          decision: "rejected",
          version: registration.version,
          rejection_reason: reason,
        },
      });

      setIsRejectOpen(false);
      showToast({
        title: t("admin.registrations.toast.rejectedTitle", "Registration rejected"),
        message: t(
          "admin.registrations.toast.rejectedDesc",
          "Notification email sent to requester with explanation details.",
        ),
        tone: "success",
      });
      void detailQuery.refetch();
    } catch {
      showToast({
        title: t("common.error", "Error"),
        message: t("admin.registrations.toast.decisionFailed", "Failed to process decision. Please try again."),
        tone: "error",
      });
    }
  };

  const company = registration.company_data as Record<string, unknown> | undefined;
  const companyName =
    (company?.name as string) ||
    (company?.legal_name as string) ||
    registration.corporate_email;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
      {/* Top Header */}
      <RegistrationDetailHeader
        registration={registration}
        canApprove={canApprove}
        onApproveClick={() => setIsApproveOpen(true)}
        onRejectClick={() => setIsRejectOpen(true)}
      />

      {/* Outcome Banner (if Approved) */}
      {isApproved ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-[14px] text-emerald-950 dark:text-emerald-200">
                {t("admin.registrations.detail.approvedBannerTitle", {
                  defaultValue: "Approved · {{name}} is Active",
                  name: companyName,
                })}
              </div>
              <div className="text-[13px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                {t(
                  "admin.registrations.detail.approvedBannerDesc",
                  "Enterprise was created and authorized representative invitation is pending acceptance.",
                )}
              </div>
            </div>
          </div>

          {registration.created_enterprise_id ? (
            <Link
              to={`/admin/enterprises/${registration.created_enterprise_id}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
            >
              <span>{t("admin.registrations.detail.openCompany", "Open company")}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Outcome Banner (if Rejected) */}
      {isRejected ? (
        <div className="flex items-start gap-3 p-4.5 rounded-2xl border border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/30">
          <XCircle className="size-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-[14px] text-red-950 dark:text-red-200">
              {t("admin.registrations.detail.rejectedBannerTitle", "Rejected")}
            </div>
            <div className="text-[13px] text-red-800/90 dark:text-red-300/90 mt-0.5">
              {t(
                "admin.registrations.detail.rejectedBannerDesc",
                "No company was created. The requester was emailed and can register again with corrected details.",
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Dossier Evidence Cards) */}
        <div className="lg:col-span-2">
          <RegistrationDossierCards registration={registration} />
        </div>

        {/* Right Column (Audit Checklist Rail) */}
        <div className="lg:col-span-1">
          <RegistrationAuditRail
            registration={registration}
            checklist={checklist}
            onChecklistChange={setChecklist}
            evidenceNote={evidenceNote}
            onEvidenceNoteChange={setEvidenceNote}
            canApprove={canApprove}
            onApproveClick={() => setIsApproveOpen(true)}
            onRejectClick={() => setIsRejectOpen(true)}
          />
        </div>
      </div>

      {/* Approve Dialog */}
      <ApproveRegistrationDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        registration={registration}
        isLoading={decisionMutation.isPending}
        onConfirm={handleApproveConfirm}
      />

      {/* Reject Dialog */}
      <RejectRegistrationDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        registration={registration}
        isLoading={decisionMutation.isPending}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
