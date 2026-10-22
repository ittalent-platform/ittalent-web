import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Inbox,
  PanelLeftClose,
  Users,
  X,
} from "lucide-react";

import { ADMIN_BROADCASTS_PATH, RECRUITER_APPLICATIONS_PATH, RECRUITER_COMPANY_PROFILE_PATH, RECRUITER_EMPLOYEES_PATH, RECRUITER_INTERVIEWS_PATH, RECRUITER_JOB_POSTINGS_PATH } from "@/config/routes";
import { SidebarNavList } from "./sidebar-nav-list";
import { BrandLogo } from "./brand-logo";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useEnterpriseRegistrationsListQuery } from "@/features/enterprise-registration/enterprise-registration.queries";

// const adminNavItems = [
//   { end: false, icon: Users, label: "Users", to: "/admin/users" },
//   {
//     end: false,
//     icon: BriefcaseBusiness,
//     label: "Job postings",
//     to: "/admin/job-postings",
//   },
// ] as const;

// const recruiterNavItems = [
//   {
//     end: false,
//     icon: BriefcaseBusiness,
//     label: "Job postings",
//     to: "/recruiter/job-postings",
//   },
// ] as const;

const adminNavItems = [
  { end: false, icon: Users, labelKey: "sidebar.users", to: "/admin/users" },
  { end: false, icon: ClipboardCheck, labelKey: "sidebar.registrations", to: "/admin/registrations" },
  { end: false, icon: Building2, labelKey: "sidebar.enterprises", to: "/admin/enterprises" },
  { end: false, icon: Bell, labelKey: "sidebar.broadcasts", to: ADMIN_BROADCASTS_PATH },
] as const;

const recruiterNavItems = [
  { end: false, icon: BriefcaseBusiness, labelKey: "sidebar.jobPostings", to: RECRUITER_JOB_POSTINGS_PATH },
  { end: false, icon: Inbox, labelKey: "sidebar.applications", to: RECRUITER_APPLICATIONS_PATH },
  { end: false, icon: CalendarDays, labelKey: "sidebar.interviews", to: RECRUITER_INTERVIEWS_PATH },
  { end: false, icon: Users, labelKey: "sidebar.employees", to: RECRUITER_EMPLOYEES_PATH },
  { end: false, icon: Building2, labelKey: "sidebar.companyProfile", to: RECRUITER_COMPANY_PROFILE_PATH },
] as const;

type SidebarProps = {
  actor: "admin" | "recruiter";
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

// export function Sidebar({
//   actor,
//   collapsed,
//   mobileOpen,
//   onCloseMobile,
//   onToggleCollapsed,
// }: SidebarProps) {
export function Sidebar({ actor, collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  const pendingRegistrationsQuery = useEnterpriseRegistrationsListQuery({
    enabled: actor === "admin",
    page: 1,
    limit: 1,
    status: "pending_review",
  });
  const pendingCount = pendingRegistrationsQuery.data?.total;

  const navItems = actor === "recruiter" ? recruiterNavItems : adminNavItems;
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-66 max-w-[85vw] flex-col overflow-y-auto bg-sidebar px-2.5 py-5 text-sidebar-foreground transition-transform duration-200 ease-out",
        "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-h-screen lg:w-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed && "lg:items-center",
      )}
    >
      <div className={cn("flex items-center gap-2 px-2 pb-4 pt-1", collapsed && "lg:px-0")}>
        <BrandLogo tone="inverse" wordmarkClassName={cn("text-[13px]", collapsed && "lg:hidden")} />
        {!collapsed ? (
          <button
            aria-label={t("sidebar.collapse")}
            className="ml-auto hidden size-8 place-items-center rounded-md border border-white/10 text-sidebar-foreground/60 transition hover:bg-white/5 hover:text-sidebar-foreground lg:grid cursor-pointer"
            onClick={onToggleCollapsed}
            title={t("sidebar.collapse")}
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
        <button
          aria-label={t("sidebar.closeMenu")}
          className="ml-auto grid size-8 place-items-center rounded-md border border-white/10 text-sidebar-foreground/60 transition hover:bg-white/5 hover:text-sidebar-foreground lg:hidden cursor-pointer"
          onClick={onCloseMobile}
          title={t("sidebar.closeMenu")}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <SidebarNavList
        collapsed={collapsed}
        items={navItems.map(({ labelKey, ...item }) => ({
          ...item,
          label: t(labelKey),
          badge: item.to === "/admin/registrations" ? pendingCount : undefined,
        }))}
        onItemClick={onCloseMobile}
      />

      <div
        className={cn(
          "mt-auto border-t border-sidebar-border pt-3 lg:shrink-0",
          collapsed && "lg:w-full",
        )}
      >
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
