import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { SectionCard } from "@/components/common/section-card";
import { RECRUITER_APPLICATIONS_PATH } from "@/config/routes";
import { formatCount, formatDayRange, percentOf } from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

import { CLOSED_API_STATUSES, MIN_LABEL_SHARE } from "./dashboard.constants";
import { applicationsListPath, pipelineModel } from "./dashboard.derive";

const PERCENT = 100;
const WIDTH_DECIMALS = 2;

/** Where the period's applications stand now: one bar split by current status, and a legend that opens the matching list. */
export function PipelineCard({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { period, summary } = data;
  const total = summary.applicationsReceived;
  const model = pipelineModel(data.applicationStatuses, total);
  const range = formatDayRange(period.from, period.to, language);
  const link = (statuses: readonly string[]) => applicationsListPath(statuses, period);
  const statusName = (key: string) => t(`dashboard.pipeline.status.${key}`);
  const legendCell = "flex min-w-0 flex-col gap-1 rounded-lg p-1 -m-1 transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none";

  return (
    <SectionCard
      actions={
        <div className="flex shrink-0 flex-wrap items-end justify-end gap-x-7 gap-y-2 text-right">
          <div>
            <div className="itt-display text-[22px] leading-tight font-semibold tabular-nums">{formatCount(model.inProgress, language)}</div>
            <div className="text-[12px] text-muted-foreground">{t("dashboard.pipeline.inProgress")}</div>
          </div>
          <div>
            <div className="itt-display text-[22px] leading-tight font-semibold text-(--dash-pipe-hired) tabular-nums">{formatCount(model.hired, language)}</div>
            <div className="text-[12px] text-muted-foreground">{t("dashboard.pipeline.hired")}</div>
          </div>
          <CardLink to={RECRUITER_APPLICATIONS_PATH}>{t("dashboard.pipeline.open")}</CardLink>
        </div>
      }
      description={t("dashboard.pipeline.subtitle", { range })}
      id="dashboard-pipeline"
      title={<span className="text-[13px] font-semibold text-(--status-neutral-fg)">{t("dashboard.pipeline.title")}</span>}
    >
      <div aria-label={t("dashboard.pipeline.ariaLabel")} className="flex h-10 gap-0.5 overflow-hidden rounded-[10px]" role="img">
        {model.segments.map((segment) =>
          segment.count > 0 ? (
            <span
              className={cn("flex items-center justify-center text-[13px] font-bold", segment.bg, segment.ink)}
              key={segment.key}
              style={{ width: `${(segment.share * PERCENT).toFixed(WIDTH_DECIMALS)}%` }} /* dynamic: runtime value */
              title={t("dashboard.pipeline.segmentTitle", { count: segment.count, status: statusName(segment.key) })}
            >
              {segment.share >= MIN_LABEL_SHARE ? formatCount(segment.count, language) : null}
            </span>
          ) : null,
        )}
        {model.closed > 0 ? (
          <span
            className="dash-stripe flex items-center justify-center text-[13px] font-bold text-(--status-neutral-fg)"
            style={{ width: `${(model.closedShare * PERCENT).toFixed(WIDTH_DECIMALS)}%` }} /* dynamic: runtime value */
            title={t("dashboard.pipeline.segmentTitle", { count: model.closed, status: statusName("closed") })}
          >
            {model.closedShare >= MIN_LABEL_SHARE ? formatCount(model.closed, language) : null}
          </span>
        ) : null}
        {total === 0 ? <span className="h-full grow bg-(--dash-track)" /> : null}
      </div>

      <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-4 p-0 sm:grid-cols-3 lg:grid-cols-6">
        {model.segments.map((segment) => (
          <li className="min-w-0" key={segment.key}>
            <Link className={legendCell} to={link([segment.apiStatus])}>
              <span className="flex items-center gap-[7px] text-[12.5px] whitespace-nowrap text-(--status-neutral-fg)">
                <span aria-hidden className={cn("size-2.5 rounded-[3px]", segment.bg)} />
                {statusName(segment.key)}
              </span>
              <span className="text-[15px] font-bold tabular-nums">
                {formatCount(segment.count, language)}{" "}
                <span className="text-[12.5px] font-medium text-(--dash-axis)">{percentOf(segment.count, total)}%</span>
              </span>
            </Link>
          </li>
        ))}
        <li className="min-w-0">
          <Link className={legendCell} to={link(CLOSED_API_STATUSES)}>
            <span className="flex items-center gap-[7px] text-[12.5px] whitespace-nowrap text-(--status-neutral-fg)">
              <span aria-hidden className="dash-stripe size-2.5 rounded-[3px]" />
              {statusName("closed")}
            </span>
            <span className="text-[15px] font-bold tabular-nums">
              {formatCount(model.closed, language)}{" "}
              <span className="text-[12.5px] font-medium text-(--dash-axis)">
                {t("dashboard.pipeline.closedDetail", {
                  positionFilled: data.applicationStatuses.positionFilled,
                  rejected: data.applicationStatuses.rejected,
                  withdrawn: data.applicationStatuses.withdrawn,
                })}
              </span>
            </span>
          </Link>
        </li>
      </ul>
    </SectionCard>
  );
}
