import { useState } from "react";
import { Ban, Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { requestErrorMessage } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { FormField } from "@/components/common/form-field";
import { isValidReason, REASON_MAX_LENGTH, ReasonField } from "@/components/common/reason-field";
import { Textarea } from "@/components/ui/textarea";

/** Runs a dialog's confirm action: closes on success, keeps the dialog open with the error otherwise. */
function useConfirmRunner(onClose: () => void, fallback: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<void>) {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch (err: unknown) {
      setError(requestErrorMessage(err, fallback));
    } finally {
      setIsSubmitting(false);
    }
  }
  return { error, isSubmitting, run };
}

type SuspendDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  enterpriseName: string;
  activeJobsCount?: number;
};

export function SuspendEnterpriseDialog({ isOpen, onClose, onConfirm, enterpriseName, activeJobsCount = 0 }: SuspendDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const { error, isSubmitting, run } = useConfirmRunner(onClose, "Failed to suspend enterprise");

  return (
    <ActionConfirmDialog
      action={isSubmitting ? "Suspending..." : t("adminEnterprises.suspendDialog.confirm", "Suspend enterprise")}
      cancelLabel={t("adminEnterprises.suspendDialog.cancel", "Cancel")}
      confirmDisabled={!isValidReason(reason)}
      description={`The company page and its ${activeJobsCount} open ${activeJobsCount === 1 ? "job" : "jobs"} will be hidden from the public, and the company cannot publish new jobs. Existing applications are preserved. This action is recorded in the audit log.`}
      dirty={reason.trim() !== ""}
      disabled={isSubmitting}
      error={error}
      icon={Ban}
      keepOpenOnConfirm
      onConfirm={() => void run(() => onConfirm(reason.trim()))}
      onOpenChange={(open) => !open && onClose()}
      open={isOpen}
      title={t("adminEnterprises.suspendDialog.title", "Suspend {{name}}?", { name: enterpriseName })}
      variant="warning-solid"
    >
      <ReasonField
        id="suspend-reason"
        label={t("adminEnterprises.suspendDialog.reasonLabel", "Reason")}
        onChange={setReason}
        placeholder={t("adminEnterprises.suspendDialog.reasonPlaceholder", "Why is this enterprise suspended? (e.g. Unpaid platform invoice, legal documentation review)")}
        value={reason}
      />
    </ActionConfirmDialog>
  );
}

type ActivateDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  enterpriseName: string;
  previousReason?: string | null;
};

export function ActivateEnterpriseDialog({ isOpen, onClose, onConfirm, enterpriseName, previousReason }: ActivateDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const { error, isSubmitting, run } = useConfirmRunner(onClose, "Failed to activate enterprise");

  return (
    <ActionConfirmDialog
      action={isSubmitting ? "Activating..." : t("adminEnterprises.activateDialog.confirm", "Activate enterprise")}
      cancelLabel={t("adminEnterprises.activateDialog.cancel", "Cancel")}
      description={t("adminEnterprises.activateDialog.description", {
        defaultValue: "The company profile becomes public again and authorized recruiters can publish job postings immediately.",
        name: enterpriseName,
      })}
      dirty={reason.trim() !== ""}
      disabled={isSubmitting}
      error={error}
      icon={Check}
      keepOpenOnConfirm
      onConfirm={() => void run(() => onConfirm(reason.trim() || undefined))}
      onOpenChange={(open) => !open && onClose()}
      open={isOpen}
      title={t("adminEnterprises.activateDialog.title", "Activate {{name}}?", { name: enterpriseName })}
      variant="success-solid"
    >
      <div className="flex flex-col gap-4">
        {previousReason ? (
          <p className="m-0 rounded-xl border border-border bg-muted/60 p-3 text-xs leading-relaxed text-foreground/80">
            <strong>Current status note:</strong> {previousReason}
          </p>
        ) : null}
        <FormField htmlFor="activate-reason" label={<>Activation note <span className="text-xs font-normal text-muted-foreground">(optional)</span></>}>
          <Textarea
            id="activate-reason"
            maxLength={REASON_MAX_LENGTH}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("adminEnterprises.form.placeholders.statusReason", "Optional note for the audit log...")}
            rows={2}
            value={reason}
          />
        </FormField>
      </div>
    </ActionConfirmDialog>
  );
}

type DeleteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  enterpriseName: string;
};

export function DeleteEnterpriseDialog({ isOpen, onClose, onConfirm, enterpriseName }: DeleteDialogProps) {
  const { t } = useTranslation();
  const { error, isSubmitting, run } = useConfirmRunner(onClose, "Failed to delete enterprise");

  return (
    <ActionConfirmDialog
      action={isSubmitting ? "Deleting..." : t("adminEnterprises.deleteDialog.confirm", "Delete enterprise")}
      cancelLabel={t("adminEnterprises.deleteDialog.cancel", "Cancel")}
      description={t("adminEnterprises.deleteDialog.description", {
        defaultValue: "The enterprise profile is soft-deleted and removed from the active directory and public portal. Past job application records are preserved for audit compliance. This action cannot be reversed from this interface.",
        name: enterpriseName,
      })}
      disabled={isSubmitting}
      error={error}
      icon={Trash2}
      keepOpenOnConfirm
      onConfirm={() => void run(onConfirm)}
      onOpenChange={(open) => !open && onClose()}
      open={isOpen}
      title={t("adminEnterprises.deleteDialog.title", "Delete {{name}}?", { name: enterpriseName })}
      variant="destructive-solid"
    />
  );
}
