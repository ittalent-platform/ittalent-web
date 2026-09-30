import { useState } from "react";
import { Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { useToast } from "@/components/toast/toast-provider";
import { Textarea } from "@/components/ui/textarea";
import { applicationDisplayId } from "./application-formatters";
import { HTTP_CONFLICT, MAX_REASON_LENGTH } from "./applications.constants";
import { requestStatus, useWithdrawApplications, type WithdrawInput } from "./applications.queries";

export type WithdrawTarget = { id: string; jobTitle: string; companyName: string; version?: number; isReapplication?: boolean };

type WithdrawDialogProps = { targets: WithdrawTarget[]; onOpenChange: (open: boolean) => void; onDone?: (withdrawnIds: string[]) => void };

export function WithdrawApplicationsDialog(props: WithdrawDialogProps) {
  // Mount the form per selection so the reason and any error start empty every time it opens.
  return props.targets.length ? <WithdrawForm key={props.targets.map((target) => target.id).join(",")} {...props} /> : null;
}

/**
 * Confirm dialog for UC-MYAPP-04, used by the detail page (one target, version known), the row menu
 * and the board (one or many targets, versions fetched on confirm). Applications that fail (status
 * changed meanwhile, EX.3 / EX.4) stay listed and unchanged; the ones that succeeded drop out.
 */
function WithdrawForm({ targets, onOpenChange, onDone }: WithdrawDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(targets);
  const mutation = useWithdrawApplications();
  const single = remaining.length === 1 ? remaining[0]! : null;

  async function confirm() {
    const trimmed = reason.trim();
    const inputs: WithdrawInput[] = remaining.map(({ id, version }) => ({ id, ...(version !== undefined ? { expectedVersion: version } : {}), ...(trimmed ? { reason: trimmed } : {}) }));
    try {
      const { failed } = await mutation.mutateAsync(inputs);
      const failedById = new Map(failed.map((item) => [item.id, item.error]));
      const withdrawnIds = remaining.map((target) => target.id).filter((id) => !failedById.has(id));
      if (withdrawnIds.length) {
        showToast({ tone: "success", title: t("applications.toast.withdrawnTitle"), message: withdrawnIds.length === 1 ? t("applications.toast.withdrawnOne", { id: applicationDisplayId(withdrawnIds[0]!) }) : t("applications.toast.withdrawnMany", { count: withdrawnIds.length }) });
        onDone?.(withdrawnIds);
      }
      if (!failed.length) {
        onOpenChange(false);
        return;
      }
      setRemaining(remaining.filter((target) => failedById.has(target.id)));
      const conflict = failed.some((item) => requestStatus(item.error) === HTTP_CONFLICT);
      const reasonText = conflict ? t("applications.withdrawConflict") : t("applications.withdrawFailed");
      setFailure(withdrawnIds.length ? `${t("applications.withdrawPartial", { done: withdrawnIds.length, failed: failed.length })} ${reasonText}` : reasonText);
    } catch {
      setFailure(t("applications.withdrawFailed"));
    }
  }

  const description = single?.isReapplication ? t("applications.withdrawDescriptionReapplied") : t(single ? "applications.withdrawDescriptionOne" : "applications.withdrawDescriptionMany");

  return (
    <ActionConfirmDialog
      action={single ? t("applications.withdraw") : t("applications.withdrawMany", { count: remaining.length })}
      cancelLabel={single ? t("applications.keepApplication") : t("applications.keepApplications")}
      description={
        <>
          {single ? `${applicationDisplayId(single.id)} · ${single.jobTitle} · ${single.companyName}. ` : ""}
          {description}{" "}
          {single?.isReapplication ? null : <strong className="font-semibold">{t("applications.withdrawFinal")}</strong>}
        </>
      }
      disabled={mutation.isPending}
      error={failure}
      icon={Undo2}
      keepOpenOnConfirm
      onConfirm={() => void confirm()}
      onOpenChange={(next) => { if (!next) onOpenChange(false); }}
      open
      title={single ? t("applications.withdrawTitle") : t("applications.withdrawTitleMany", { count: remaining.length })}
      variant="destructive-solid"
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-foreground" htmlFor="withdraw-reason">
        {t("applications.reasonOptional")}
        <Textarea id="withdraw-reason" maxLength={MAX_REASON_LENGTH} onChange={(event) => setReason(event.target.value)} placeholder={t("applications.reasonPlaceholder")} rows={3} value={reason} />
        <span className="text-xs font-normal text-muted-foreground">{t("applications.reasonHint", { max: MAX_REASON_LENGTH })}</span>
      </label>
    </ActionConfirmDialog>
  );
}
