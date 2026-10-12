import { Mail, MailCheck, MailX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { UserDto } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeIct } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AccountActionError } from "./account-action-error";
import { classifyAccountError } from "./account-error";
import { isValidReason, ReasonField } from "./reason-field";
import { useCancelInvitationMutation, useResendInvitationMutation } from "./users.queries";

export function UserInvitationActions({ onReload, user }: { onReload?: () => void; user: UserDto }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const resend = useResendInvitationMutation();
  const cancel = useCancelInvitationMutation();
  const [dialog, setDialog] = useState<"resend" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<unknown>(null);
  if (user.status !== "invited") return null;

  const invitation = user.invitation;
  const deliveryFailed = invitation?.deliveryStatus === "failed";

  const failureKind = failure ? classifyAccountError(failure) : null;
  const status = invitation?.status ?? "pending";
  const invitationBadge = deliveryFailed
    ? t("adminUsers.invitation.badge.failed")
    : status === "pending" && invitation
      ? t("adminUsers.invitation.badge.pendingExpires", { left: timeLeft(invitation.expiresAt) })
      : t(`adminUsers.invitation.badge.${status}`);

  async function confirm() {
    if (dialog === "cancel" && !isValidReason(reason)) return;
    setFailure(null);
    try {
      if (dialog === "cancel") {
        await cancel.mutateAsync({ id: user.id, body: { reason: reason.trim(), expectedVersion: user.version ?? 0 } });
        showToast({ title: t("adminUsers.invitation.cancelled"), message: t("adminUsers.invitation.cancelSuccess"), tone: "success" });
      } else {
        const response = await resend.mutateAsync(user.id);
        showToast({
          title: t(response.deliveryStatus === "sent" ? "adminUsers.invitation.sent" : "adminUsers.invitation.failed"),
          message: t(response.deliveryStatus === "sent" ? "adminUsers.invitation.resendSuccess" : "adminUsers.form.inviteFailed", { email: user.email }),
          tone: response.deliveryStatus === "sent" ? "success" : "warning",
        });
      }
      setReason("");
      setDialog(null);
    } catch (error) {
      setFailure(error);
    }
  }

  return (
    <>
      <section aria-label={t("adminUsers.invitation.title")} className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border px-5 py-4", deliveryFailed ? "border-(--status-warning-fg)/25 bg-(--status-warning-bg)" : "border-(--status-info-fg)/20 bg-(--status-info-bg)")}>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {deliveryFailed ? <MailX aria-hidden className="size-4 text-(--status-warning-fg)" /> : <Mail aria-hidden className="size-4 text-(--status-info-fg)" />}
            <h2 className="text-[15px] font-bold text-foreground">{t("adminUsers.invitation.title")}</h2>
            <Badge variant={deliveryFailed ? "warning" : invitation?.status === "pending" ? "info" : "neutral"}>{invitationBadge}</Badge>
          </div>
          <p className="wrap-anywhere text-[13.5px] text-foreground">
            {invitation?.sentAt ? t("adminUsers.invitation.sentTo", { date: formatDateTimeIct(invitation.sentAt), email: user.email }) : t("adminUsers.invitation.awaiting")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-10 bg-card px-4 text-[13.5px] font-semibold" onClick={() => setDialog("resend")} type="button" variant="outline">{t("adminUsers.invitation.resend")}</Button>
          {invitation?.status === "pending" ? <Button className="h-10 bg-card px-4 text-[13.5px] font-semibold" onClick={() => setDialog("cancel")} type="button" variant="destructive-outline">{t("adminUsers.table.cancelInvitation")}</Button> : null}
        </div>
      </section>

      <ActionConfirmDialog
        action={t(dialog === "cancel" ? "adminUsers.invitation.confirmCancel" : "adminUsers.table.resendInvitation")}
        cancelLabel={t("actions.cancel")}
        confirmDisabled={dialog === "cancel" && (!isValidReason(reason) || failureKind === "stale")}
        description={t(dialog === "cancel" ? "adminUsers.invitation.cancelDescription" : "adminUsers.invitation.resendDescription", { email: user.email })}
        dirty={dialog === "cancel" && reason.trim() !== ""}
        disabled={cancel.isPending || resend.isPending}
        error={failure ? <AccountActionError kind={failureKind ?? "other"} message={failure instanceof Error ? failure.message : undefined} onReload={onReload ? () => { setFailure(null); setDialog(null); onReload(); } : undefined} onRetry={() => void confirm()} /> : null}
        icon={dialog === "cancel" ? MailX : MailCheck}
        keepOpenOnConfirm
        onConfirm={() => void confirm()}
        onOpenChange={(next) => { if (!next) { setDialog(null); setFailure(null); setReason(""); } }}
        open={dialog !== null}
        title={t(dialog === "cancel" ? "adminUsers.invitation.cancelTitle" : "adminUsers.invitation.resendTitle")}
        variant={dialog === "cancel" ? "destructive-solid" : "info-solid"}
      >
        {dialog === "cancel" ? <ReasonField id="cancel-invitation-reason" label={t("adminUsers.invitation.cancelReason")} onChange={setReason} value={reason} /> : null}
      </ActionConfirmDialog>
    </>
  );
}

/** "23h" or "6d" until the invitation expires. */
function timeLeft(expiresAt: string, now = Date.now()): string {
  const hours = Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 3_600_000));
  return hours < 48 ? `${hours}h` : `${Math.ceil(hours / 24)}d`;
}
