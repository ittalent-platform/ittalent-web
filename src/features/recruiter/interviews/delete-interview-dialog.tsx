import { RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { requestCode, requestStatus } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";

import { COMPLETED_ERROR_CODE, CONFLICT_STATUS, NOT_FOUND_STATUS, STALE_ERROR_CODES, type InterviewItem } from "./interviews.constants";
import { applicantName, formatShortDay, formatTime } from "./interviews.format";
import { useDeleteInterview } from "./interviews.queries";

type StaleKind = "changed" | "completed";

/** Whether the API refused because the interview is no longer what the screen showed, and in which way. */
function staleKind(error: unknown): StaleKind | null {
  const status = requestStatus(error);
  if (status === NOT_FOUND_STATUS) return "changed";
  if (status !== CONFLICT_STATUS) return null;
  const code = requestCode(error);
  if (code === COMPLETED_ERROR_CODE) return "completed";
  return code && STALE_ERROR_CODES.includes(code) ? "changed" : null;
}

type DeleteInterviewDialogProps = {
  interview: InterviewItem;
  onClose: () => void;
  /** Called once the interview is gone, before the dialog closes (the page of a deleted interview leaves it). */
  onDeleted?: () => void;
};

/**
 * Confirms deleting one interview, and does it. Every outcome is said out loud: a toast for a success or a
 * failure, and a "show latest" step when the interview changed (or was completed) before the delete went through.
 */
export function DeleteInterviewDialog({ interview, onClose, onDeleted }: DeleteInterviewDialogProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const remove = useDeleteInterview();
  const [stale, setStale] = useState<StaleKind | null>(null);

  const name = applicantName(interview.applicant);
  const when = `${formatShortDay(interview.scheduledAt, i18n.language)} · ${formatTime(interview.scheduledAt, i18n.language)}`;
  // A scheduled interview tells its people it is cancelled; one that is already closed goes quietly.
  const kind = interview.status === "scheduled" ? "scheduled" : "closed";

  function confirm() {
    remove.mutate(interview.id, {
      onError: (error) => {
        const reason = staleKind(error);
        if (reason) {
          setStale(reason);
        } else {
          showToast({ message: t("interviews.deleteDialog.failedMessage"), title: t("interviews.deleteDialog.failedTitle"), tone: "error" });
          onClose();
        }
      },
      onSuccess: () => {
        showToast({ message: t(`interviews.deleteDialog.doneMessage.${kind}`, { name }), title: t("interviews.deleteDialog.doneTitle"), tone: "success" });
        onDeleted?.();
        onClose();
      },
    });
  }

  if (stale) {
    return (
      <ActionConfirmDialog
        action={t(`interviews.deleteDialog.stale.${stale}.action`)}
        cancelLabel={t("actions.close")}
        description={t(`interviews.deleteDialog.stale.${stale}.description`)}
        icon={RefreshCw}
        onConfirm={onClose}
        onOpenChange={(open) => !open && onClose()}
        open
        title={t(`interviews.deleteDialog.stale.${stale}.title`)}
        variant="info-solid"
      />
    );
  }

  return (
    <ActionConfirmDialog
      action={remove.isPending ? t("interviews.deleteDialog.working") : t("interviews.deleteDialog.confirm")}
      cancelLabel={t("interviews.deleteDialog.keep")}
      description={t(`interviews.deleteDialog.description.${kind}`, { when })}
      disabled={remove.isPending}
      icon={Trash2}
      keepOpenOnConfirm
      onConfirm={confirm}
      onOpenChange={(open) => !open && !remove.isPending && onClose()}
      open
      title={t("interviews.deleteDialog.title", { name })}
      variant="destructive-solid"
    />
  );
}
