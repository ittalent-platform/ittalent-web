import {
  PanelLeftClose,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router";

import { UserMenu } from "./user-menu";
import { SidebarNavList } from "./sidebar-nav-list";
import { cn } from "@/lib/utils";

const navItems = [
  { end: false, icon: Users, label: "Users", to: "/admin/users" },
] as const;

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }: SidebarProps) {
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
        <Link className="flex min-w-0 items-center gap-2 no-underline text-white" to="/">
          <div className="relative h-7 w-7 overflow-hidden rounded-[7px] border-2 border-[var(--primary)]">
            <div className="absolute inset-[4px] border border-[var(--primary)] opacity-50" />
            <div className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] -translate-y-1/2 rotate-45 bg-[var(--primary)]" />
            <div className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] -translate-y-1/2 -rotate-45 bg-[var(--primary)]" />
          </div>
          <span className={cn("itt-display text-[13px] font-bold tracking-[0.05em]", collapsed && "lg:hidden")}>ITTALENT</span>
        </Link>
        {!collapsed ? (
          <button
            aria-label="Collapse sidebar"
            className="ml-auto hidden size-8 place-items-center rounded-md border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white lg:grid cursor-pointer"
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
        <button
          aria-label="Close menu"
          className="ml-auto grid size-8 place-items-center rounded-md border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white lg:hidden cursor-pointer"
          onClick={onCloseMobile}
          title="Close menu"
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <SidebarNavList collapsed={collapsed} items={navItems} onItemClick={onCloseMobile} />

      <div className={cn("mt-auto border-t border-[var(--sidebar-border)] pt-3 lg:shrink-0", collapsed && "lg:w-full")}>
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
