import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { PlatformOverviewResponse } from "@/api/generated/types.gen";
import { CardLink } from "@/components/common/card-link";
import { SectionCard } from "@/components/common/section-card";
import { ADMIN_REGISTRATIONS_PATH, adminRegistrationPath } from "@/config/routes";
import { formatShortDay } from "@/lib/dashboard-format";
import { ictDayKey } from "@/lib/format";
import { cn } from "@/lib/utils";

import { WAITING_ALERT_DAYS } from "./admin-dashboard.constants";

/** Company sign-ups waiting for a decision, the longest wait first, each opening its review page. */
export function WaitingForReviewCard({ data }: { data: PlatformOverviewResponse }) {
  const { i18n, t } = useTranslation();
  const language = i18n.language;

  return (
    <SectionCard
      actions={<CardLink to={ADMIN_REGISTRATIONS_PATH}>{t("adminDashboard.waiting.viewAll")}</CardLink>}
      description={t("adminDashboard.waiting.subtitle")}
      id="overview-waiting"
      title={t("adminDashboard.waiting.title")}
    >
      {data.waitingForReview.length === 0 ? (
        <p className="m-0 py-3 text-[13.5px] text-muted-foreground">{t("adminDashboard.waiting.empty")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {data.waitingForReview.map((item) => (
            <li className="border-t border-line-muted first:border-t-0" key={item.id}>
              <Link className="flex items-center justify-between gap-3 py-3 transition hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none" to={adminRegistrationPath(item.id)}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[14px] font-semibold text-foreground">{item.companyName}</span>
                  <span className="text-[12.5px] text-muted-foreground">{t("adminDashboard.waiting.submitted", { date: formatShortDay(ictDayKey(item.submittedAt), language) })}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[12.5px] tabular-nums",
                    item.waitingDays >= WAITING_ALERT_DAYS ? "bg-(--status-warning-bg) font-semibold text-(--status-warning-fg)" : "text-(--status-neutral-fg)",
                  )}
                >
                  {item.waitingDays === 0 ? t("adminDashboard.waiting.today") : t("adminDashboard.waiting.days", { count: item.waitingDays })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
