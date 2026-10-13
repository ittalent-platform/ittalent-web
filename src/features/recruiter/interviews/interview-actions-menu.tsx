import { Ban, CircleCheck, Eye, MoreVertical, UserX, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { interviewPath } from "@/config/routes";
import { cn } from "@/lib/utils";

import type { InterviewItem, StatusAction } from "./interviews.constants";
import { applicantName } from "./interviews.format";
import type { InterviewAction } from "./use-interview-actions";

const ITEM_ICON: Record<StatusAction, LucideIcon> = { cancel: Ban, complete: CircleCheck, noShow: UserX };
const ITEM_VARIANT = { cancel: "destructive", complete: "success", noShow: "default" } as const satisfies Record<StatusAction, "default" | "destructive" | "success">;

export type StatusMenuItem = { action: StatusAction; disabled: boolean };

/**
 * The status actions an interview offers. Only a scheduled interview has any: it can be cancelled at any time,
 * and once it has ended it can be marked completed or no-show (completing shows, disabled, until then).
 */
export function statusMenuItems(interview: Pick<InterviewItem, "canComplete" | "status">): StatusMenuItem[] {
  if (interview.status !== "scheduled") return [];
  return [
    { action: "complete", disabled: !interview.canComplete },
    ...(interview.canComplete ? [{ action: "noShow" as const, disabled: false }] : []),
    { action: "cancel", disabled: false },
  ];
}

type InterviewActionsMenuProps = {
  /** Actions the screen already shows as buttons of its own. */
  hide?: readonly StatusAction[];
  interview: InterviewItem;
  onAction: (action: InterviewAction, interview: InterviewItem) => void;
  /** "row" is the quiet icon of a table row; "page" is the bordered square beside a page's buttons. */
  placement?: "page" | "row";
  /** The row menu starts with a way to the interview's page; on that page it would point to itself. */
  withView?: boolean;
};

/** The "⋮" menu of an interview: the actions its status allows. */
export function InterviewActionsMenu({ hide = [], interview, onAction, placement = "row", withView = true }: InterviewActionsMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = statusMenuItems(interview).filter(({ action }) => !hide.includes(action));
  if (!withView && items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("interviews.actions.rowActions", { name: applicantName(interview.applicant) })}
          className={cn(
            "grid cursor-pointer place-items-center text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
            placement === "page" ? "size-11 rounded-xl border border-border bg-card" : "size-8 rounded-lg",
          )}
          type="button"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        {withView ? (
          <DropdownMenuItem onSelect={() => navigate(interviewPath(interview.id))}>
            <Eye className="size-4 text-muted-foreground" />
            {t("interviews.actions.view")}
          </DropdownMenuItem>
        ) : null}
        {items.map(({ action, disabled }) => {
          const Icon = ITEM_ICON[action];
          return (
            <DropdownMenuItem
              className="justify-between"
              disabled={disabled}
              key={action}
              onSelect={() => onAction(action, interview)}
              reason={disabled ? t("interviews.actions.afterItEnds") : undefined}
              variant={disabled ? "default" : ITEM_VARIANT[action]}
            >
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Icon className="size-4" />
                {t(`interviews.actions.${action}`)}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
