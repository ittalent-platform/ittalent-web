import { useId } from "react";
import { useTranslation } from "react-i18next";

import type { PlatformOverviewResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { SectionCard } from "@/components/common/section-card";
import { ADMIN_USERS_PATH } from "@/config/routes";
import { formatCount, formatShortDay } from "@/lib/dashboard-format";

import { LINE_CHART as C } from "./admin-dashboard.constants";

const TICKS = 2;
const NICE_STEPS = [1, 2, 4, 6, 8, 10] as const;
const MIN_TOP = 2;
const DECIMALS = 1;
const TICK_LABEL_Y = 4;
const PILL_TEXT_Y = 14;
const HALF = 2;
const AREA_TOP_OPACITY = 0.28;
const AREA_BOTTOM_OPACITY = 0.02;
const LINE_WIDTH = 2.2;
const DOT_WIDTH = 2;
const SHORT_WEEKS = 1;

function niceTop(max: number): number {
  if (max <= MIN_TOP) return MIN_TOP;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return (NICE_STEPS.find((step) => step * magnitude >= max) ?? NICE_STEPS[NICE_STEPS.length - 1] ?? 1) * magnitude;
}

/** New accounts in each of the last eight weeks (Monday to Sunday), the current week last and marked "now". */
export function NewAccountsCard({ data }: { data: PlatformOverviewResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const gradientId = `new-accounts-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const weeks = data.accounts.newPerWeek;
  const top = niceTop(Math.max(...weeks.map((week) => week.count)));
  const yOf = (value: number) => C.baseline - (value / top) * C.plotHeight;
  const step = weeks.length > SHORT_WEEKS ? (C.plotRight - C.left) / (weeks.length - 1) : 0;
  const points = weeks.map((week, index) => ({ ...week, x: C.left + index * step, y: yOf(week.count) }));
  const fmt = (value: number) => value.toFixed(DECIMALS);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${fmt(point.x)},${fmt(point.y)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const area = last && first ? `${line} L${fmt(last.x)},${C.baseline} L${fmt(first.x)},${C.baseline} Z` : "";

  return (
    <SectionCard
      actions={<CardLink to={ADMIN_USERS_PATH}>{t("adminDashboard.newAccounts.open")}</CardLink>}
      description={t("adminDashboard.newAccounts.subtitle", { count: weeks.length })}
      id="overview-new-accounts"
      title={t("adminDashboard.newAccounts.title")}
    >
      <svg aria-label={t("adminDashboard.newAccounts.ariaLabel")} className="block w-full" role="img" viewBox={`0 0 ${C.width} ${C.height}`}>
        <defs>
          <linearGradient id={gradientId} x1={0} x2={0} y1={0} y2={1}>
            <stop className="[stop-color:var(--brand)]" offset={0} stopOpacity={AREA_TOP_OPACITY} />
            <stop className="[stop-color:var(--brand)]" offset={1} stopOpacity={AREA_BOTTOM_OPACITY} />
          </linearGradient>
        </defs>
        {[0, top / TICKS, top].map((tick) => (
          <g key={tick}>
            <line className="stroke-(--dash-grid)" x1={C.left} x2={C.right} y1={yOf(tick)} y2={yOf(tick)} />
            <text className="fill-(--dash-axis)" fontSize={10.5} textAnchor="end" x={C.tickLabelX} y={yOf(tick) + TICK_LABEL_Y}>
              {formatCount(tick, language)}
            </text>
          </g>
        ))}
        {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
        <path className="fill-none stroke-brand" d={line} strokeLinejoin="round" strokeWidth={LINE_WIDTH} />
        {points.map((point, index) => {
          const current = index === points.length - 1;
          return (
            <g key={point.from}>
              <title>{t("adminDashboard.newAccounts.pointTitle", { count: point.count, day: formatShortDay(point.from, language) })}</title>
              <circle className={current ? "fill-brand stroke-brand" : "fill-card stroke-brand"} cx={point.x} cy={point.y} r={current ? C.lastDotRadius : C.dotRadius} strokeWidth={DOT_WIDTH} />
              <text className="fill-muted-foreground" fontSize={10.5} textAnchor="middle" x={point.x} y={C.labelY}>
                {current ? t("adminDashboard.newAccounts.now") : formatShortDay(point.from, language)}
              </text>
            </g>
          );
        })}
        {last ? (
          <g>
            <rect className="fill-foreground" height={C.pillHeight} rx={C.pillHeight / HALF} width={C.pillWidth} x={last.x - C.pillOffsetX} y={Math.max(0, last.y - C.pillOffsetY)} />
            <text className="fill-background" fontSize={11.5} fontWeight={700} textAnchor="middle" x={last.x - C.pillOffsetX + C.pillWidth / HALF} y={Math.max(0, last.y - C.pillOffsetY) + PILL_TEXT_Y}>
              {t("adminDashboard.newAccounts.pill", { count: last.count })}
            </text>
          </g>
        ) : null}
      </svg>
    </SectionCard>
  );
}
