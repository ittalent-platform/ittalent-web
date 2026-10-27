import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { ChartLegend, type LegendRow } from "@/components/common/chart-legend";
import { RingChart } from "@/components/common/ring-chart";
import { SectionCard } from "@/components/common/section-card";
import { RECRUITER_JOB_POSTINGS_PATH } from "@/config/routes";
import { formatCount, formatDayRange, percentOf } from "@/lib/dashboard-format";

import { JOB_STATUS_ROWS, RING_SIZE } from "./dashboard.constants";

/** The jobs created in the period by the status they have now, as a gauge of how many are open. */
export function JobStatusCard({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { jobStatuses, period, summary } = data;
  const total = summary.jobsPosted;
  const name = (key: string) => t(`dashboard.jobStatus.status.${key}`);
  const rows: LegendRow[] = JOB_STATUS_ROWS.map((row) => ({
    count: jobStatuses[row.key],
    key: row.key,
    label: name(row.key),
    percent: percentOf(jobStatuses[row.key], total),
    tone: row.tone,
  }));

  return (
    <SectionCard
      actions={<CardLink to={RECRUITER_JOB_POSTINGS_PATH}>{t("dashboard.jobStatus.open")}</CardLink>}
      description={t("dashboard.jobStatus.subtitle")}
      id="dashboard-job-status"
      title={t("dashboard.jobStatus.title")}
    >
      <div className="flex flex-wrap items-end gap-x-[26px] gap-y-4">
        <RingChart
          ariaLabel={t("dashboard.jobStatus.ariaLabel")}
          half
          segments={JOB_STATUS_ROWS.map((row) => ({
            key: row.key,
            label: `${name(row.key)}: ${jobStatuses[row.key]}`,
            tone: row.tone,
            value: jobStatuses[row.key],
          }))}
          size={RING_SIZE.gauge}
        >
          <span className="itt-display text-[30px] leading-none font-semibold tabular-nums">
            {formatCount(jobStatuses.published, language)}/{formatCount(total, language)}
          </span>
          <span className="text-[12px] text-muted-foreground">{t("dashboard.jobStatus.unit")}</span>
        </RingChart>
        <div className="min-w-[200px] grow">
          <ChartLegend language={language} rows={rows} />
        </div>
      </div>
      <p className="m-0 text-[12px] text-(--dash-axis)">{t("dashboard.jobStatus.note", { range: formatDayRange(period.from, period.to, language) })}</p>
    </SectionCard>
  );
}
