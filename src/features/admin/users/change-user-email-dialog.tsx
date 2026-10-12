import { Send, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { UserDto } from "@/api/generated/types.gen";
import { ActionConfirmDialog, DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { UserDialogHeader } from "./user-dialog-header";
import { useRequestEmailChangeMutation } from "./users.queries";
import { HTTP_CONFLICT } from "@/api/http-status";

export function ChangeUserEmailDialog({ onOpenChange, open, user }: { onOpenChange: (open: boolean) => void; open: boolean; user: UserDto }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const mutation = useRequestEmailChangeMutation();
  const [email, setEmail] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const invalid = !email.trim() || email.trim().toLowerCase() === user.email.toLowerCase();

  function close() {
    setEmail("");
    setFailure(null);
    setConfirmDiscard(false);
    onOpenChange(false);
  }

  function requestClose() {
    if (mutation.isPending) return;
    if (email.trim()) setConfirmDiscard(true);
    else close();
  }

  async function confirm() {
    if (invalid) return;
    setFailure(null);
    try {
      const result = await mutation.mutateAsync({ id: user.id, body: { newEmail: email.trim().toLowerCase(), expectedVersion: user.version ?? 0 } });
      const deliveryFailed = Boolean(result && typeof result === "object" && "deliveryStatus" in result && result.deliveryStatus === "failed");
      showToast({
        title: t("adminUsers.emailChange.requested"),
        message: t(deliveryFailed ? "adminUsers.emailChange.deliveryFailed" : "adminUsers.emailChange.sent", { email }),
        tone: deliveryFailed ? "warning" : "success",
      });
      close();
    } catch (error) {
      setFailure((error as { status?: number }).status === HTTP_CONFLICT ? t("adminUsers.statusActions.conflict") : error instanceof Error ? error.message : t("state.error"));
    }
  }

  return (
    <>
      <Dialog onOpenChange={(next) => { if (!next) requestClose(); }} open={open}>
        <DialogContent className="max-h-[92vh] max-w-[560px] gap-0 overflow-hidden rounded-2xl p-0">
          <UserDialogHeader title={t("adminUsers.emailChange.title")} user={user} />
          <form className="flex flex-col gap-5 px-6 py-5" id="change-email-form" noValidate onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
            {failure ? <InlineBanner tone="error">{failure}</InlineBanner> : null}
            <FormField htmlFor="current-user-email" label={t("adminUsers.emailChange.current")}>
              <Input aria-readonly className="truncate border-border bg-muted text-foreground" id="current-user-email" readOnly type="email" value={user.email} />
            </FormField>
            <FormField hint={t("adminUsers.emailChange.hint")} htmlFor="new-user-email" label={t("adminUsers.emailChange.newEmail")} required>
              <Input id="new-user-email" onChange={(event) => setEmail(event.target.value)} placeholder={t("adminUsers.form.emailPlaceholder")} type="email" value={email} />
            </FormField>
          </form>
          <DialogFooter>
            <Button className={DIALOG_BUTTON_CLASS} disabled={mutation.isPending} onClick={requestClose} shape="default" type="button" variant="outline">{t("actions.cancel")}</Button>
            <Button className={DIALOG_BUTTON_CLASS} disabled={mutation.isPending || invalid} form="change-email-form" shape="default" type="submit">
              <Send aria-hidden className="size-4" />
              {mutation.isPending ? t("adminUsers.emailChange.sending") : t("adminUsers.emailChange.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ActionConfirmDialog
        action={t("adminUsers.form.discard")}
        cancelLabel={t("adminUsers.form.keepEditing")}
        description={t("confirmDialog.discardDescription")}
        icon={TriangleAlert}
        onConfirm={close}
        onOpenChange={setConfirmDiscard}
        open={confirmDiscard}
        title={t("adminUsers.form.discardEditTitle")}
        variant="destructive-solid"
      />
    </>
  );
}
