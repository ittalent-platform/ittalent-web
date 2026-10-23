import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Save, Send } from "lucide-react";

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
import { useCreateBroadcastMutation } from "./broadcast-notifications.queries";
import {
  broadcastFormSchema,
  type BroadcastFormValues,
} from "./broadcast-notifications.schemas";

type CreateBroadcastDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const DEFAULT_VALUES: BroadcastFormValues = {
  action_label: "",
  action_url: "",
  category: "System Maintenance",
  channels: ["In-App Inbox"],
  content: "",
  priority: "Normal",
  target_audience: "All Users",
  title: "",
};

export function CreateBroadcastDialog({
  onOpenChange,
  open,
}: CreateBroadcastDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const createMutation = useCreateBroadcastMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BroadcastFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(broadcastFormSchema),
  });

  function handleClose(next: boolean) {
    if (!next) {
      form.reset(DEFAULT_VALUES);
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  async function submitPayload(values: BroadcastFormValues, isDraft: boolean) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        action_label: values.action_label?.trim() || null,
        action_url: values.action_url?.trim() || null,
        category: values.category,
        channels: values.channels,
        content: values.content.trim(),
        is_draft: isDraft,
        priority: values.priority,
        target_audience: values.target_audience,
        title: values.title.trim(),
      });

      showToast({
        message: t(
          isDraft
            ? "adminBroadcasts.toast.createdDraftMessage"
            : "adminBroadcasts.toast.createdSentMessage",
        ),
        title: t(
          isDraft
            ? "adminBroadcasts.toast.createdDraftTitle"
            : "adminBroadcasts.toast.createdSentTitle",
        ),
        tone: "success",
      });

      handleClose(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("state.error", { defaultValue: "An error occurred" }),
      );
    }
  }

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("adminBroadcasts.dialog.createTitle")}</DialogTitle>
          <DialogDescription>
            {t("adminBroadcasts.dialog.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <div className="py-1">
            <InlineErrorAlert>{submitError}</InlineErrorAlert>
          </div>
        ) : null}

        <form
          className="flex flex-col gap-4 py-2"
          id="create-broadcast-form"
          onSubmit={form.handleSubmit((values) => submitPayload(values, false))}
        >
          <BroadcastForm disabled={createMutation.isPending} form={form} />
        </form>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={createMutation.isPending}
            onClick={() => handleClose(false)}
            type="button"
            variant="outline"
          >
            {t("actions.cancel")}
          </Button>

          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={createMutation.isPending}
            onClick={form.handleSubmit((values) => submitPayload(values, true))}
            type="button"
            variant="secondary"
          >
            <Save className="size-4" />
            {t("adminBroadcasts.actions.saveDraft")}
          </Button>

          <Button
            className={DIALOG_BUTTON_CLASS}
            disabled={createMutation.isPending}
            form="create-broadcast-form"
            type="submit"
          >
            <Send className="size-4" />
            {t("adminBroadcasts.actions.publishBroadcast")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
