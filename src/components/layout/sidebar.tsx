import {
  Building2,
  PanelLeftClose,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";

import { UserMenu } from "./user-menu";
import { SidebarNavList } from "./sidebar-nav-list";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const navItems = [
  { end: false, icon: Users, labelKey: "sidebar.users", to: "/admin/users" },
  { end: false, icon: Building2, labelKey: "sidebar.enterprises", to: "/admin/enterprises" },
] as const;

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-66 max-w-[85vw] flex-col overflow-y-auto bg-(--sidebar-surface) px-2.5 py-5 text-white transition-transform duration-200 ease-out",
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
            className="ml-auto hidden size-8 place-items-center rounded-md border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white lg:grid cursor-pointer"
            onClick={onToggleCollapsed}
            title={t("sidebar.collapse")}
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
        <button
          aria-label={t("sidebar.closeMenu")}
          className="ml-auto grid size-8 place-items-center rounded-md border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white lg:hidden cursor-pointer"
          onClick={onCloseMobile}
          title={t("sidebar.closeMenu")}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <SidebarNavList collapsed={collapsed} items={navItems.map(({ labelKey, ...item }) => ({ ...item, label: t(labelKey) }))} onItemClick={onCloseMobile} />

      <div className={cn("mt-auto border-t border-[var(--sidebar-border)] pt-3 lg:shrink-0", collapsed && "lg:w-full")}>
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
