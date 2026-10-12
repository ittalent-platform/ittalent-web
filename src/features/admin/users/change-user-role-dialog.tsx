import { Repeat } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { UserDto } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";

import { AccountActionError } from "./account-action-error";
import { BLOCKING_ACCOUNT_ERRORS, classifyAccountError } from "./account-error";
import { isValidReason, ReasonField } from "./reason-field";
import { RoleBadge } from "./user-badges";
import { userShortName } from "./user-display";
import { useUpdateUserRoleMutation } from "./users.queries";

export function ChangeUserRoleDialog({ onOpenChange, onReload, open, user }: { onOpenChange: (open: boolean) => void; onReload?: () => void; open: boolean; user: UserDto }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const mutation = useUpdateUserRoleMutation();
  // Company accounts have exactly two roles, so the new role is always the other one.
  const role = user.role === "recruiter" ? "enterprise_admin" : "recruiter";
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<unknown>(null);

  const failureKind = failure ? classifyAccountError(failure) : null;
  const blocked = failureKind !== null && BLOCKING_ACCOUNT_ERRORS.includes(failureKind);

  async function confirm() {
    if (!isValidReason(reason)) return;
    setFailure(null);
    try {
      await mutation.mutateAsync({ id: user.id, body: { role, reason: reason.trim(), expectedVersion: user.version ?? 0 } });
      showToast({ message: t("adminUsers.roleChange.saved", { name: userShortName(user) }), title: t("adminUsers.roleChange.confirm"), tone: "success" });
      onOpenChange(false);
    } catch (error) {
      setFailure(error);
    }
  }

  const rows = [
    { label: t("adminUsers.roleChange.from"), value: <RoleBadge role={user.role} /> },
    { label: t("adminUsers.roleChange.to"), value: <RoleBadge role={role} /> },
    { label: t("adminUsers.detail.company"), value: <span className="wrap-anywhere font-semibold text-foreground">{user.enterpriseName ?? "—"}</span> },
  ];

  return (
    <ActionConfirmDialog
      action={t("adminUsers.roleChange.confirm")}
      cancelLabel={t("actions.cancel")}
      confirmDisabled={!isValidReason(reason) || blocked}
      description={t("adminUsers.roleChange.description")}
      dirty={reason.trim() !== ""}
      disabled={mutation.isPending}
      error={failure ? <AccountActionError kind={failureKind ?? "other"} message={failure instanceof Error ? failure.message : undefined} onReload={onReload ? () => { setFailure(null); onReload(); } : undefined} onRetry={() => void confirm()} /> : null}
      icon={Repeat}
      iconVariant="info-solid"
      keepOpenOnConfirm
      onConfirm={() => void confirm()}
      onOpenChange={(next) => { if (!next) { setReason(""); setFailure(null); } onOpenChange(next); }}
      open={open}
      title={t("adminUsers.roleChange.title", { name: userShortName(user) })}
      variant="default"
    >
      <div className="flex flex-col gap-4">
        <dl className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-[13.5px]">
          {rows.map((row) => (
            <div className="flex items-center justify-between gap-4" key={row.label}>
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
        <ReasonField id="role-change-reason" label={t("adminUsers.roleChange.reason")} onChange={setReason} placeholder={t("adminUsers.roleChange.reasonPlaceholder")} value={reason} />
      </div>
    </ActionConfirmDialog>
  );
}
