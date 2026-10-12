import { Ban, Check, ShieldAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { UserDto } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { Callout } from "@/components/common/callout";
import { useToast } from "@/components/toast/toast-provider";

import { AccountActionError } from "./account-action-error";
import { BLOCKING_ACCOUNT_ERRORS, classifyAccountError } from "./account-error";
import { isValidReason, ReasonField } from "./reason-field";
import { userShortName } from "./user-display";
import { useEmergencySuspendUserMutation, useUpdateUserStatusMutation } from "./users.queries";

const SUSPENDABLE = ["active"];
const REOPENABLE = ["suspended", "blocked"];

export function SuspendUserDialog({ emergency = false, onOpenChange, onReload, open, user }: {
  emergency?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Refetches the account after a stale-version conflict ("Show latest"). */
  onReload?: () => void;
  open: boolean;
  user: UserDto;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const statusMutation = useUpdateUserStatusMutation();
  const emergencyMutation = useEmergencySuspendUserMutation();
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<unknown>(null);
  const reactivating = REOPENABLE.includes(user.status);
  const allowed = emergency ? user.status === "active" && user.role === "enterprise_admin" : reactivating || SUSPENDABLE.includes(user.status);
  const action = emergency ? t("adminUsers.emergency.confirm") : reactivating ? t("adminUsers.statusActions.reactivateConfirm") : t("adminUsers.suspend.confirm");
  const failureKind = failure ? classifyAccountError(failure) : null;
  const blocked = !allowed || (failureKind !== null && BLOCKING_ACCOUNT_ERRORS.includes(failureKind));

  async function confirm() {
    if (!isValidReason(reason) || !allowed) return;
    setFailure(null);
    try {
      const body = { expectedVersion: user.version ?? 0, reason: reason.trim() };
      if (emergency) {
        await emergencyMutation.mutateAsync({ id: user.id, body });
      } else {
        await statusMutation.mutateAsync({ id: user.id, body: { ...body, status: reactivating ? "active" : "suspended" } });
      }
      showToast({ message: t(reactivating ? "adminUsers.statusActions.reactivated" : "adminUsers.statusActions.suspended", { name: userShortName(user) }), title: action, tone: "success" });
      setReason("");
      onOpenChange(false);
    } catch (error) {
      setFailure(error);
    }
  }

  const company = user.enterpriseName ?? t("adminUsers.detail.company");
  const description = emergency
    ? undefined
    : reactivating ? t(user.emailVerified ? "adminUsers.statusActions.reactivateDescription" : "adminUsers.statusActions.reactivateUnverifiedDescription") : t("adminUsers.suspend.description");

  return (
    <ActionConfirmDialog
      action={action}
      cancelLabel={t("actions.cancel")}
      confirmDisabled={blocked || !isValidReason(reason)}
      description={description}
      dirty={reason.trim() !== ""}
      disabled={statusMutation.isPending || emergencyMutation.isPending}
      error={failure ? <AccountActionError kind={failureKind ?? "other"} message={failure instanceof Error ? failure.message : undefined} onReload={onReload ? () => { setFailure(null); onReload(); } : undefined} onRetry={() => void confirm()} /> : null}
      icon={emergency ? ShieldAlert : reactivating ? Check : Ban}
      keepOpenOnConfirm
      onConfirm={() => void confirm()}
      onOpenChange={(next) => { if (!next) { setFailure(null); setReason(""); } onOpenChange(next); }}
      open={open}
      title={emergency
        ? t("adminUsers.emergency.title", { name: userShortName(user) })
        : reactivating ? t("adminUsers.statusActions.reactivateTitle", { name: userShortName(user) }) : t("adminUsers.suspend.title", { name: userShortName(user) })}
      variant={reactivating ? "success-solid" : "destructive-solid"}
    >
      <div className="flex flex-col gap-4">
        {allowed ? null : <Callout role="alert" title={t("adminUsers.errors.transition.title")} tone="error">{t("adminUsers.statusActions.notAllowed", { status: t(`adminUsers.status.${user.status}`, { defaultValue: user.status }) })}</Callout>}
        {emergency && allowed ? <Callout icon={TriangleAlert} title={t("adminUsers.emergency.calloutTitle", { company })} tone="error">{t("adminUsers.emergency.calloutBody", { company })}</Callout> : null}
        <ReasonField id="user-status-reason" label={t(emergency ? "adminUsers.emergency.reason" : "adminUsers.statusActions.reason")} onChange={setReason} placeholder={t(emergency ? "adminUsers.emergency.reasonPlaceholder" : reactivating ? "adminUsers.statusActions.reactivatePlaceholder" : "adminUsers.statusActions.reasonPlaceholder")} value={reason} />
      </div>
    </ActionConfirmDialog>
  );
}
