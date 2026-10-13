import { Ban, CircleCheck, RefreshCw, UserX, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { requestCode, requestStatus } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";

import {
  CONFLICT_STATUS,
  NOT_ENDED_ERROR_CODE,
  STALE_ERROR_CODES,
  STATUS_OF_ACTION,
  type InterviewItem,
  type StatusAction,
} from "./interviews.constants";
import { applicantName, formatShortDay, formatTime } from "./interviews.format";
import { useUpdateInterviewStatus } from "./interviews.queries";

const DIALOG = {
  cancel: { icon: Ban, variant: "destructive-solid" },
  complete: { icon: CircleCheck, variant: "success-solid" },
  noShow: { icon: UserX, variant: "warning-solid" },
} as const satisfies Record<StatusAction, { icon: LucideIcon; variant: "destructive-solid" | "success-solid" | "warning-solid" }>;

type InterviewStatusDialogProps = {
  action: StatusAction;
  interview: InterviewItem;
  onClose: () => void;
};

/**
 * Confirms completing, no-showing or cancelling one interview, and does it. Every outcome is said out loud:
 * a toast for a success or a failure, and a "show latest" step when someone else changed the interview first.
 */
export function InterviewStatusDialog({ action, interview, onClose }: InterviewStatusDialogProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const update = useUpdateInterviewStatus();
  const [stale, setStale] = useState(false);
  const [notEnded, setNotEnded] = useState(false);

  const name = applicantName(interview.applicant);
  const when = `${formatShortDay(interview.scheduledAt, i18n.language)} · ${formatTime(interview.scheduledAt, i18n.language)}`;
  const { icon, variant } = DIALOG[action];

  function confirm() {
    update.mutate(
      { id: interview.id, status: STATUS_OF_ACTION[action] },
      {
        onError: (error) => {
          const code = requestCode(error);
          if (requestStatus(error) === CONFLICT_STATUS && code && STALE_ERROR_CODES.includes(code)) {
            setStale(true);
          } else if (code === NOT_ENDED_ERROR_CODE) {
            setNotEnded(true);
          } else {
            showToast({ message: t(`interviews.statusDialog.${action}.failedMessage`), title: t(`interviews.statusDialog.${action}.failedTitle`), tone: "error" });
            onClose();
          }
        },
        onSuccess: () => {
          showToast({ message: t(`interviews.statusDialog.${action}.doneMessage`, { name }), title: t(`interviews.statusDialog.${action}.doneTitle`), tone: "success" });
          onClose();
        },
      },
    );
  }

  if (stale) {
    return (
      <ActionConfirmDialog
        action={t("interviews.statusDialog.stale.action")}
        cancelLabel={t("actions.close")}
        description={t("interviews.statusDialog.stale.description")}
        icon={RefreshCw}
        onConfirm={onClose}
        onOpenChange={(open) => !open && onClose()}
        open
        title={t("interviews.statusDialog.stale.title")}
        variant="info-solid"
      />
    );
  }

  return (
    <ActionConfirmDialog
      action={update.isPending ? t(`interviews.statusDialog.${action}.working`) : t(`interviews.statusDialog.${action}.confirm`)}
      cancelLabel={t(`interviews.statusDialog.${action}.keep`)}
      description={t(`interviews.statusDialog.${action}.description`, { name, when })}
      disabled={update.isPending}
      error={notEnded ? t("interviews.statusDialog.notEnded") : undefined}
      icon={icon}
      keepOpenOnConfirm
      onConfirm={confirm}
      onOpenChange={(open) => !open && !update.isPending && onClose()}
      open
      title={t(`interviews.statusDialog.${action}.title`, { name })}
      variant={variant}
    />
  );
}
