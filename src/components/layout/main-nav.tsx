import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type MainNavItem = { labelKey: string; to: string };

/** Pill navigation on a Sand track; the active item is the single Ember-filled pill. */
export function MainNav({ items }: { items: readonly MainNavItem[] }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("nav.main")} className="hidden gap-1 rounded-full bg-muted p-1 md:flex">
      {items.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn("flex h-9 items-center rounded-full px-[18px] text-[13.5px] font-semibold", isActive ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:text-foreground")
          }
          end
          key={item.to}
          to={item.to}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
