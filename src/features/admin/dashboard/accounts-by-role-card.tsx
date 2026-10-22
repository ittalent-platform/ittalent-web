import { useTranslation } from "react-i18next";

import type { PlatformOverviewResponse } from "@/api/generated/types.gen";
import { ChartLegend, type LegendRow } from "@/components/common/chart-legend";
import { RingChart } from "@/components/common/ring-chart";
import { SectionCard } from "@/components/common/section-card";
import { formatCount, percentOf } from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

import { ACCOUNT_STATUS_ROWS, ROLE_RING_SIZE, ROLE_ROWS } from "./admin-dashboard.constants";

/** Every account on the platform by role, and by status underneath. System admins are staff and are not counted. */
export function AccountsByRoleCard({ data }: { data: PlatformOverviewResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const { byRole, byStatus, total } = data.accounts;
  const name = (key: string) => t(`adminDashboard.roles.${key}`);
  const rows: LegendRow[] = ROLE_ROWS.map((row) => ({
    count: byRole[row.key],
    key: row.key,
    label: name(row.key),
    percent: percentOf(byRole[row.key], total),
    tone: row.tone,
  }));

  return (
    <SectionCard description={t("adminDashboard.byRole.subtitle")} id="overview-by-role" title={t("adminDashboard.byRole.title")}>
      <div className="flex flex-wrap items-center gap-x-[22px] gap-y-4">
        <RingChart
          ariaLabel={t("adminDashboard.byRole.ariaLabel")}
          segments={ROLE_ROWS.map((row) => ({ key: row.key, label: `${name(row.key)}: ${byRole[row.key]}`, tone: row.tone, value: byRole[row.key] }))}
          size={ROLE_RING_SIZE}
        >
          <span className="itt-display text-[30px] leading-none font-semibold tabular-nums">{formatCount(total, language)}</span>
          <span className="max-w-[90px] text-center text-[12px] text-muted-foreground">{t("adminDashboard.byRole.unit", { count: total })}</span>
        </RingChart>
        <div className="min-w-[200px] grow">
          <ChartLegend language={language} rows={rows} />
        </div>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-2 border-t border-(--dash-track) p-0 pt-3 text-[12.5px] text-(--status-neutral-fg)">
        {ACCOUNT_STATUS_ROWS.map((row) => (
          <li className="inline-flex items-center gap-1.5" key={row.key}>
            <span aria-hidden className={cn("size-2.5 rounded-[3px]", row.dot)} />
            {t(`adminDashboard.accountStatus.${row.key}`)} <b className="tabular-nums text-foreground">{formatCount(byStatus[row.key], language)}</b>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
