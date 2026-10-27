import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CompanyDashboardResponse } from "@/api/generated/types.gen";
import { SectionCard } from "@/components/common/section-card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/components/ui/table";
import { formatCount, formatDayRange, formatDecimal } from "@/lib/dashboard-format";

import { DAYS_PER_WEEK, WEEKLY_CHART as C } from "./dashboard.constants";
import { niceTop } from "./dashboard.derive";

const TICKS = 2;
const HATCH_SIZE = 6;
const HATCH_ROTATION = 45;
const HATCH_LINE_WIDTH = 2;
const LABEL_Y_OFFSET = 20;
const TICK_LABEL_X = 22;
const TICK_LABEL_Y = 4;
const VALUE_CENTRE = 2;
const PILL_TEXT_Y = 13;
const AVG_LINE_WIDTH = 1.5;
const AVG_DASH = "4 4";

type Week = CompanyDashboardResponse["weeks"][number];

function barPath(x: number, width: number, top: number): string {
  const radius = Math.min(C.barRadius, C.baseline - top);
  return `M${x},${C.baseline} V${top + radius} Q${x},${top} ${x + radius},${top} H${x + width - radius} Q${x + width},${top} ${x + width},${top + radius} V${C.baseline}Z`;
}

function WeeklyBars({ average, language, label, weeks }: { average: number | null; label: string; language: string; weeks: readonly Week[] }) {
  const { t } = useTranslation();
  const hatchId = `weekly-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const max = Math.max(...weeks.map((week) => week.applications), average ?? 0);
  const top = niceTop(max);
  const plotHeight = C.baseline - C.top;
  const yOf = (value: number) => C.baseline - (value / top) * plotHeight;
  const slot = (C.right - C.left) / weeks.length;
  const barWidth = Math.min(C.barMaxWidth, slot * C.barSlotShare);
  const labelEvery = Math.max(1, Math.ceil(C.minLabelSlot / slot));
  const showValues = slot >= C.minValueSlot;
  const ticks = [0, top / TICKS, top];
  const averageY = average === null ? null : yOf(average);
  // The label sits above its line; near the top of the plot it moves below so it is never cut off.
  const pillY = averageY === null ? 0 : averageY - C.avgPillHeight - C.avgPillGap > 0 ? averageY - C.avgPillHeight - C.avgPillGap : averageY + C.avgPillGap;

  return (
    <svg aria-label={label} className="block w-full" role="img" viewBox={`0 0 ${C.width} ${C.height}`}>
      <defs>
        <pattern height={HATCH_SIZE} id={hatchId} patternTransform={`rotate(${HATCH_ROTATION})`} patternUnits="userSpaceOnUse" width={HATCH_SIZE}>
          <rect className="fill-(--dash-pipe-submitted)" height={HATCH_SIZE} width={HATCH_SIZE} />
          <line className="stroke-brand" strokeWidth={HATCH_LINE_WIDTH} x1={0} x2={0} y1={0} y2={HATCH_SIZE} />
        </pattern>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line className="stroke-(--dash-grid)" x1={C.left} x2={C.right} y1={yOf(tick)} y2={yOf(tick)} />
          <text className="fill-(--dash-axis)" fontSize={11} textAnchor="end" x={TICK_LABEL_X} y={yOf(tick) + TICK_LABEL_Y}>
            {formatCount(tick, language)}
          </text>
        </g>
      ))}
      {weeks.map((week, index) => {
        const x = C.left + slot * index + (slot - barWidth) / 2;
        const centre = x + barWidth / VALUE_CENTRE;
        const y = yOf(week.applications);
        const partial = week.days < DAYS_PER_WEEK;
        return (
          <g key={week.from}>
            {week.applications > 0 ? <path className={partial ? undefined : "fill-brand"} d={barPath(x, barWidth, y)} fill={partial ? `url(#${hatchId})` : undefined} /> : null}
            {showValues ? (
              <text className="fill-foreground" fontSize={12} fontWeight={700} textAnchor="middle" x={centre} y={y - C.valueGap}>
                {formatCount(week.applications, language)}
              </text>
            ) : null}
            {index % labelEvery === 0 ? (
              <text className="fill-muted-foreground" fontSize={11} textAnchor="middle" x={centre} y={C.baseline + LABEL_Y_OFFSET}>
                {formatDayRange(week.from, week.to, language, { spaced: false })}
              </text>
            ) : null}
          </g>
        );
      })}
      {averageY !== null && average !== null ? (
        <g>
          <line className="stroke-foreground" strokeDasharray={AVG_DASH} strokeWidth={AVG_LINE_WIDTH} x1={C.left} x2={C.right} y1={averageY} y2={averageY} />
          <rect className="fill-foreground" height={C.avgPillHeight} rx={C.avgPillHeight / VALUE_CENTRE} width={C.avgPillWidth} x={C.right - C.avgPillWidth} y={pillY} />
          <text className="fill-background" fontSize={11} textAnchor="middle" x={C.right - C.avgPillWidth / VALUE_CENTRE} y={pillY + PILL_TEXT_Y}>
            {t("dashboard.weekly.average", { value: formatDecimal(average, language) })}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

function WeeklyTable({ language, weeks }: { language: string; weeks: readonly Week[] }) {
  const { t } = useTranslation();
  return (
    <Table>
      <caption className="sr-only">{t("dashboard.weekly.title")}</caption>
      <TableHead>
        <TableHeaderRow className="h-9">
          <TableHeaderCell className="px-3 py-2">{t("dashboard.weekly.table.week")}</TableHeaderCell>
          <TableHeaderCell className="px-3 py-2 text-right">{t("dashboard.weekly.table.applications")}</TableHeaderCell>
          <TableHeaderCell className="px-3 py-2 text-right">{t("dashboard.weekly.table.jobs")}</TableHeaderCell>
          <TableHeaderCell className="px-3 py-2 text-right">{t("dashboard.weekly.table.interviews")}</TableHeaderCell>
          <TableHeaderCell className="px-3 py-2 text-right">{t("dashboard.weekly.table.hired")}</TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {weeks.map((week) => (
          <TableRow className="h-10" key={week.from}>
            <TableCell className="px-3 py-2">
              {formatDayRange(week.from, week.to, language)}
              {week.days < DAYS_PER_WEEK ? <span className="ml-2 text-[12px] text-muted-foreground">{t("dashboard.weekly.table.partial", { count: week.days })}</span> : null}
            </TableCell>
            <TableCell className="px-3 py-2 text-right font-bold tabular-nums">{formatCount(week.applications, language)}</TableCell>
            <TableCell className="px-3 py-2 text-right tabular-nums">{formatCount(week.jobsPosted, language)}</TableCell>
            <TableCell className="px-3 py-2 text-right tabular-nums">{formatCount(week.interviews, language)}</TableCell>
            <TableCell className="px-3 py-2 text-right tabular-nums">{formatCount(week.hired, language)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Applications received in each block of seven days from the period's start, as bars (or, on request, a table). */
export function WeeklyApplicationsCard({ data }: { data: CompanyDashboardResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const [asTable, setAsTable] = useState(false);
  const { weeklyAverageApplications, weeks } = data;
  const partial = weeks.find((week) => week.days < DAYS_PER_WEEK);

  return (
    <SectionCard description={t("dashboard.weekly.subtitle")} id="dashboard-weekly" title={t("dashboard.weekly.title")}>
      {asTable ? <WeeklyTable language={language} weeks={weeks} /> : <WeeklyBars average={weeklyAverageApplications} label={t("dashboard.weekly.ariaLabel")} language={language} weeks={weeks} />}
      <p className="m-0 text-[12px] text-(--dash-axis)">
        {!asTable && partial ? `${t("dashboard.weekly.partialNote", { range: formatDayRange(partial.from, partial.to, language) })} ` : ""}
        <button
          aria-pressed={asTable}
          className="cursor-pointer rounded font-semibold text-(--status-neutral-fg) underline underline-offset-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
          onClick={() => setAsTable((previous) => !previous)}
          type="button"
        >
          {asTable ? t("dashboard.weekly.viewChart") : t("dashboard.weekly.viewTable")}
        </button>
      </p>
    </SectionCard>
  );
}
