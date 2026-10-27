import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Save, Send } from "lucide-react";

import {
  ActionConfirmDialog,
  DIALOG_BUTTON_CLASS,
} from "@/components/common/action-confirm-dialog";
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
  initialValues?: Partial<BroadcastFormValues> | null;
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

function CreateBroadcastDialogContent({
  initialValues,
  onOpenChange,
  open,
}: CreateBroadcastDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const createMutation = useCreateBroadcastMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingPublishValues, setPendingPublishValues] =
    useState<BroadcastFormValues | null>(null);

  const form = useForm<BroadcastFormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...(initialValues ?? {}),
    },
    resolver: zodResolver(broadcastFormSchema),
  });

  function handleClose(next: boolean) {
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

      setPendingPublishValues(null);
      handleClose(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("state.error", { defaultValue: "An error occurred" }),
      );
    }
  }

  return (
    <>
      <Dialog onOpenChange={handleClose} open={open}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("adminBroadcasts.dialog.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminBroadcasts.dialog.createDescription")}
            </DialogDescription>
          </DialogHeader>

          {submitError ? (
            <div className="px-6 py-1">
              <InlineErrorAlert>{submitError}</InlineErrorAlert>
            </div>
          ) : null}

          <form
            className="flex flex-col gap-4 px-6 py-4"
            id="create-broadcast-form"
            onSubmit={form.handleSubmit((values) => setPendingPublishValues(values))}
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

      {pendingPublishValues ? (
        <ActionConfirmDialog
          action={t("adminBroadcasts.actions.publishBroadcast")}
          cancelLabel={t("actions.cancel")}
          description={t("adminBroadcasts.dialog.publishConfirmDescription")}
          disabled={createMutation.isPending}
          icon={Send}
          iconVariant="info-solid"
          keepOpenOnConfirm
          onConfirm={() => void submitPayload(pendingPublishValues, false)}
          onOpenChange={(next) => {
            if (!next) setPendingPublishValues(null);
          }}
          open={Boolean(pendingPublishValues)}
          title={t("adminBroadcasts.dialog.publishConfirmTitle", {
            audience: t(`adminBroadcasts.audience.${pendingPublishValues.target_audience}`, {
              defaultValue: pendingPublishValues.target_audience,
            }),
          })}
          variant="info-solid"
        />
      ) : null}
    </>
  );
}

export function CreateBroadcastDialog(props: CreateBroadcastDialogProps) {
  return (
    <CreateBroadcastDialogContent
      {...props}
      key={props.open ? (props.initialValues?.title ?? "new") : "closed"}
    />
  );
}
