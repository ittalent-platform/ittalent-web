import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { useToast } from "@/components/toast/toast-provider";

import { useDeleteBroadcastMutation } from "./broadcast-notifications.queries";
import type { BroadcastNotificationDto } from "./broadcast-notifications.types";

type DeleteBroadcastDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DeleteBroadcastDialog({
  broadcast,
  onOpenChange,
  open,
}: DeleteBroadcastDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const deleteMutation = useDeleteBroadcastMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!broadcast) return null;

  async function handleConfirm() {
    if (!broadcast) return;
    setErrorMsg(null);
    try {
      await deleteMutation.mutateAsync(broadcast.id);
      showToast({
        message: t("adminBroadcasts.toast.deletedMessage", { title: broadcast.title }),
        title: t("adminBroadcasts.toast.deletedTitle"),
        tone: "success",
      });
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : t("state.error", { defaultValue: "Failed to delete" }),
      );
    }
  }

  return (
    <ActionConfirmDialog
      action={t("actions.delete")}
      cancelLabel={t("actions.cancel")}
      description={
        <div className="space-y-2">
          <p>
            {t("adminBroadcasts.dialog.deleteConfirmMessage", { title: broadcast.title })}
          </p>
          <p className="text-xs text-muted-foreground">
            {broadcast.status === "Sent"
              ? t("adminBroadcasts.dialog.deleteSentNotice")
              : t("adminBroadcasts.dialog.deleteNotice")}
          </p>
        </div>
      }
      disabled={deleteMutation.isPending}
      error={errorMsg ? <InlineErrorAlert>{errorMsg}</InlineErrorAlert> : null}
      icon={Trash2}
      keepOpenOnConfirm
      onConfirm={() => void handleConfirm()}
      onOpenChange={(next) => {
        if (!next) setErrorMsg(null);
        onOpenChange(next);
      }}
      open={open}
      title={t("adminBroadcasts.dialog.deleteTitle")}
      variant="destructive-solid"
    />
  );
}
