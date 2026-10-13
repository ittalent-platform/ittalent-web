import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Timeline, type TimelineEntry } from "@/components/common/timeline";
import { useSession } from "@/auth/use-session";

import { HISTORY_TONE, type InterviewDetail } from "./interviews.constants";
import { formatDateTime } from "./interviews.format";

/**
 * Status history, newest first. The API names who made a change by id only, so a name is shown for
 * the signed-in recruiter's own changes and left out for a colleague's.
 */
export function InterviewHistory({ history }: { history: InterviewDetail["statusHistory"] }) {
  const { t, i18n } = useTranslation();
  const session = useSession();
  const me = session.data?.user;

  const entries = useMemo<TimelineEntry[]>(
    () =>
      history
        .map((entry) => ({
          atIso: entry.changedAt,
          by: me && entry.changedBy === me.id ? (me.fullName ?? me.email) : undefined,
          detail: entry.note ?? undefined,
          label: t(`interviews.status.${entry.status}`),
          tone: HISTORY_TONE[entry.status],
        }))
        .reverse(),
    [history, me, t],
  );

  return <Timeline entries={entries} formatDate={(iso) => formatDateTime(iso, i18n.language)} showCount={false} title={t("interviews.detail.history")} />;
}
