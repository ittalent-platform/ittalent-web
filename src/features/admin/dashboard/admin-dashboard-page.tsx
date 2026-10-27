import { Lock, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { requestStatus } from "@/api/request-error";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { EmptyState } from "@/components/common/empty-state";
import { KpiStrip, type KpiItem } from "@/components/common/kpi-strip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAsOf, formatCount } from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

import { AccountsByRoleCard } from "./accounts-by-role-card";
import { FORBIDDEN_STATUS } from "./admin-dashboard.constants";
import { usePlatformOverview } from "./admin-dashboard.queries";
import { NewAccountsCard } from "./new-accounts-card";
import { WaitingForReviewCard } from "./waiting-for-review-card";

/** System admin overview: how big the platform is and what waits for a decision. Never any company's hiring data. */
export function AdminDashboardPage() {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const overview = usePlatformOverview();
  const data = overview.data;
  const asOf = data ? formatAsOf(data.asOf, language) : null;

  const items: KpiItem[] = data
    ? [
        {
          key: "accounts",
          label: t("adminDashboard.kpi.accounts"),
          note: t("adminDashboard.kpi.newInLast30Days", { count: data.accounts.newInLast30Days, formatted: formatCount(data.accounts.newInLast30Days, language) }),
          trend: data.accounts.newPerWeek.map((week) => week.count),
          value: formatCount(data.accounts.total, language),
        },
        {
          key: "companies",
          label: t("adminDashboard.kpi.activeCompanies"),
          note: t("adminDashboard.kpi.approved", { approved: formatCount(data.companies.approved, language), suspended: formatCount(data.companies.suspended, language) }),
          value: formatCount(data.companies.active, language),
        },
        {
          key: "waiting",
          label: t("adminDashboard.kpi.waiting"),
          note: data.companies.oldestWaitingDays === null ? t("adminDashboard.kpi.nothingWaiting") : t("adminDashboard.kpi.oldestWaiting", { count: data.companies.oldestWaitingDays }),
          value: formatCount(data.companies.waitingForReview, language),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-[18px] leading-[1.2]">
      <AdminPageHeader
        actions={
          <Button aria-label={t("dashboard.refresh")} className="size-11" disabled={overview.isFetching} onClick={() => void overview.refetch()} shape="xl" title={t("dashboard.refresh")} variant="outline">
            <RefreshCw className={cn("size-4", overview.isFetching && "animate-spin")} />
          </Button>
        }
        description={asOf ? t("adminDashboard.asOf", { date: asOf.date, time: asOf.time }) : undefined}
        title={t("adminDashboard.title")}
      />

      {overview.isError ? (
        <div className="surface-card" role="alert">
          {requestStatus(overview.error) === FORBIDDEN_STATUS ? (
            <EmptyState description={t("adminDashboard.states.noAccess.body")} icon={Lock} title={t("adminDashboard.states.noAccess.title")} />
          ) : (
            <EmptyState
              action={{ label: t("dashboard.states.error.retry"), onClick: () => void overview.refetch() }}
              description={t("dashboard.states.error.body")}
              icon={RefreshCw}
              title={t("adminDashboard.states.error.title")}
              tone="danger"
            />
          )}
        </div>
      ) : !data ? (
        <div aria-busy="true" aria-label={t("dashboard.states.loading")} className="flex flex-col gap-[18px]" role="status">
          <Skeleton className="h-[112px] rounded-2xl" />
          <div className="grid gap-[18px] lg:grid-cols-[1.55fr_1fr]">
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
          <Skeleton className="h-[220px] rounded-2xl" />
        </div>
      ) : (
        <>
          {overview.isFetching ? (
            <p className="surface-card m-0 flex items-center gap-2.5 px-4 py-3 text-[13.5px] text-(--status-neutral-fg)" role="status">
              <RefreshCw aria-hidden className="size-4 shrink-0 animate-spin" />
              {t("dashboard.states.updating", { time: asOf?.time ?? "" })}
            </p>
          ) : null}
          <KpiStrip items={items} label={t("adminDashboard.kpi.label")} />
          <div className="grid gap-[18px] lg:grid-cols-[1.55fr_1fr]">
            <NewAccountsCard data={data} />
            <AccountsByRoleCard data={data} />
          </div>
          <WaitingForReviewCard data={data} />
        </>
      )}
    </div>
  );
}
