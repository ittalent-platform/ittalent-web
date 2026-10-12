import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export type UsersFilterChip = { key: string; label: string; names: string[]; maxNames?: number };

/** "HR, Enterprise admin", or "Nova Fintech +2" once a group lists more names than it shows. */
export function chipValue(names: string[], maxNames = names.length): string {
  return names.length > maxNames ? `${names.slice(0, maxNames).join(", ")} +${names.length - maxNames}` : names.join(", ");
}

export function UsersFilterChips({ chips, onClearAll, onRemove, summary }: { chips: UsersFilterChip[]; onClearAll: () => void; onRemove: (key: string) => void; summary?: string }) {
  const { t } = useTranslation();
  if (chips.length === 0) return summary ? <p className="text-[13px] text-muted-foreground">{summary}</p> : null;
  return (
    <ul aria-label={t("adminUsers.list.activeFilters")} className="flex flex-wrap items-center gap-2">
      {summary ? <li className="mr-1 text-[13px] text-muted-foreground">{summary}</li> : null}
      {chips.map((chip) => (
        <li className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card pl-3 pr-1 text-[13px]" key={chip.key}>
          <span className="font-medium text-foreground">{chip.label}: {chipValue(chip.names, chip.maxNames)}</span>
          <button
            aria-label={t("adminUsers.list.removeFilter", { filter: chip.label })}
            className="grid size-6 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted"
            onClick={() => onRemove(chip.key)}
            type="button"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </li>
      ))}
      <li>
        <Button onClick={onClearAll} size="sm" type="button" variant="link">
          {t("adminUsers.list.clearAll")}
        </Button>
      </li>
    </ul>
  );
}
