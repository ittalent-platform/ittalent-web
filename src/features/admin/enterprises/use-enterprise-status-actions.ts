import { useTranslation } from "react-i18next";

import { useToast } from "@/components/toast/toast-provider";

import { useDeleteEnterpriseMutation, useUpdateEnterpriseStatusMutation } from "./enterprises.queries";

/** Suspend / activate / delete one enterprise with the matching toast; failures are reported by toast, not thrown. */
export function useEnterpriseStatusActions(enterprise: { id: string; name: string } | null) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const updateStatus = useUpdateEnterpriseStatusMutation(enterprise?.id ?? "");
  const remove = useDeleteEnterpriseMutation(enterprise?.id ?? "");

  async function attempt(action: () => Promise<unknown>, done: { tone: "success" | "warning"; key: string }, failKey: string) {
    if (!enterprise) return;
    try {
      await action();
      showToast({ tone: done.tone, title: t(`adminEnterprises.toast.${done.key}Title`), message: t(`adminEnterprises.toast.${done.key}`, { name: enterprise.name }) });
    } catch {
      showToast({ tone: "error", title: t(`adminEnterprises.toast.${failKey}Title`), message: t(`adminEnterprises.toast.${failKey}`) });
    }
  }

  return {
    activate: (reason?: string) => attempt(() => updateStatus.mutateAsync({ status: "active", reason }), { key: "activated", tone: "success" }, "activateFailed"),
    remove: () => attempt(() => remove.mutateAsync(), { key: "deleted", tone: "success" }, "deleteFailed"),
    suspend: (reason: string) => attempt(() => updateStatus.mutateAsync({ status: "suspended", reason }), { key: "suspended", tone: "warning" }, "suspendFailed"),
  };
}
