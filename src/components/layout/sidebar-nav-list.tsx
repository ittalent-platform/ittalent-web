import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  end: boolean;
  icon: LucideIcon;
  label: string;
  to: string | null;
}

export function SidebarNavList({
  activeClassName = "bg-primary text-primary-foreground",
  className,
  collapsed,
  disabledClassName = "text-white/45",
  iconClassName = "size-4.5",
  inactiveClassName = "text-white/60 hover:bg-white/5 hover:text-white",
  itemBaseClassName = "flex items-center gap-3 rounded-[0.75rem] px-2.5 py-2.5 text-[0.95rem] font-medium",
  items,
  onItemClick,
}: {
  activeClassName?: string;
  className?: string;
  collapsed?: boolean;
  disabledClassName?: string;
  iconClassName?: string;
  inactiveClassName?: string;
  itemBaseClassName?: string;
  items: readonly SidebarNavItem[];
  onItemClick?: () => void;
}) {
  return (
    <nav className={cn("space-y-1", collapsed && "lg:w-full", className)}>
      {items.map((item) => {
        const Icon = item.icon;

        if (!item.to) {
          return (
            <span
              aria-disabled="true"
              className={cn(itemBaseClassName, disabledClassName, collapsed && "lg:justify-center lg:px-0")}
              key={item.label}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={iconClassName} />
              <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
            </span>
          );
        }

        return (
          <NavLink
            className={({ isActive }) =>
              cn(
                itemBaseClassName,
                "transition-colors",
                collapsed && "lg:justify-center lg:px-0",
                isActive ? activeClassName : inactiveClassName,
              )
            }
            end={item.end}
            key={item.label}
            onClick={onItemClick}
            title={collapsed ? item.label : undefined}
            to={item.to}
          >
            <Icon className={iconClassName} />
            <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
