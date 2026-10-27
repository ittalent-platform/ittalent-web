import {
  Award,
  Bookmark,
  Bell,
  Briefcase,
  FileText,
  ShieldAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";

import { APPLICATIONS_PATH, MY_REPORTS_PATH, NOTIFICATIONS_PATH, PROFILE_PATH, SAVED_JOBS_PATH } from "@/config/routes";
import { cn } from "@/lib/utils";

type AccountNavGroup = {
  labelKey: string;
  items: Array<{ icon: LucideIcon; labelKey: string; to: string }>;
};

// Only pages that exist today; the design's other entries arrive with their features.
const ACCOUNT_NAV: AccountNavGroup[] = [
  {
    items: [
      { icon: Briefcase, labelKey: "accountNav.myApplications", to: APPLICATIONS_PATH },
      { icon: Bookmark, labelKey: "accountNav.savedJobs", to: SAVED_JOBS_PATH },
    ],
    labelKey: "accountNav.jobSearch",
  },
  {
    items: [
      { icon: UserRound, labelKey: "accountNav.myProfile", to: PROFILE_PATH },
      { icon: FileText, labelKey: "accountNav.documents", to: "/documents" },
      { icon: Award, labelKey: "accountNav.certificates", to: "/certificates" },
    ],
    labelKey: "accountNav.myProfile",
  },
  {
    items: [
      { icon: Bell, labelKey: "accountNav.notifications", to: NOTIFICATIONS_PATH },
      { icon: ShieldAlert, labelKey: "accountNav.myReports", to: MY_REPORTS_PATH },
    ],
    labelKey: "accountNav.account",
  },
];

/** Candidate account pages: a section menu on the left, the page on the right. */
export function CandidateAccountLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <nav
        aria-label={t("accountNav.label")}
        className="flex shrink-0 flex-col gap-5 lg:w-72"
      >
        {ACCOUNT_NAV.map((group) => (
          <div className="flex flex-col gap-1" key={group.labelKey}>
            <p className="px-3 pb-1 eyebrow">{t(group.labelKey)}</p>
            {group.items.map(({ icon: Icon, labelKey, to }) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] text-foreground hover:bg-muted",
                    isActive &&
                      "bg-accent font-semibold text-accent-foreground hover:bg-accent",
                  )
                }
                key={to}
                to={to}
              >
                <Icon aria-hidden className="size-[18px]" />
                {t(labelKey)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {/* A column with the same gap as the marketplace <main>, so a page made of sibling blocks (header, toolbar, table) is spaced as designed. */}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Outlet />
      </div>
    </div>
  );
}
