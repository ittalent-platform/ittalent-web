import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { SectionCard } from "@/components/common/section-card";
import { RECRUITER_JOB_POSTINGS_PATH, recruiterJobPostingPath } from "@/config/routes";
import { formatCount, formatDayRange } from "@/lib/dashboard-format";

import { DASHBOARD_TOP_JOBS } from "./dashboard.constants";

const PERCENT = 100;

/** The jobs that received the most applications in the period, each with a bar scaled to the busiest one. */
export function TopJobsCard({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { period, topJobs } = data;
  const busiest = Math.max(1, ...topJobs.map((job) => job.applications));
  const head = "pb-2.5 text-[11.5px] font-bold tracking-[0.06em] text-(--slate-faint) uppercase";

  return (
    <SectionCard
      actions={<CardLink to={RECRUITER_JOB_POSTINGS_PATH}>{t("dashboard.topJobs.open")}</CardLink>}
      description={t("dashboard.topJobs.subtitle", { count: DASHBOARD_TOP_JOBS, range: formatDayRange(period.from, period.to, language) })}
      id="dashboard-top-jobs"
      title={t("dashboard.topJobs.title")}
    >
      {topJobs.length === 0 ? (
        <p className="m-0 py-4 text-[13.5px] text-muted-foreground">{t("dashboard.topJobs.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className={`${head} text-left`} scope="col">{t("dashboard.topJobs.columns.job")}</th>
                <th className={`${head} w-[38%] text-left`} scope="col">{t("dashboard.topJobs.columns.applications")}</th>
                <th className={`${head} text-right`} scope="col">{t("dashboard.topJobs.columns.interviews")}</th>
                <th className={`${head} text-right`} scope="col">{t("dashboard.topJobs.columns.hired")}</th>
              </tr>
            </thead>
            <tbody>
              {topJobs.map((job) => (
                <tr className="border-t border-line-muted" key={job.id}>
                  <td className="py-3 pr-3">
                    <Link className="font-semibold text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none" to={recruiterJobPostingPath(job.id)}>
                      {job.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden className="relative h-2 grow rounded bg-(--dash-track)">
                        <span
                          className="absolute inset-y-0 left-0 rounded-r bg-brand"
                          style={{ width: `${Math.round((job.applications / busiest) * PERCENT)}%` }} /* dynamic: runtime value */
                        />
                      </span>
                      <b className="w-[26px] text-right tabular-nums">{formatCount(job.applications, language)}</b>
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums text-(--status-neutral-fg)">{formatCount(job.interviews, language)}</td>
                  <td className={`py-3 text-right tabular-nums ${job.hired === 0 ? "text-(--dash-axis)" : "font-bold text-foreground"}`}>{formatCount(job.hired, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
