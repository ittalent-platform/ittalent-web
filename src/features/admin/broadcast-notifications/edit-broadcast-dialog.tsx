import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";

import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { BroadcastForm } from "./broadcast-form";
import { useUpdateBroadcastMutation } from "./broadcast-notifications.queries";
import {
  broadcastFormSchema,
  type BroadcastFormValues,
} from "./broadcast-notifications.schemas";
import type { BroadcastNotificationDto } from "./broadcast-notifications.types";

type EditBroadcastDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function EditBroadcastDialogContent({
  broadcast,
  onOpenChange,
  open,
}: {
  broadcast: BroadcastNotificationDto;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const updateMutation = useUpdateBroadcastMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BroadcastFormValues>({
    defaultValues: {
      action_label: broadcast.actionLabel ?? "",
      action_url: broadcast.actionUrl ?? "",
      category: broadcast.category,
      channels: broadcast.channels?.length ? broadcast.channels : ["In-App Inbox"],
      content: broadcast.content,
      priority: broadcast.priority,
      target_audience: broadcast.targetAudience,
      title: broadcast.title,
    },
    resolver: zodResolver(broadcastFormSchema),
  });

  async function onSubmit(values: BroadcastFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        body: {
          action_label: values.action_label?.trim() || null,
          action_url: values.action_url?.trim() || null,
          category: values.category,
          channels: values.channels,
          content: values.content.trim(),
          priority: values.priority,
          target_audience: values.target_audience,
          title: values.title.trim(),
        },
        id: broadcast.id,
      });

      showToast({
        message: t("adminBroadcasts.toast.updatedMessage"),
        title: t("adminBroadcasts.toast.updatedTitle"),
        tone: "success",
      });

      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("state.error", { defaultValue: "An error occurred" }),
      );
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("adminBroadcasts.dialog.editTitle")}</DialogTitle>
          <DialogDescription>
            {t("adminBroadcasts.dialog.editDescription")}
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <div className="py-1">
            <InlineErrorAlert>{submitError}</InlineErrorAlert>
          </div>
        ) : null}

        <form
          className="flex flex-col gap-4 py-2"
          id="edit-broadcast-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <BroadcastForm
            disabled={updateMutation.isPending}
            form={form}
            isEditing
          />
        </form>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={updateMutation.isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("actions.cancel")}
          </Button>

          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={updateMutation.isPending}
            form="edit-broadcast-form"
            type="submit"
          >
            <Save className="size-4" />
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditBroadcastDialog({
  broadcast,
  onOpenChange,
  open,
}: EditBroadcastDialogProps) {
  if (!broadcast) return null;
  return (
    <EditBroadcastDialogContent
      broadcast={broadcast}
      key={broadcast.id}
      onOpenChange={onOpenChange}
      open={open}
    />
  );
}
