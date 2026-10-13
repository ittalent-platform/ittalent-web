import { useTranslation } from "react-i18next";

import { formatDateTimeIct } from "@/lib/format";

import { HISTORY_TIME_ZONE_LABEL } from "./user-history.constants";
import { historyActorKey } from "./user-display";
import { useUserHistoryQuery } from "./users.queries";

/** Who suspended the account, when and why, from its latest suspension event; null while unknown. */
export function useLatestSuspensionEvent(userId: string, enabled: boolean) {
  const { t } = useTranslation();
  const query = useUserHistoryQuery(userId, enabled, { action: "status_suspended", limit: 1 });
  const item = query.data?.items[0];
  if (!item) return null;
  return {
    actor: item.actorName ?? t(`adminUsers.history.${historyActorKey(item.actorId, userId)}`),
    date: `${formatDateTimeIct(item.occurredAt)} ${HISTORY_TIME_ZONE_LABEL}`,
    reason: item.reason ?? t("adminUsers.suspension.noReason"),
  };
}

/** "Suspended on … by … Reason: …" as one line, or null while unknown. */
export function useLatestSuspension(userId: string, enabled: boolean) {
  const { t } = useTranslation();
  const event = useLatestSuspensionEvent(userId, enabled);
  return event ? t("adminUsers.suspension.summary", event) : null;
}
