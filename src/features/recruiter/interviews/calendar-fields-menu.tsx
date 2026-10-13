import { Check, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CALENDAR_FIELDS, type CalendarField } from "./interviews.constants";

type CalendarFieldsMenuProps = {
  fields: ReadonlySet<CalendarField>;
  onToggle: (field: CalendarField) => void;
};

/** Chooses what each interview chip says. At least one field stays on, or the chips would be blank. */
export function CalendarFieldsMenu({ fields, onToggle }: CalendarFieldsMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-muted"
          type="button"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          {t("interviews.calendar.fields")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {CALENDAR_FIELDS.map((field) => {
          const checked = fields.has(field);
          return (
            <DropdownMenuItem
              aria-checked={checked}
              disabled={checked && fields.size === 1}
              key={field}
              onSelect={(event) => {
                event.preventDefault();
                onToggle(field);
              }}
              role="menuitemcheckbox"
            >
              <span className={cn("grid size-4 shrink-0 place-items-center rounded border border-(--border-strong)", checked && "border-primary bg-primary text-primary-foreground")}>
                {checked ? <Check aria-hidden className="size-3" /> : null}
              </span>
              {t(`interviews.calendar.field.${field}`)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
