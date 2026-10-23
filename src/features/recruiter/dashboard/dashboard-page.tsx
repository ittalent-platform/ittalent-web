import { Building2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AdminPageHeader } from "@/components/common/admin-page-header";
import { Button } from "@/components/ui/button";
import { formatAsOf, formatDayRange } from "@/lib/dashboard-format";
import { ictDayKey } from "@/lib/format";
import { cn } from "@/lib/utils";

import { DashboardKpis } from "./dashboard-kpis";
import { DashboardFailure, DashboardSkeleton, EmptyPeriodNote, PeriodNoticeCallout, UpdatingNote } from "./dashboard-states";
import { isEmptyPeriod } from "./dashboard.derive";
import { isFuturePeriod, presetWindow, todayInVietnam } from "./dashboard.period";
import { InterviewStatusCard } from "./interview-status-card";
import { InterviewsHeatmapCard } from "./interviews-heatmap-card";
import { JobStatusCard } from "./job-status-card";
import { PeriodMenu } from "./period-menu";
import { PipelineCard } from "./pipeline-card";
import { TopJobsCard } from "./top-jobs-card";
import { useCompanyDashboard } from "./dashboard.queries";
import { useDashboardPeriod } from "./use-dashboard-period";
import { WeeklyApplicationsCard } from "./weekly-applications-card";

/** Company dashboard (HR and enterprise admin): the numbers of the caller's own company for a chosen period. */
export function DashboardPage() {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { query, selectCustom, selectPreset, selection } = useDashboardPeriod();
  const dashboard = useCompanyDashboard(query);
  const data = dashboard.data;

  // The server's clock decides what "today" is; the browser's only stands in until the first answer arrives.
  const today = data ? ictDayKey(new Date(data.asOf)) : todayInVietnam();
  // Numbers kept from the previous period (see useCompanyDashboard) must not name the period: the button follows the address at once.
  const shown =
    (dashboard.isPlaceholderData ? undefined : data?.period) ??
    (selection.range === "custom" && selection.from && selection.to
      ? { from: selection.from, range: selection.range, to: selection.to }
      : { ...presetWindow(selection.range === "custom" ? "last_30_days" : selection.range, today), range: selection.range });
  const asOf = data ? formatAsOf(data.asOf, language) : null;
  const failed = dashboard.isError;

  return (
    <div className="flex flex-col gap-[18px] leading-[1.2]">
      <AdminPageHeader
        actions={
          <>
            <PeriodMenu current={shown} onCustom={selectCustom} onPreset={selectPreset} today={today} />
            <Button aria-label={t("dashboard.refresh")} className="size-11" disabled={dashboard.isFetching} onClick={() => void dashboard.refetch()} shape="xl" title={t("dashboard.refresh")} variant="outline">
              <RefreshCw className={cn("size-4", dashboard.isFetching && "animate-spin")} />
            </Button>
          </>
        }
        description={asOf ? t("dashboard.asOf", { date: asOf.date, time: asOf.time }) : undefined}
        title={t("dashboard.title")}
        titleAddon={
          data ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--dash-track) px-3 py-1 text-[12.5px] font-semibold text-(--status-neutral-fg)">
              <Building2 aria-hidden className="size-3.5" />
              {t("dashboard.scope", { company: data.company.name })}
            </span>
          ) : undefined
        }
      />

      {selection.notice ? <PeriodNoticeCallout company={data?.company.name} notice={selection.notice} /> : null}

      {failed ? (
        <DashboardFailure error={dashboard.error} onRetry={() => void dashboard.refetch()} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {dashboard.isFetching ? <UpdatingNote time={asOf?.time ?? ""} /> : null}
          <DashboardKpis data={data} />
          {isEmptyPeriod(data) ? (
            <EmptyPeriodNote future={isFuturePeriod(data.period.from, today)} range={formatDayRange(data.period.from, data.period.to, language)} />
          ) : (
            <>
              <PipelineCard data={data} />
              <div className="grid gap-[18px] lg:grid-cols-[1.15fr_1fr]">
                <WeeklyApplicationsCard data={data} />
                <InterviewsHeatmapCard data={data} />
              </div>
              <div className="grid gap-[18px] lg:grid-cols-2">
                <InterviewStatusCard data={data} />
                <JobStatusCard data={data} />
              </div>
              <TopJobsCard data={data} />
            </>
          )}
        </>
      )}
    </div>
  );
}
