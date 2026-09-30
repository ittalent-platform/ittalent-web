import { Eye, MoreVertical, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Row menu: "View detail" always, "Withdraw" only while the status still allows it (BR-APP-004). */
export function ApplicationRowActions({ displayId, canWithdraw, onView, onWithdraw }: { displayId: string; canWithdraw: boolean; onView: () => void; onWithdraw: () => void }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={t("applications.rowActions", { id: displayId })} className="grid size-8 cursor-pointer place-items-center rounded-xl text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40" type="button">
          <MoreVertical aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl py-1">
        <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px]" onSelect={onView}><Eye className="size-4" />{t("applications.viewDetail")}</DropdownMenuItem>
        {canWithdraw ? <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px] text-destructive focus:text-destructive" onSelect={onWithdraw}><Undo2 className="size-4" />{t("applications.withdraw")}</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
