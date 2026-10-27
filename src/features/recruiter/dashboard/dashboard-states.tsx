import { Ban, Info, Lock, RefreshCw, TriangleAlert, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { requestCode, requestStatus } from "@/api/request-error";
import { Callout } from "@/components/common/callout";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { COMPANY_NOT_ACTIVE_CODE, FORBIDDEN_STATUS, NOT_A_MEMBER_CODE } from "./dashboard.constants";
import type { PeriodNotice } from "./dashboard.period";

const CARD_FRAME = "surface-card";

/** Shapes only, so the page does not jump when the numbers arrive; no number is shown until the whole set is here. */
export function DashboardSkeleton() {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" aria-label={t("dashboard.states.loading")} className="flex flex-col gap-[18px]" role="status">
      <div className={`${CARD_FRAME} grid grid-cols-1 gap-6 p-[22px] sm:grid-cols-2 lg:grid-cols-4`}>
        {Array.from({ length: 4 }, (_unused, index) => (
          <div className="flex flex-col gap-3" key={index}>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[200px] rounded-2xl" />
      <div className="grid gap-[18px] lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}

/** One message for the whole dashboard: nothing partial is shown, so numbers from different moments never mix. */
export function DashboardFailure({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  const forbidden = requestStatus(error) === FORBIDDEN_STATUS;
  const code = requestCode(error);

  if (forbidden && code === NOT_A_MEMBER_CODE) {
    return (
      <div className={CARD_FRAME}>
        <EmptyState description={t("dashboard.states.notMember.body")} icon={Users} title={t("dashboard.states.notMember.title")} />
      </div>
    );
  }
  if (forbidden && code === COMPANY_NOT_ACTIVE_CODE) {
    return (
      <div className={CARD_FRAME}>
        <EmptyState description={t("dashboard.states.notActive.body")} icon={Ban} title={t("dashboard.states.notActive.title")} tone="warning" />
      </div>
    );
  }
  if (forbidden) {
    return (
      <div className={CARD_FRAME}>
        <EmptyState description={t("dashboard.states.noAccess.body")} icon={Lock} title={t("dashboard.states.noAccess.title")} />
      </div>
    );
  }
  return (
    <div className={CARD_FRAME} role="alert">
      <EmptyState
        action={{ label: t("dashboard.states.error.retry"), onClick: onRetry }}
        description={t("dashboard.states.error.body")}
        icon={RefreshCw}
        title={t("dashboard.states.error.title")}
        tone="danger"
      />
    </div>
  );
}

/** What a shared link asked for that the page cannot apply; the default period is shown instead. */
export function PeriodNoticeCallout({ company, notice }: { company?: string; notice: PeriodNotice }) {
  const { t } = useTranslation();
  if (notice === "company") {
    return company ? (
      <p className="m-0 flex items-start gap-2 text-[13px] text-muted-foreground" role="status">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t("dashboard.notices.company", { company })}
      </p>
    ) : null;
  }
  return (
    <Callout icon={TriangleAlert} role="status" title={t(`dashboard.notices.${notice}.title`)} tone="warning">
      {t(`dashboard.notices.${notice}.body`)}
    </Callout>
  );
}

/** Old numbers stay on screen, labelled with their time, until the new set is complete. */
export function UpdatingNote({ range, time }: { range: string; time: string }) {
  const { t } = useTranslation();
  return (
    <p className={`${CARD_FRAME} m-0 flex items-center gap-2.5 px-4 py-3 text-[13.5px] text-(--status-neutral-fg)`} role="status">
      <RefreshCw aria-hidden className="size-4 shrink-0 animate-spin" />
      {t("dashboard.states.updatingPeriod", { range, time })}
    </p>
  );
}

/** A period in which nothing happened still shows real zeros, and says why in a sentence. */
export function EmptyPeriodNote({ future, range }: { future: boolean; range: string }) {
  const { t } = useTranslation();
  return (
    <p className="m-0 flex items-start gap-2 text-[13px] text-muted-foreground" role="status">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      {future ? t("dashboard.notices.future") : t("dashboard.notices.empty", { range })}
    </p>
  );
}
