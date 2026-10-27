import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { ChartLegend, type LegendRow } from "@/components/common/chart-legend";
import { RingChart } from "@/components/common/ring-chart";
import { SectionCard } from "@/components/common/section-card";
import { RECRUITER_INTERVIEWS_PATH } from "@/config/routes";
import { formatCount, percentOf } from "@/lib/dashboard-format";

import { INTERVIEW_STATUS_ROWS, RING_SIZE } from "./dashboard.constants";

/** The period's interviews by the status they have now: scheduled, completed, new time requested, no-show, cancelled. */
export function InterviewStatusCard({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { interviewStatuses, summary } = data;
  const total = summary.interviews;
  const name = (key: string) => t(`dashboard.interviewStatus.status.${key}`);
  const rows: LegendRow[] = INTERVIEW_STATUS_ROWS.map((row) => ({
    count: interviewStatuses[row.key],
    key: row.key,
    label: name(row.key),
    percent: percentOf(interviewStatuses[row.key], total),
    tone: row.tone,
  }));

  return (
    <SectionCard
      actions={<CardLink to={RECRUITER_INTERVIEWS_PATH}>{t("dashboard.interviewStatus.open")}</CardLink>}
      description={t("dashboard.interviewStatus.subtitle")}
      id="dashboard-interview-status"
      title={t("dashboard.interviewStatus.title")}
    >
      <div className="flex flex-wrap items-center gap-x-[26px] gap-y-4">
        <RingChart
          ariaLabel={t("dashboard.interviewStatus.ariaLabel")}
          segments={INTERVIEW_STATUS_ROWS.map((row) => ({
            key: row.key,
            label: `${name(row.key)}: ${interviewStatuses[row.key]}`,
            tone: row.tone,
            value: interviewStatuses[row.key],
          }))}
          size={RING_SIZE.donut}
        >
          <span className="itt-display text-[30px] leading-none font-semibold tabular-nums">{formatCount(total, language)}</span>
          <span className="max-w-[104px] text-center text-[12px] text-muted-foreground">{t("dashboard.interviewStatus.unit", { count: total })}</span>
        </RingChart>
        <div className="min-w-[200px] grow">
          <ChartLegend language={language} rows={rows} />
        </div>
      </div>
      <p className="m-0 text-[12px] text-(--dash-axis)">
        {total > 0 ? `${t("dashboard.interviewStatus.completedShare", { percent: percentOf(interviewStatuses.completed, total) })} · ` : ""}
        {t("dashboard.interviewStatus.note")}
      </p>
    </SectionCard>
  );
}
