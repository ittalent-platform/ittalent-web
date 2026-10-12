import { Award, Briefcase, FileText, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";

import { cn } from "@/lib/utils";

type AccountNavGroup = { labelKey: string; items: Array<{ icon: LucideIcon; labelKey: string; to: string }> };

// Only pages that exist today; the design's other entries arrive with their features.
const ACCOUNT_NAV: AccountNavGroup[] = [
  { items: [{ icon: Briefcase, labelKey: "accountNav.myApplications", to: "/my-applications" }], labelKey: "accountNav.jobSearch" },
  {
    items: [
      { icon: FileText, labelKey: "accountNav.documents", to: "/documents" },
      { icon: Award, labelKey: "accountNav.certificates", to: "/certificates" },
    ],
    labelKey: "accountNav.myProfile",
  },
];

/** Candidate account pages: a section menu on the left, the page on the right. */
export function CandidateAccountLayout() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pb-12 pt-8 sm:px-8 lg:flex-row lg:px-12">
      <nav aria-label={t("accountNav.label")} className="flex shrink-0 flex-col gap-5 lg:w-[220px]">
        {ACCOUNT_NAV.map((group) => (
          <div className="flex flex-col gap-1" key={group.labelKey}>
            <p className="px-3 pb-1 eyebrow">{t(group.labelKey)}</p>
            {group.items.map(({ icon: Icon, labelKey, to }) => (
              <NavLink
                className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] text-foreground hover:bg-muted", isActive && "bg-muted font-semibold")}
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
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
