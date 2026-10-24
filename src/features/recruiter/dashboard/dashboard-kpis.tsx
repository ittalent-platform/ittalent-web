import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { KpiStrip, type KpiItem } from "@/components/common/kpi-strip";
import { formatCount, formatDecimal } from "@/lib/dashboard-format";

/** Jobs posted, applications received, interviews and hires for the period, each with its weekly trend. */
export function DashboardKpis({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { summary, weeks } = data;
  const none = t("dashboard.kpi.none");

  const items: KpiItem[] = [
    {
      hint: t("dashboard.kpi.hints.jobs"),
      key: "jobs",
      label: t("dashboard.kpi.jobsPosted"),
      note: summary.jobsPosted > 0 ? t("dashboard.kpi.jobsOpen", { count: summary.jobsOpen, formatted: formatCount(summary.jobsOpen, language) }) : none,
      trend: weeks.map((week) => week.jobsPosted),
      value: formatCount(summary.jobsPosted, language),
    },
    {
      key: "applications",
      label: t("dashboard.kpi.applications"),
      note: summary.applicationsReceived > 0 ? t("dashboard.kpi.averagePerDay", { value: formatDecimal(summary.averageApplicationsPerDay, language) }) : none,
      trend: weeks.map((week) => week.applications),
      value: formatCount(summary.applicationsReceived, language),
    },
    {
      key: "interviews",
      label: t("dashboard.kpi.interviews"),
      note: summary.interviews > 0 ? t("dashboard.kpi.interviewsCompleted", { count: summary.interviewsCompleted, formatted: formatCount(summary.interviewsCompleted, language) }) : none,
      trend: weeks.map((week) => week.interviews),
      value: formatCount(summary.interviews, language),
    },
    {
      hint: t("dashboard.kpi.hints.hired"),
      key: "hired",
      label: t("dashboard.kpi.hired"),
      note: summary.hiredPercent === null ? none : t("dashboard.kpi.hiredPercent", { value: formatDecimal(summary.hiredPercent, language) }),
      trend: weeks.map((week) => week.hired),
      value: formatCount(summary.hired, language),
    },
  ];

  return <KpiStrip items={items} label={t("dashboard.kpi.label")} />;
}
