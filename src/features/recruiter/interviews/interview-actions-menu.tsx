import { Eye, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { interviewPath } from "@/config/routes";

import type { InterviewItem } from "./interviews.constants";
import { applicantName } from "./interviews.format";

/** The "⋮" menu of a table row: the actions an interview allows in its current status. */
export function InterviewActionsMenu({ interview }: { interview: InterviewItem }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("interviews.actions.rowActions", { name: applicantName(interview.applicant) })}
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          type="button"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[210px]">
        <DropdownMenuItem onSelect={() => navigate(interviewPath(interview.id))}>
          <Eye className="size-4 text-muted-foreground" />
          {t("interviews.actions.view")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
