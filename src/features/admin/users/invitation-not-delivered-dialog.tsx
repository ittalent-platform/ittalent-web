import { MailX, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";
import { adminUserPath } from "@/config/routes";

import { useResendInvitationMutation } from "./users.queries";

/** Shown after an account was created but its invitation email failed: resend, open the account, or close. */
export function InvitationNotDeliveredDialog({ onOpenChange, open, user }: { onOpenChange: (open: boolean) => void; open: boolean; user: { email: string; id: string } }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const resend = useResendInvitationMutation();
  const [failure, setFailure] = useState<string | null>(null);

  async function resendInvitation() {
    setFailure(null);
    try {
      const response = await resend.mutateAsync(user.id);
      if (response.deliveryStatus !== "sent") throw new Error(t("adminUsers.form.inviteFailed", { email: user.email }));
      showToast({ message: t("adminUsers.invitation.resendSuccess", { email: user.email }), title: t("adminUsers.invitation.sent"), tone: "success" });
      onOpenChange(false);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : t("adminUsers.form.createFailed"));
    }
  }

  return (
    <ActionConfirmDialog
      action={resend.isPending ? t("adminUsers.invitation.sending") : <><Send aria-hidden className="size-4" />{t("adminUsers.table.resendInvitation")}</>}
      cancel={<Link to={adminUserPath(user.id)}>{t("adminUsers.form.openAccount")}</Link>}
      closeButton
      description={<><strong className="mb-2 block wrap-anywhere font-semibold text-foreground">{user.email}</strong>{t("adminUsers.form.undeliveredBody")}</>}
      disabled={resend.isPending}
      error={failure}
      icon={MailX}
      iconVariant="info-solid"
      keepOpenOnConfirm
      onConfirm={() => void resendInvitation()}
      onOpenChange={(next) => { if (!next) setFailure(null); onOpenChange(next); }}
      open={open}
      title={t("adminUsers.form.undeliveredTitle")}
      variant="default"
    />
  );
}
